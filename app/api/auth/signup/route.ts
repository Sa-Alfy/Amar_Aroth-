import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizePhoneForAuth(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;
  if (digits.startsWith('880')) return `+${digits}`;
  if (digits.startsWith('0')) return `+88${digits.slice(1)}`;
  return `+${digits}`;
}

/**
 * POST /api/auth/signup
 * 
 * Server-side user registration. Creates Supabase Auth user + profile row.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, fullName, phone, password, nidNumber, divisionId, districtId, upazilaId, address } = body;
    const sanitizedPhone = phone?.trim();

    // Validation
    if (!sanitizedPhone || sanitizedPhone.length < 11) {
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

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', sanitizedPhone)
      .maybeSingle();

    if (existingProfileError && existingProfileError.code !== 'PGRST116') {
      console.error('[auth/signup] Profile lookup failed:', existingProfileError);
    }

    if (existingProfile) {
      return NextResponse.json({ success: false, error: 'এই ফোন নম্বরে ইতিমধ্যে একাউন্ট আছে' }, { status: 409 });
    }

    const authPhone = normalizePhoneForAuth(sanitizedPhone);

    // Create auth user using the phone number, which matches the app's phone-first identity model
    // and avoids repeated pseudo-email rate-limit hits.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      phone: authPhone,
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

      // Supabase may respond with a message stating phone-based signups are disabled
      if (em.includes('phone') && em.includes('disabled') || em.includes('phone signups are disabled') || em.includes('phone signups disabled')) {
        return NextResponse.json(
          {
            success: false,
            error: 'ফোন দিয়ে নিবন্ধন অক্ষম: আপনার Supabase প্রজেক্টে ফোন সাইনআপ সক্ষম করা নেই। ডেভ-টিম কনফিগারেশন চেক করুন।',
          },
          { status: 403 }
        );
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
      console.error('[auth/signup] Orphaned auth account profile insert failed. user_id:', authData.user.id, profileError);
      // TODO: delete this orphaned auth user via a service-role client/admin-only dependency.
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
