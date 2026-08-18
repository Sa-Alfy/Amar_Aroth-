import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { INITIAL_LISTINGS, type ListingFeed } from '@/lib/mockData';

// Helper to check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

const VISIBLE_STATUSES = ['active', 'negotiating', 'reserved', 'sold'];
// mirrors the profiles.user_type check constraint (0010)
const POSTER_TYPES = ['farmer', 'arathdar', 'dokandar'];

interface TradePermission {
  buyer_type: string;
  seller_type: string;
  can_view: boolean;
  can_contact: boolean;
}

const SUPPLY_FEED_LABEL_BN: Record<string, string> = {
  farmer: 'কৃষকের সরবরাহ',
  arathdar: 'আড়তের সরবরাহ',
  dokandar: 'দোকানের সরবরাহ',
};

const DEMAND_FEED_LABEL_BN: Record<string, string> = {
  farmer: 'কৃষকের চাহিদা',
  arathdar: 'আড়তদারের চাহিদা',
  dokandar: 'দোকানের চাহিদা',
};

/**
 * Feeds are read straight out of trade_permissions — never hardcoded here.
 * Forward (buyer_type = me) gives supply feeds: whose goods may I buy.
 * Backward (seller_type = me) gives demand feeds: who may buy from me.
 *
 * A relationship with can_view but not can_contact (farmer -> farmer) is a
 * price-reference feed, not a marketplace, so it gets its own label.
 */
function deriveFeeds(myType: string | null, permissions: TradePermission[]): ListingFeed[] {
  if (!myType) {
    return [
      {
        key: 'supply:arathdar',
        labelBn: 'পাইকারি সরবরাহ',
        kind: 'supply',
        posterUserType: 'arathdar',
      },
    ];
  }

  const feeds: ListingFeed[] = [];

  for (const permission of permissions) {
    if (permission.buyer_type === myType && permission.can_view) {
      feeds.push({
        key: `supply:${permission.seller_type}`,
        labelBn: permission.can_contact
          ? SUPPLY_FEED_LABEL_BN[permission.seller_type] ?? 'সরবরাহ'
          : 'আশেপাশের দর',
        kind: 'supply',
        posterUserType: permission.seller_type,
      });
    }
  }

  for (const permission of permissions) {
    if (permission.seller_type === myType && permission.can_view) {
      feeds.push({
        key: `demand:${permission.buyer_type}`,
        labelBn: DEMAND_FEED_LABEL_BN[permission.buyer_type] ?? 'চাহিদা',
        kind: 'demand',
        posterUserType: permission.buyer_type,
      });
    }
  }

  return feeds;
}

/**
 * Maps one listing row to the client payload.
 *
 * sellerName is attached only when the viewer may contact this poster. canContact
 * is a UI hint derived from trade_permissions — the enforcement point is
 * reveal_seller_phone_number, which re-checks server-side on every reveal.
 */
function mapListing(row: any, sellerProfile: any, canContact: boolean) {
  const images = Array.isArray(row.listing_images)
    ? [...row.listing_images]
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((image: any) => image.image_url)
        .filter(Boolean)
    : [];

  return {
    id: row.id,
    createdByUserId: row.created_by_user_id || row.seller_id,
    ownerUserId: row.seller_id,
    title: row.title,
    description: row.description || '',
    categoryId: row.category_id,
    categoryNameEn: row.categories?.name_en || '',
    categoryNameBn: row.categories?.name_bn || 'সাধারণ',
    quantity: Number(row.quantity),
    unitId: row.unit_id,
    unitSymbol: row.measurement_units?.symbol_en || 'kg',
    unitSymbolBn: row.measurement_units?.symbol_bn || 'কেজি',
    expectedPricePerUnit: Number(row.expected_price),
    currency: 'BDT',
    divisionId: row.division_id,
    divisionNameEn: row.divisions?.name_en || '',
    districtId: row.district_id,
    districtNameEn: row.districts?.name_en || '',
    districtNameBn: row.districts?.name_bn || 'জেলা',
    upazilaId: row.upazila_id,
    upazilaNameEn: row.upazilas?.name_en || '',
    upazilaNameBn: row.upazilas?.name_bn || 'উপজেলা',

    // Server-owned, set by trg_a_set_listing_poster_and_visibility.
    // Trusted over the joined profile, which can be absent if the embed fails.
    posterUserType: row.poster_user_type,
    listingKind: (row.listing_kind || 'supply') as 'supply' | 'demand',
    sellerType: row.poster_user_type,
    canContact,

    // Omitted entirely when the viewer may not contact this poster.
    ...(canContact && sellerProfile?.full_name ? { sellerName: sellerProfile.full_name } : {}),

    isSellerVerified: Boolean(sellerProfile?.is_verified),
    images,
    status: row.status,
    availableFrom: row.available_from || new Date().toISOString().split('T')[0],
    createdAt: row.created_at,
    viewCount: row.view_count || 0,
    contactCount: row.phone_reveal_count || 0,
  };
}

/**
 * GET /api/listings?categoryId=&districtId=&search=&mine=&kind=&posterType=
 *
 * Visibility is enforced by RLS. Nothing in this handler decides who may see
 * what — the filters below only narrow an already-permitted result set.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const districtId = searchParams.get('districtId');
  const search = searchParams.get('search');
  const mine = searchParams.get('mine') === 'true';
  const kindParam = searchParams.get('kind');
  const posterTypeParam = searchParams.get('posterType');

  const kind = kindParam === 'supply' || kindParam === 'demand' ? kindParam : null;
  const posterType = posterTypeParam && POSTER_TYPES.includes(posterTypeParam) ? posterTypeParam : null;

  if (!isSupabaseConfigured()) {
    if (mine) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 });
    }

    let results = [...INITIAL_LISTINGS];
    if (categoryId) results = results.filter((item) => item.categoryId === Number(categoryId));
    if (districtId) results = results.filter((item) => item.districtId === Number(districtId));
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.districtNameEn.toLowerCase().includes(q) ||
          item.districtNameBn.includes(q) ||
          item.categoryNameEn.toLowerCase().includes(q) ||
          item.categoryNameBn.includes(q)
      );
    }
    return NextResponse.json({
      success: true,
      source: 'fixture',
      listings: results,
      feeds: deriveFeeds(null, []),
      viewerUserType: null,
    });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (mine && (authError || !user)) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    // Viewer tier + the permission table drive both the feed list and canContact.
    // One read serves both; can_contact_poster would be one round trip per tier.
    let viewerUserType: string | null = null;
    let permissions: TradePermission[] = [];

    if (user) {
      const [{ data: myType }, { data: permissionRows }] = await Promise.all([
        supabase.rpc('my_user_type'),
        supabase.from('trade_permissions').select('buyer_type, seller_type, can_view, can_contact'),
      ]);
      viewerUserType = (myType as string | null) ?? null;
      permissions = (permissionRows as TradePermission[] | null) ?? [];
    }

    const canContactPoster = (posterUserType: string | null): boolean => {
      if (!user || !viewerUserType || !posterUserType) return false;
      const match = permissions.find(
        (p) => p.buyer_type === viewerUserType && p.seller_type === posterUserType
      );
      return Boolean(match?.can_contact);
    };

    // One filter chain, applied identically to the embedded and fallback queries.
    const buildQuery = (select: string) => {
      let query = supabase
        .from('listings')
        .select(select)
        .order('created_at', { ascending: false })
        .limit(50);

      if (mine) {
        query = query.eq('created_by_user_id', user!.id);
      } else {
        query = query.in('status', VISIBLE_STATUSES);
      }

      if (categoryId) query = query.eq('category_id', Number(categoryId));
      if (districtId) query = query.eq('district_id', Number(districtId));
      if (search) query = query.ilike('title', `%${search}%`);
      if (kind) query = query.eq('listing_kind', kind);
      if (posterType) query = query.eq('poster_user_type', posterType);

      return query;
    };

    const RELATIONS = `
      categories (name_en, name_bn),
      measurement_units (symbol_en, symbol_bn),
      divisions (name_en, name_bn),
      districts (name_en, name_bn),
      upazilas (name_en, name_bn),
      listing_images (image_url, sort_order)
    `;

    const feeds = deriveFeeds(viewerUserType, permissions);

    const { data, error } = await buildQuery(`
      *,
      ${RELATIONS},
      profiles_public!seller_id (full_name, user_type, is_verified)
    `);

    if (!error && data) {
      const listings = (data as any[]).map((row) =>
        mapListing(row, row.profiles_public || row.profiles || null, canContactPoster(row.poster_user_type))
      );
      return NextResponse.json({ success: true, listings, feeds, viewerUserType });
    }

    console.warn(
      '[api/listings] Embedded profiles_public query failed, using fallback:',
      error?.message || 'Unknown error'
    );

    const { data: listingRows, error: listingError } = await buildQuery(`*, ${RELATIONS}`);

    if (listingError || !listingRows) {
      const message = listingError?.message || 'Database error while loading listings';
      console.warn('[api/listings] Fallback listing query failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }

    const rows = listingRows as any[];
    const sellerIds = [...new Set(rows.map((row) => row.seller_id).filter(Boolean))];
    const sellerProfiles: Record<string, any> = {};

    if (sellerIds.length > 0) {
      const { data: publicProfiles, error: publicProfilesError } = await supabase
        .from('profiles_public')
        .select('id, full_name, user_type, is_verified')
        .in('id', sellerIds);

      if (!publicProfilesError && publicProfiles) {
        for (const profile of publicProfiles) {
          sellerProfiles[profile.id] = profile;
        }
      }
    }

    const listings = rows.map((row) =>
      mapListing(row, sellerProfiles[row.seller_id] || null, canContactPoster(row.poster_user_type))
    );

    return NextResponse.json({ success: true, listings, feeds, viewerUserType });
  } catch (err: any) {
    const message = err?.message || 'Database error while loading listings';
    console.error('[api/listings] Error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}

/**
 * POST /api/listings
 *
 * Create a new listing with fraud engine integration.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'ভাল ডাটা পাঠাননি' }, { status: 400 });
    }

    const { categoryId, title, description, quantity, unitId, expectedPrice, divisionId, districtId, upazilaId, specificLocation, imageUrls } = body;

    const isPositiveInt = (value: unknown) => Number.isInteger(value) && Number(value) > 0;
    const isNonNegativeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

    if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 140) {
      return NextResponse.json({ success: false, error: 'শিরোনাম ৫ থেকে ১৪০ অক্ষরের মধ্যে দিন' }, { status: 400 });
    }
    if (!isNonNegativeNumber(quantity) || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, error: 'পরিমাণ ০ এর চেয়ে বড় হতে হবে' }, { status: 400 });
    }
    if (!isNonNegativeNumber(expectedPrice) || Number(expectedPrice) < 0) {
      return NextResponse.json({ success: false, error: 'প্রত্যাশিত দাম শূন্য বা তার বেশি হতে হবে' }, { status: 400 });
    }
    if (!isPositiveInt(categoryId) || !isPositiveInt(unitId) || !isPositiveInt(divisionId) || !isPositiveInt(districtId) || !isPositiveInt(upazilaId)) {
      return NextResponse.json({ success: false, error: 'ক্যাটাগরি, ইউনিট ও অবস্থানের তথ্য সঠিক দিন' }, { status: 400 });
    }
    if (imageUrls !== undefined && (!Array.isArray(imageUrls) || imageUrls.length > 5 || imageUrls.some((url: unknown) => typeof url !== 'string' || !/^https:\/\//i.test(url)))) {
      return NextResponse.json({ success: false, error: 'ছবির লিংক ৫টির বেশি নয়, HTTPS লিঙ্ক হতে হবে' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.is_verified === false) {
      return NextResponse.json({ success: false, error: 'আপনার প্রোফাইল যাচাইকৃত না হওয়ায় লিস্টিং পোস্ট করা যাবে না' }, { status: 403 });
    }

    // Log device footprint
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    try {
      await supabase.from('user_device_logs').insert({
        user_id: user.id,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || null,
        action: 'create_listing',
      });
    } catch {}

    // Ignore sellerId from the request body. Agent-on-behalf-of posting will need a seller_agents table
    // plus an authorization check before sellerId can ever be honored.
    // listing_kind, poster_user_type and is_public are server-owned — set by trigger, never sent here.
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        created_by_user_id: user.id,
        category_id: categoryId,
        title: title.trim(),
        description: description || null,
        quantity: Number(quantity),
        unit_id: Number(unitId),
        expected_price: Number(expectedPrice),
        division_id: Number(divisionId),
        district_id: Number(districtId),
        upazila_id: Number(upazilaId),
        specific_location: specificLocation || null,
        status: 'active',
      })
      .select('id, status')
      .single();

    if (listingError || !listingData) {
      return NextResponse.json({ success: false, error: listingError?.message || 'Failed to create listing' }, { status: 400 });
    }

    const listingId = listingData.id;
    const wasFlagged = listingData.status === 'flagged_review';

    // Insert images
    if (imageUrls && imageUrls.length > 0) {
      const imageRows = imageUrls
        .filter((url: string) => url.trim().length > 0)
        .map((url: string, index: number) => ({
          listing_id: listingId,
          image_url: url,
          sort_order: index + 1,
        }));
      if (imageRows.length > 0) {
        await supabase.from('listing_images').insert(imageRows);
      }
    }

    // Log creation event
    await supabase.from('listing_events').insert({
      listing_id: listingId,
      event_type: 'created',
      user_id: user.id,
      metadata: { timestamp: new Date().toISOString(), flagged: wasFlagged },
    });

    return NextResponse.json({ success: true, listingId, flagged: wasFlagged });
  } catch (err: any) {
    console.error('[api/listings] POST Error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
