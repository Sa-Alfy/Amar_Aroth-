import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { userTypeLabelBn, userTypePossessiveBn } from '@/lib/mockData';

type RevealStatus =
  | 'ok'
  | 'unauthenticated'
  | 'unverified'
  | 'tier_blocked'
  | 'quota_daily'
  | 'quota_ip'
  | 'not_found';

/**
 * Every non-ok status maps to a real HTTP status and a message that says what
 * happened and what to do next. A blocked reveal is never a 200.
 */
const STATUS_HTTP: Record<RevealStatus, number> = {
  ok: 200,
  unauthenticated: 401,
  unverified: 403,
  tier_blocked: 403,
  quota_daily: 429,
  quota_ip: 429,
  not_found: 404,
};

const STATUS_MESSAGE_BN: Record<Exclude<RevealStatus, 'ok' | 'tier_blocked'>, string> = {
  unauthenticated: 'নম্বর দেখতে লগইন করুন।',
  unverified: 'যাচাই শেষ হলে নম্বর দেখা যাবে। প্রোফাইলে গিয়ে এনআইডি জমা দিন।',
  quota_daily: 'আজকের নম্বর দেখার সীমা শেষ। আগামীকাল আবার দেখতে পারবেন।',
  quota_ip: 'একই সংযোগ থেকে অল্প সময়ে অনেকবার দেখা হয়েছে। এক ঘণ্টা পর আবার চেষ্টা করুন।',
  not_found: 'পোস্টটি আর নেই।',
};

/** What this tier should do instead, when the chain blocks them. */
const TIER_BLOCKED_NEXT_STEP_BN: Record<string, string> = {
  dokandar: 'আড়তদারের সরবরাহ থেকে কিনুন।',
  farmer: 'আড়তদারের চাহিদা দেখে যোগাযোগ করুন।',
  arathdar: 'কৃষক ও দোকানদারের পোস্টে যোগাযোগ করতে পারবেন।',
};

/**
 * POST /api/listings/phone-reveal
 *
 * The database RPC is the gate — it decides tier, verification and quota, logs
 * the attempt, and returns a status. This handler only translates that status.
 *
 * Body: { listingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Extract viewer IP server-side (works behind proxies like Vercel/Cloudflare)
    const forwarded = request.headers.get('x-forwarded-for');
    const viewerIp = forwarded
      ? forwarded.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1';

    const body = await request.json();
    const { listingId } = body;

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json(
        { success: false, status: 'bad_request', error: 'পোস্টটি শনাক্ত করা যায়নি।' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, status: 'unauthenticated', error: STATUS_MESSAGE_BN.unauthenticated },
        { status: 401 }
      );
    }

    // Device footprint is for anomaly detection only. If it fails, the reveal
    // must still proceed — an audit-log write must never block the user.
    try {
      await supabase.from('user_device_logs').insert({
        user_id: user.id,
        ip_address: viewerIp,
        user_agent: request.headers.get('user-agent') || null,
        action: 'phone_reveal',
      });
    } catch (logError) {
      console.warn('[phone-reveal] device log insert failed:', logError);
    }

    const { data, error } = await supabase.rpc('reveal_seller_phone_number', {
      p_listing_id: listingId,
      p_viewer_ip: viewerIp,
    });

    if (error) {
      console.error('[phone-reveal] RPC error:', error);
      return NextResponse.json(
        { success: false, status: 'error', error: 'নম্বর আনা যায়নি। একটু পর আবার চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;

    if (!row || typeof row.status !== 'string') {
      console.error('[phone-reveal] RPC returned no status row for listing', listingId);
      return NextResponse.json(
        { success: false, status: 'error', error: 'নম্বর আনা যায়নি। একটু পর আবার চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    const status = row.status as RevealStatus;

    if (status === 'ok') {
      if (!row.phone) {
        console.error('[phone-reveal] RPC returned ok with no phone for listing', listingId);
        return NextResponse.json(
          { success: false, status: 'error', error: 'নম্বর আনা যায়নি। একটু পর আবার চেষ্টা করুন।' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        status: 'ok',
        phone: row.phone,
        sellerName: row.seller_name,
        isVerified: row.is_verified,
      });
    }

    if (status === 'tier_blocked') {
      return NextResponse.json(
        {
          success: false,
          status,
          error: await buildTierBlockedMessage(supabase, listingId),
        },
        { status: STATUS_HTTP.tier_blocked }
      );
    }

    const message = STATUS_MESSAGE_BN[status as keyof typeof STATUS_MESSAGE_BN];

    if (!message) {
      console.error('[phone-reveal] Unrecognised RPC status:', status);
      return NextResponse.json(
        { success: false, status: 'error', error: 'নম্বর আনা যায়নি। একটু পর আবার চেষ্টা করুন।' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, status, error: message },
      { status: STATUS_HTTP[status] ?? 403 }
    );
  } catch (err: any) {
    console.error('[phone-reveal] Unexpected error:', err);
    return NextResponse.json(
      { success: false, status: 'error', error: 'সার্ভারে সমস্যা হয়েছে। একটু পর আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}

/**
 * Names both tiers so the message explains the actual rule rather than just
 * refusing. Only runs on the blocked path, so the two extra reads are rare.
 * Falls back to a generic line if either lookup fails.
 */
async function buildTierBlockedMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string
): Promise<string> {
  const generic = 'আপনার ধরনের ব্যবহারকারী এই পোস্টে সরাসরি যোগাযোগ করতে পারেন না।';

  try {
    const [{ data: viewerType }, { data: listing }] = await Promise.all([
      supabase.rpc('my_user_type'),
      supabase.from('listings').select('poster_user_type').eq('id', listingId).single(),
    ]);

    const viewer = typeof viewerType === 'string' ? viewerType : null;
    const poster = listing?.poster_user_type ?? null;

    if (!viewer || !poster) return generic;

    const nextStep = TIER_BLOCKED_NEXT_STEP_BN[viewer] ?? '';
    const sentence = `${userTypeLabelBn(viewer)} হিসেবে আপনি ${userTypePossessiveBn(poster)} নম্বর দেখতে পারবেন না।`;

    return nextStep ? `${sentence} ${nextStep}` : sentence;
  } catch (err) {
    console.warn('[phone-reveal] tier message lookup failed:', err);
    return generic;
  }
}
