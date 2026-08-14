import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { INITIAL_LISTINGS, CATEGORIES, MEASUREMENT_UNITS, BANGLADESH_LOCATIONS } from '@/lib/mockData';

// Helper to check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

/**
 * GET /api/listings?categoryId=&districtId=&search=
 * 
 * Fetch listings with optional filters. Falls back to mock data if Supabase is not configured.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const districtId = searchParams.get('districtId');
  const search = searchParams.get('search');
  const mine = searchParams.get('mine') === 'true';

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
    return NextResponse.json({ success: true, listings: results });
  }

  try {
    const supabase = await createClient();

    const buildListingsResponse = (rows: any[] = []) =>
      rows.map((row: any) => {
        const sellerProfile = row.profiles_public || row.profiles || null;
        return {
          id: row.id,
          createdByUserId: row.created_by_user_id || row.seller_id,
          ownerUserId: row.seller_id,
          title: row.title,
          description: row.description || '',
          categoryId: row.category_id,
          categoryNameEn: row.categories?.name_en || 'General',
          categoryNameBn: row.categories?.name_bn || 'সাধারণ',
          quantity: Number(row.quantity),
          unitId: row.unit_id,
          unitSymbol: row.measurement_units?.symbol_en || 'kg',
          unitSymbolBn: row.measurement_units?.symbol_bn || 'কেজি',
          expectedPricePerUnit: Number(row.expected_price),
          currency: 'BDT',
          divisionId: row.division_id,
          divisionNameEn: row.divisions?.name_en || 'Division',
          districtId: row.district_id,
          districtNameEn: row.districts?.name_en || 'District',
          districtNameBn: row.districts?.name_bn || 'জেলা',
          upazilaId: row.upazila_id,
          upazilaNameEn: row.upazilas?.name_en || 'Upazila',
          upazilaNameBn: row.upazilas?.name_bn || 'উপজেলা',
          sellerName: sellerProfile?.full_name || 'Farmer',
          sellerType: (sellerProfile?.user_type as any) || 'farmer',
          isSellerVerified: Boolean(sellerProfile?.is_verified),
          images: row.listing_images?.length > 0
            ? row.listing_images.sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.image_url)
            : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'],
          status: row.status,
          availableFrom: row.available_from || new Date().toISOString().split('T')[0],
          createdAt: row.created_at,
          viewCount: row.view_count || 0,
          contactCount: row.phone_reveal_count || 0,
        };
      });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let query = supabase
      .from('listings')
      .select(`
        *,
        categories (name_en, name_bn),
        measurement_units (symbol_en, symbol_bn),
        divisions (name_en, name_bn),
        districts (name_en, name_bn),
        upazilas (name_en, name_bn),
        profiles_public!seller_id (full_name, user_type, is_verified),
        listing_images (image_url, sort_order)
      `)
      .in('status', ['active', 'negotiating', 'reserved', 'sold'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (mine) {
      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
      }
      query = query.eq('created_by_user_id', user.id);
    }

    if (categoryId) query = query.eq('category_id', Number(categoryId));
    if (districtId) query = query.eq('district_id', Number(districtId));
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (!error && data) {
      return NextResponse.json({ success: true, listings: buildListingsResponse(data) });
    }

    console.warn('[api/listings] Embedded profiles_public query failed, using fallback:', error?.message || 'Unknown error');

    const { data: listingRows, error: listingError } = await supabase
      .from('listings')
      .select(`
        *,
        categories (name_en, name_bn),
        measurement_units (symbol_en, symbol_bn),
        divisions (name_en, name_bn),
        districts (name_en, name_bn),
        upazilas (name_en, name_bn),
        listing_images (image_url, sort_order)
      `)
      .in('status', ['active', 'negotiating', 'reserved', 'sold'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (listingError || !listingRows) {
      const message = listingError?.message || 'Database error while loading listings';
      console.warn('[api/listings] Fallback listing query failed:', message);
      return NextResponse.json({ success: false, error: message }, { status: 503 });
    }

    const sellerIds = [...new Set(listingRows.map((row: any) => row.seller_id).filter(Boolean))];
    let sellerProfiles: Record<string, any> = {};

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

    const listings = listingRows.map((row: any) => {
      const sellerProfile = sellerProfiles[row.seller_id] || null;
      return {
        id: row.id,
        createdByUserId: row.created_by_user_id || row.seller_id,
        ownerUserId: row.seller_id,
        title: row.title,
        description: row.description || '',
        categoryId: row.category_id,
        categoryNameEn: row.categories?.name_en || 'General',
        categoryNameBn: row.categories?.name_bn || 'সাধারণ',
        quantity: Number(row.quantity),
        unitId: row.unit_id,
        unitSymbol: row.measurement_units?.symbol_en || 'kg',
        unitSymbolBn: row.measurement_units?.symbol_bn || 'কেজি',
        expectedPricePerUnit: Number(row.expected_price),
        currency: 'BDT',
        divisionId: row.division_id,
        divisionNameEn: row.divisions?.name_en || 'Division',
        districtId: row.district_id,
        districtNameEn: row.districts?.name_en || 'District',
        districtNameBn: row.districts?.name_bn || 'জেলা',
        upazilaId: row.upazila_id,
        upazilaNameEn: row.upazilas?.name_en || 'Upazila',
        upazilaNameBn: row.upazilas?.name_bn || 'উপজেলা',
        sellerName: sellerProfile?.full_name || 'Farmer',
        sellerType: (sellerProfile?.user_type as any) || 'farmer',
        isSellerVerified: Boolean(sellerProfile?.is_verified),
        images: row.listing_images?.length > 0
          ? row.listing_images.sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.image_url)
          : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'],
        status: row.status,
        availableFrom: row.available_from || new Date().toISOString().split('T')[0],
        createdAt: row.created_at,
        viewCount: row.view_count || 0,
        contactCount: row.phone_reveal_count || 0,
      };
    });

    return NextResponse.json({ success: true, listings });
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
      return NextResponse.json({ success: false, error: 'পরিমাণ ০ এর চেয়ে বড় হতে হবে' }, { status: 400 });
    }
    if (!isNonNegativeNumber(expectedPrice) || Number(expectedPrice) < 0) {
      return NextResponse.json({ success: false, error: 'প্রত্যাশিত দাম শূন্য বা তার বেশি হতে হবে' }, { status: 400 });
    }
    if (!isPositiveInt(categoryId) || !isPositiveInt(unitId) || !isPositiveInt(divisionId) || !isPositiveInt(districtId) || !isPositiveInt(upazilaId)) {
      return NextResponse.json({ success: false, error: 'ক্যাটাগরি, ইউনিট ও অবস্থানের তথ্য সঠিক দিন' }, { status: 400 });
    }
    if (imageUrls !== undefined && (!Array.isArray(imageUrls) || imageUrls.length > 5 || imageUrls.some((url: unknown) => typeof url !== 'string' || !/^https:\/\//i.test(url)))) {
      return NextResponse.json({ success: false, error: 'ছবির লিংক ৫টির বেশি নয়, HTTPS লিঙ্ক হতে হবে' }, { status: 400 });
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
    // Insert listing — database trigger may auto-flag as 'flagged_review'
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
