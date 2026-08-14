import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/moderation
 * 
 * Retrieves flagged listings and pending fraud alerts for admin review.
 * Only accessible to users with user_type = 'admin'.
 * 
 * Query params:
 *   ?type=listings    — flagged/suspended listings
 *   ?type=alerts      — pending fraud alerts
 *   ?type=all         — both (default)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // 2. Determine what to fetch
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type') || 'all';

    const result: Record<string, any> = { success: true };

    // 3. Fetch flagged listings
    if (queryType === 'listings' || queryType === 'all') {
      const { data: flaggedListings, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id, title, expected_price, status, created_at,
          category_id, upazila_id, district_id,
          profiles!created_by_user_id (id, full_name, user_type, risk_score, is_verified),
          categories (name_en),
          districts (name_en),
          upazilas (name_en)
        `)
        .in('status', ['flagged_review', 'suspended'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (listingsError) {
        console.error('[moderation] Listings query error:', listingsError.message);
      }

      result.flaggedListings = (flaggedListings || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        expectedPrice: Number(row.expected_price),
        status: row.status,
        createdAt: row.created_at,
        categoryName: row.categories?.name_en || 'Unknown',
        districtName: row.districts?.name_en || 'Unknown',
        upazilaName: row.upazilas?.name_en || 'Unknown',
        seller: row.profiles ? {
          id: row.profiles.id,
          name: row.profiles.full_name,
          userType: row.profiles.user_type,
          riskScore: row.profiles.risk_score,
          isVerified: row.profiles.is_verified,
        } : null,
      }));
    }

    // 4. Fetch pending KYC users
    if (queryType === 'kyc' || queryType === 'all') {
      const { data: kycUsers, error: kycError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, user_type, nid_number, district_id, upazila_id, created_at')
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (kycError) {
        console.error('[moderation] KYC query error:', kycError.message);
      }

      result.kycUsers = (kycUsers || []).map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        userType: row.user_type,
        nidNumber: row.nid_number ? `****${row.nid_number.slice(-4)}` : null,
        districtId: row.district_id,
        upazilaId: row.upazila_id,
        createdAt: row.created_at,
      }));
    }

    // 5. Fetch pending fraud alerts
    if (queryType === 'alerts' || queryType === 'all') {
      const { data: alerts, error: alertsError } = await supabase
        .from('fraud_alerts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);

      if (alertsError) {
        console.error('[moderation] Alerts query error:', alertsError.message);
      }

      result.fraudAlerts = (alerts || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        listingId: row.listing_id,
        alertType: row.alert_type,
        severity: row.severity,
        description: row.description,
        metadata: row.metadata,
        status: row.status,
        createdAt: row.created_at,
      }));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[moderation] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/moderation
 * 
 * Admin actions on flagged listings and fraud alerts.
 * 
 * Body:
 *   { action: 'approve_listing', listingId: string }
 *   { action: 'reject_listing',  listingId: string }
 *   { action: 'dismiss_alert',   alertId: string }
 *   { action: 'action_alert',    alertId: string }
 *   { action: 'adjust_risk',     userId: string, riskScore: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // 2. Parse action body
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'approve_listing': {
        const { listingId } = body;
        if (!listingId) {
          return NextResponse.json({ success: false, error: 'Missing listingId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('listings')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', listingId)
          .in('status', ['flagged_review', 'suspended'])
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching flagged listing was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Listing approved and set to active.' });
      }

      case 'reject_listing': {
        const { listingId } = body;
        if (!listingId) {
          return NextResponse.json({ success: false, error: 'Missing listingId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('listings')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', listingId)
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching listing was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Listing rejected.' });
      }

      case 'dismiss_alert': {
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({ success: false, error: 'Missing alertId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('fraud_alerts')
          .update({ status: 'dismissed' })
          .eq('id', alertId)
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching alert was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Alert dismissed.' });
      }

      case 'action_alert': {
        const { alertId } = body;
        if (!alertId) {
          return NextResponse.json({ success: false, error: 'Missing alertId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('fraud_alerts')
          .update({ status: 'actioned' })
          .eq('id', alertId)
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching alert was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Alert marked as actioned.' });
      }

      case 'verify_kyc': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Missing userId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_verified: true, nid_verified: true })
          .eq('id', userId)
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching profile was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'KYC verified.' });
      }

      case 'reject_kyc': {
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Missing userId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_verified: false, nid_verified: false })
          .eq('id', userId)
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching profile was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'KYC rejected.' });
      }

      case 'adjust_risk': {
        const { userId, riskScore } = body;
        if (!userId || typeof riskScore !== 'number' || riskScore < 0) {
          return NextResponse.json({ success: false, error: 'Missing userId or invalid riskScore.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('profiles')
          .update({ risk_score: riskScore })
          .eq('id', userId)
          .select('id');

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching profile was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: `Risk score updated to ${riskScore}.` });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    console.error('[moderation] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
