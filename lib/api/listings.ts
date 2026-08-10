import { createClient } from '@/lib/supabase/client';
import { INITIAL_LISTINGS, CATEGORIES, MEASUREMENT_UNITS, BANGLADESH_LOCATIONS, SupplyListing, Category, MeasurementUnit, LocationDivision } from '@/lib/mockData';

// Helper to check if Supabase environment variables are configured
export function isSupabaseConfigured(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return CATEGORIES;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name_en, name_bn, slug, icon')
      .order('sort_order', { ascending: true });
    if (error || !data) return CATEGORIES;
    return data.map((row: any): Category => ({
      id: row.id,
      nameEn: row.name_en,
      nameBn: row.name_bn,
      slug: row.slug,
      icon: row.icon,
    }));
  } catch {
    return CATEGORIES;
  }
}

// ─── MEASUREMENT UNITS ────────────────────────────────────────────────────────

export async function getMeasurementUnits(): Promise<MeasurementUnit[]> {
  if (!isSupabaseConfigured()) return MEASUREMENT_UNITS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('measurement_units')
      .select('id, name_en, name_bn, symbol_en, symbol_bn')
      .order('id', { ascending: true });
    if (error || !data) return MEASUREMENT_UNITS;
    return data.map((row: any): MeasurementUnit => ({
      id: row.id,
      nameEn: row.name_en,
      nameBn: row.name_bn,
      symbol: row.symbol_en,
    }));
  } catch {
    return MEASUREMENT_UNITS;
  }
}

// ─── LOCATIONS ────────────────────────────────────────────────────────────────

export async function getLocations(): Promise<LocationDivision[]> {
  if (!isSupabaseConfigured()) return BANGLADESH_LOCATIONS;
  try {
    const supabase = createClient();
    const [divRes, distRes, upRes] = await Promise.all([
      supabase.from('divisions').select('id, name_en, name_bn').order('id'),
      supabase.from('districts').select('id, division_id, name_en, name_bn').order('id'),
      supabase.from('upazilas').select('id, district_id, name_en, name_bn').order('id'),
    ]);
    if (divRes.error || !divRes.data) return BANGLADESH_LOCATIONS;
    return divRes.data.map((div: any): LocationDivision => ({
      id: div.id,
      nameEn: div.name_en,
      nameBn: div.name_bn,
      districts: (distRes.data || [])
        .filter((d: any) => d.division_id === div.id)
        .map((dist: any) => ({
          id: dist.id,
          nameEn: dist.name_en,
          nameBn: dist.name_bn,
          upazilas: (upRes.data || [])
            .filter((u: any) => u.district_id === dist.id)
            .map((up: any) => ({
              id: up.id,
              nameEn: up.name_en,
              nameBn: up.name_bn,
            })),
        })),
    }));
  } catch {
    return BANGLADESH_LOCATIONS;
  }
}

// ─── FETCH LISTINGS ───────────────────────────────────────────────────────────

export async function getSupplyListings(filters?: {
  categoryId?: number | null;
  districtId?: number | null;
  searchQuery?: string;
}): Promise<SupplyListing[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_LISTINGS.filter((item) => {
      if (filters?.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters?.districtId && item.districtId !== filters.districtId) return false;
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchLoc = item.districtNameEn.toLowerCase().includes(q) || item.districtNameBn.includes(q);
        const matchCat = item.categoryNameEn.toLowerCase().includes(q) || item.categoryNameBn.includes(q);
        if (!matchTitle && !matchLoc && !matchCat) return false;
      }
      return true;
    });
  }

  try {
    const supabase = createClient();
    let query = supabase
      .from('listings')
      .select(`
        *,
        categories (name_en, name_bn),
        measurement_units (symbol_en, symbol_bn),
        divisions (name_en, name_bn),
        districts (name_en, name_bn),
        upazilas (name_en, name_bn),
        profiles!seller_id (full_name, phone, user_type, is_verified),
        listing_images (image_url, sort_order)
      `)
      .in('status', ['active', 'negotiating', 'reserved', 'sold'])
      .order('created_at', { ascending: false });

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.districtId) {
      query = query.eq('district_id', filters.districtId);
    }
    if (filters?.searchQuery) {
      query = query.ilike('title', `%${filters.searchQuery}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Supabase query failed, using mock data fallback:', error?.message);
      return INITIAL_LISTINGS;
    }

    return data.map((row: any): SupplyListing => ({
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
      sellerName: row.profiles?.full_name || 'Farmer',
      sellerPhone: row.profiles?.phone || '01700000000',
      sellerType: (row.profiles?.user_type as any) || 'farmer',
      isSellerVerified: Boolean(row.profiles?.is_verified),
      images: row.listing_images?.length > 0
        ? row.listing_images.sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.image_url)
        : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'],
      status: row.status,
      availableFrom: row.available_from || new Date().toISOString().split('T')[0],
      createdAt: row.created_at,
      viewCount: row.view_count || 0,
      contactCount: row.phone_reveal_count || 0,
    }));
  } catch (err) {
    console.error('Error fetching supply listings:', err);
    return INITIAL_LISTINGS;
  }
}

// ─── CREATE LISTING ───────────────────────────────────────────────────────────

export interface CreateListingPayload {
  sellerId: string;
  createdByUserId: string;
  categoryId: number;
  title: string;
  description: string;
  quantity: number;
  unitId: number;
  expectedPrice: number;
  divisionId: number;
  districtId: number;
  upazilaId: number;
  specificLocation?: string;
  imageUrls?: string[];
}

export async function createSupplyListing(
  payload: CreateListingPayload
): Promise<{ success: boolean; listingId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }
  try {
    const supabase = createClient();

    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert({
        seller_id: payload.sellerId,
        created_by_user_id: payload.createdByUserId,
        category_id: payload.categoryId,
        title: payload.title,
        description: payload.description || null,
        quantity: payload.quantity,
        unit_id: payload.unitId,
        expected_price: payload.expectedPrice,
        division_id: payload.divisionId,
        district_id: payload.districtId,
        upazila_id: payload.upazilaId,
        specific_location: payload.specificLocation || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (listingError || !listingData) {
      return { success: false, error: listingError?.message || 'Failed to create listing' };
    }

    const listingId = listingData.id;

    if (payload.imageUrls && payload.imageUrls.length > 0) {
      const imageRows = payload.imageUrls
        .filter((url) => url.trim().length > 0)
        .map((url, index) => ({
          listing_id: listingId,
          image_url: url,
          sort_order: index + 1,
        }));
      if (imageRows.length > 0) {
        await supabase.from('listing_images').insert(imageRows);
      }
    }

    await supabase.from('listing_events').insert({
      listing_id: listingId,
      event_type: 'created',
      user_id: payload.createdByUserId,
      metadata: { timestamp: new Date().toISOString() },
    });

    return { success: true, listingId };
  } catch (err: any) {
    console.error('Error creating supply listing:', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

// ─── LOG PHONE REVEAL ─────────────────────────────────────────────────────────

export async function recordPhoneRevealEvent(listingId: string | number): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('[Demo Mode] Phone reveal logged for listing:', listingId);
    return;
  }

  try {
    const supabase = createClient();
    await supabase.from('listing_events').insert({
      listing_id: String(listingId),
      event_type: 'phone_revealed',
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Error recording phone reveal event:', err);
  }
}
