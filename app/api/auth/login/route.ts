import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/client/api';

/**
 * POST /api/auth/login
 * 
 * Server-side authentication. Accepts phone + password,
 * authenticates via Supabase Auth, returns user profile.
 * Session cookies are set automatically by the Supabase SSR client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || normalizedPhone.length < 11) {
      return NextResponse.json(
        { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'পাসওয়ার্ড বা পিন কমপক্ষে ৬ অক্ষরের হতে হবে' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const email = `${normalizedPhone}@amararoth.com`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'ফোন নম্বর বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      );
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone, full_name, user_type, is_verified, avatar_url, division_id, district_id, upazila_id, address, risk_score, phone_verified, nid_verified')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'ব্যবহারকারীর প্রোফাইল পাওয়া যায়নি' },
        { status: 404 }
      );
    }

    // Log device footprint
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    try {
      await supabase.from('user_device_logs').insert({
        user_id: profile.id,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || null,
        action: 'login',
      });
    } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        phone: profile.phone,
        fullName: profile.full_name,
        userType: profile.user_type,
        isVerified: profile.is_verified,
        avatarUrl: profile.avatar_url,
        divisionId: profile.division_id,
        districtId: profile.district_id,
        upazilaId: profile.upazila_id,
        address: profile.address,
        kycStatus: profile.is_verified ? 'verified' : (profile.nid_verified ? 'pending' : 'pending'),
      },
    });
  } catch (err: any) {
    console.error('[auth/login] Error:', err);
    return NextResponse.json(
      { success: false, error: 'সার্ভার ত্রুটি হয়েছে' },
      { status: 500 }
    );
  }
}
