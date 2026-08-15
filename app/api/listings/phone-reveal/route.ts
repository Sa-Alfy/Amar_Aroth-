import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/listings/phone-reveal
 * 
 * Secure phone reveal endpoint that extracts the viewer's IP server-side
 * and delegates rate limiting + audit logging to the database RPC.
 * 
 * Body: { listingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract viewer IP from request headers (works behind proxies like Vercel/Cloudflare)
    const forwarded = request.headers.get('x-forwarded-for');
    const viewerIp = forwarded
      ? forwarded.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1';

    // 2. Parse body
    const body = await request.json();
    const { listingId } = body;

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid listing ID.' },
        { status: 400 }
      );
    }

    // 3. Create server-side Supabase client (carries auth cookies)
    const supabase = await createClient();

    // 4. Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'ফোন নম্বর দেখতে লগইন করুন' },
        { status: 401 }
      );
    }

    // 5. Log device footprint for anomaly detection
    await supabase.from('user_device_logs').insert({
      user_id: user.id,
      ip_address: viewerIp,
      user_agent: request.headers.get('user-agent') || null,
      action: 'phone_reveal',
    });

    // 6. Call the secure, rate-limited database RPC
    const { data, error } = await supabase.rpc('reveal_seller_phone_number', {
      p_listing_id: listingId,
      p_viewer_ip: viewerIp,
    });

    if (error) {
      console.error('[phone-reveal] RPC error:', error);
      return NextResponse.json(
        { success: false, error: 'নম্বর দেখাতে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন' },
        { status: 500 }
      );
    }

    if (data && data.length > 0) {
      const row = data[0];

      if (row.status === 'ok' && row.phone) {
        return NextResponse.json({
          success: true,
          phone: row.phone,
          sellerName: row.seller_name,
          isVerified: row.is_verified,
        });
      }

      if (row.status === 'unauthenticated') {
        return NextResponse.json(
          { success: false, error: 'ফোন নম্বর দেখতে লগইন করুন' },
          { status: 401 }
        );
      }

      if (row.status === 'unverified') {
        return NextResponse.json(
          { success: false, error: 'আপনার অ্যাকাউন্ট যাচাই হওয়ার পর নম্বর দেখতে পারবেন' },
          { status: 403 }
        );
      }

      if (row.status === 'tier_blocked') {
        return NextResponse.json(
          { success: false, error: 'আপনি এই বিক্রেতার কাছ থেকে সরাসরি কিনতে পারবেন না' },
          { status: 403 }
        );
      }

      if (row.status === 'quota_daily') {
        return NextResponse.json(
          { success: false, error: 'আজকের সীমা শেষ, আগামীকাল আবার চেষ্টা করুন' },
          { status: 429 }
        );
      }

      if (row.status === 'quota_ip') {
        return NextResponse.json(
          { success: false, error: 'অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার দেখুন' },
          { status: 429 }
        );
      }

      if (row.status === 'not_found') {
        return NextResponse.json(
          { success: false, error: 'পোস্টটি পাওয়া যায়নি' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'নম্বর দেখাতে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন' },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('[phone-reveal] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'সার্ভারে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।' },
      { status: 500 }
    );
  }
}
