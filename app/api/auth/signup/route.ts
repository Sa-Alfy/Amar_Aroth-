import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/signup
 * 
 * Server-side user registration. Creates Supabase Auth user + profile row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, fullName, phone, password, nidNumber, divisionId, districtId, upazilaId, address } = body;

    // Validation
    if (!phone || phone.trim().length < 11) {
      return NextResponse.json({ success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' }, { status: 400 });
    }
    if (!fullName || fullName.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'আপনার পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)' }, { status: 400 });
    }
    if (!nidNumber || nidNumber.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ success: false, error: 'পাসওয়ার্ড বা পিন কমপক্ষে ৪ অক্ষরের হতে হবে' }, { status: 400 });
    }

    const supabase = await createClient();
    const email = `${phone.trim()}@aaroth.local`;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ success: false, error: 'এই ফোন নম্বরে ইতিমধ্যে একাউন্ট আছে' }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ success: false, error: 'ব্যবহারকারী তৈরি করা সম্ভব হয়নি' }, { status: 500 });
    }

    // Map role name to DB user_type
    const userTypeMap: Record<string, string> = {
      farmer: 'farmer',
      agent: 'dealer',
      arathdar: 'arathdar',
      dealer: 'dealer',
      aggregator: 'aggregator',
    };
    const userType = userTypeMap[role] || 'farmer';

    // Create profile row
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      phone: phone.trim(),
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
      console.error('[auth/signup] Profile insert error:', profileError);
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
        phone: phone.trim(),
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
