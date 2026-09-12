import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { KYC_BUCKET } from '@/lib/server/kycUpload';

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

    // 4. Fetch the KYC queue.
    //
    //    An admin reviewing an identity document needs the document. The NID
    //    number is returned in full here — masking it makes the queue useless,
    //    and this branch is already behind the admin check above. The photos
    //    live in a private bucket, so they come back as short-lived signed URLs
    //    minted with the service role client; the bucket itself stays closed.
    if (queryType === 'kyc' || queryType === 'all') {
      const statusFilter = searchParams.get('status') || 'pending';

      let kycQuery = supabase
        .from('profiles')
        .select(`
          id, full_name, phone, user_type, nid_number, address, risk_score,
          is_verified, nid_verified, kyc_status, created_at,
          nid_front_url, nid_back_url,
          districts (name_en, name_bn),
          upazilas (name_en, name_bn)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter === 'pending') kycQuery = kycQuery.eq('kyc_status', 'pending');
      else if (statusFilter === 'verified') kycQuery = kycQuery.eq('kyc_status', 'verified');
      else if (statusFilter === 'rejected') kycQuery = kycQuery.eq('kyc_status', 'rejected');

      const { data: kycUsers, error: kycError } = await kycQuery;

      if (kycError) {
        console.error('[moderation] KYC query error:', kycError.message);
      }

      const rows = (kycUsers || []) as any[];
      const paths = rows.flatMap((row) => [row.nid_front_url, row.nid_back_url]).filter(Boolean);
      const signedByPath: Record<string, string> = {};

      if (paths.length > 0) {
        const admin = createAdminClient();
        // 10 minutes: long enough to review a queue, short enough that a copied
        // link is worthless by the time it leaves the building.
        const { data: signed, error: signError } = await admin.storage
          .from(KYC_BUCKET)
          .createSignedUrls(paths, 600);

        if (signError) {
          console.error('[moderation] Signing NID URLs failed:', signError.message);
        }
        for (const entry of signed || []) {
          if (entry.path && entry.signedUrl) signedByPath[entry.path] = entry.signedUrl;
        }
      }

      result.kycUsers = rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        userType: row.user_type,
        nidNumber: row.nid_number || null,
        address: row.address || null,
        districtName: row.districts?.name_bn || row.districts?.name_en || null,
        upazilaName: row.upazilas?.name_bn || row.upazilas?.name_en || null,
        riskScore: row.risk_score ?? 0,
        isVerified: Boolean(row.is_verified),
        nidVerified: Boolean(row.nid_verified),
        kycStatus: row.kyc_status,
        createdAt: row.created_at,
        // Absent when the account predates NID storage, which the UI must show
        // rather than hide — an empty frame is a reason not to approve.
        nidFrontImageUrl: row.nid_front_url ? signedByPath[row.nid_front_url] || null : null,
        nidBackImageUrl: row.nid_back_url ? signedByPath[row.nid_back_url] || null : null,
        hasDocuments: Boolean(row.nid_front_url && row.nid_back_url),
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
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
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
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
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
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
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
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
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
        // kyc_status must move with is_verified. Leaving it 'pending' kept an
        // approved user in the queue forever and made the filter meaningless.
        const { data, error } = await supabase
          .from('profiles')
          .update({
            is_verified: true,
            nid_verified: true,
            kyc_status: 'verified',
            kyc_reviewed_by: user.id,
            kyc_reviewed_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select('id');

        if (error) {
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
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
          .update({
            is_verified: false,
            nid_verified: false,
            kyc_status: 'rejected',
            kyc_reviewed_by: user.id,
            kyc_reviewed_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select('id');

        if (error) {
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
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
          console.error(`[moderation] ${action} failed:`, error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching profile was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: `Risk score updated to ${riskScore}.` });
      }

      case 'reset_kyc': {
        // Back to the queue: the documents were unreadable, not fraudulent.
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Missing userId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_verified: false, nid_verified: false, kyc_status: 'pending' })
          .eq('id', userId)
          .select('id');

        if (error) {
          console.error('[moderation] reset_kyc failed:', error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching profile was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Moved back to the pending queue.' });
      }

      case 'set_user_type': {
        // Tier corrections only. 'admin' is deliberately not settable here —
        // minting an admin stays a service-role operation run by a human.
        const { userId, userType } = body;
        const ALLOWED = ['farmer', 'arathdar', 'dokandar'];

        if (!userId || typeof userType !== 'string' || !ALLOWED.includes(userType)) {
          return NextResponse.json({ success: false, error: 'ব্যবহারকারীর ধরন সঠিক নয়।' }, { status: 400 });
        }
        if (userId === user.id) {
          return NextResponse.json({ success: false, error: 'নিজের ধরন পরিবর্তন করা যাবে না।' }, { status: 400 });
        }

        const { data: target } = await supabase
          .from('profiles').select('user_type').eq('id', userId).single();

        if (target?.user_type === 'admin') {
          return NextResponse.json({ success: false, error: 'অ্যাডমিনের ধরন এখান থেকে বদলানো যাবে না।' }, { status: 403 });
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({ user_type: userType })
          .eq('id', userId)
          .select('id');

        if (error) {
          console.error('[moderation] set_user_type failed:', error);
          return NextResponse.json({ success: false, error: 'পরিবর্তন সংরক্ষণ করা যায়নি।' }, { status: 400 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ success: false, error: 'No matching profile was updated.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: `User type set to ${userType}.` });
      }

      case 'suspend_listings': {
        // Pull everything a user has posted out of the feeds at once. Used when
        // the account is the problem rather than one listing.
        const { userId } = body;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Missing userId.' }, { status: 400 });
        }
        const { data, error } = await supabase
          .from('listings')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('seller_id', userId)
          .in('status', ['active', 'negotiating', 'reserved', 'flagged_review'])
          .select('id');

        if (error) {
          console.error('[moderation] suspend_listings failed:', error);
          return NextResponse.json({ success: false, error: 'লিস্টিং স্থগিত করা যায়নি।' }, { status: 400 });
        }
        return NextResponse.json({ success: true, message: `${(data || []).length} listing(s) suspended.` });
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
