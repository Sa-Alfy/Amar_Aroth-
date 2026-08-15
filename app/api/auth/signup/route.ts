import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/client/api';

/**
 * POST /api/auth/signup
 * 
 * Server-side user registration. Creates Supabase Auth user + profile row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, fullName, phone, password, nidNumber, divisionId, districtId, upazilaId, address } = body;
    const normalizedPhone = normalizePhone(phone);

    // Validation
    if (!normalizedPhone || normalizedPhone.length < 11) {
      return NextResponse.json({ success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' }, { status: 400 });
    }
    if (!fullName || fullName.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'আপনার পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)' }, { status: 400 });
    }
    if (!nidNumber || nidNumber.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'পাসওয়ার্ড বা পিন কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
    }

    const supabase = await createClient();
    const email = `${normalizedPhone}@amararoth.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      const em = String(authError.message || '').toLowerCase();

      if (em.includes('rate limit') || em.includes('rate limit exceeded')) {
        return NextResponse.json(
          { success: false, error: 'অল্প সময়ের মধ্যে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' },
          { status: 429 }
        );
      }

      if (em.includes('already registered') || em.includes('already exists') || em.includes('user exists')) {
        return NextResponse.json({ success: false, error: 'এই ফোন নম্বরে ইতিমধ্যে একাউন্ট আছে' }, { status: 409 });
      }

      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    if (!authData.user || (Array.isArray(authData.user.identities) && authData.user.identities.length === 0)) {
      return NextResponse.json({ success: false, error: 'এই ফোন নম্বরে ইতিমধ্যে একাউন্ট আছে' }, { status: 409 });
    }

    // Direct role to DB user_type mapping (farmer, arathdar, dokandar)
    const userType = role || 'farmer';

    // Create profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      phone: normalizedPhone,
      full_name: fullName.trim(),
      user_type: userType,
      nid_number: nidNumber.trim(),
      division_id: divisionId || null,
      district_id: districtId || null,
      upazila_id: upazilaId || null,
      address: address || null,
      is_verified: false,
    });

    if (profileError) {
      console.error('[auth/signup] Orphaned auth account profile insert failed. user_id:', authData.user.id, profileError);
      return NextResponse.json({ success: false, error: 'প্রোফাইল তৈরি করতে ত্রুটি হয়েছে' }, { status: 500 });
    }

    // Log device footprint
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    try {
      await supabase.from('user_device_logs').insert({
        user_id: authData.user.id,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || null,
        action: 'signup',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        phone: normalizedPhone,
        fullName: fullName.trim(),
        userType: userType,
        isVerified: false,
        kycStatus: 'pending',
      },
    });
  } catch (err: any) {
    console.error('[auth/signup] Error:', err);
    return NextResponse.json({ success: false, error: 'সার্ভার ত্রুটি হয়েছে' }, { status: 500 });
  }
}
