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
        { success: false, error: 'Authentication required to view seller contact.' },
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
      // Database RPC raises exceptions for rate limit violations
      const isRateLimit = error.message.includes('quota exceeded') || error.message.includes('Too many');
      return NextResponse.json(
        { success: false, error: error.message },
        { status: isRateLimit ? 429 : 400 }
      );
    }

    if (data && data.length > 0) {
      const row = data[0];
      return NextResponse.json({
        success: true,
        phone: row.phone,
        sellerName: row.seller_name,
        isVerified: row.is_verified,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Seller contact details not found.' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[phone-reveal] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
