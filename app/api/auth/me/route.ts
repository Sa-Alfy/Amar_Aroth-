import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/me
 * 
 * Returns current authenticated user's profile from the server-side session.
 * Replaces all localStorage-based getStoredUser() calls.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, user: null });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone, full_name, user_type, is_verified, nid_number, avatar_url, division_id, district_id, upazila_id, address, risk_score, phone_verified, nid_verified')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        phone: profile.phone,
        fullName: profile.full_name,
        userType: profile.user_type,
        isVerified: profile.is_verified,
        nidNumber: profile.nid_number,
        avatarUrl: profile.avatar_url,
        divisionId: profile.division_id,
        districtId: profile.district_id,
        upazilaId: profile.upazila_id,
        address: profile.address,
        kycStatus: profile.is_verified ? 'verified' : 'pending',
      },
    });
  } catch (err: any) {
    console.error('[auth/me] Error:', err);
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}
