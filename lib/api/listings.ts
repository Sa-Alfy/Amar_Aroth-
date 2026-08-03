import { createClient } from '@/lib/supabase/client';
import { INITIAL_LISTINGS, SupplyListing } from '@/lib/mockData';

// Helper to check if Supabase environment variables are configured
export function isSupabaseConfigured(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

// Fetch active supply listings (from Supabase or Mock fallback)
export async function getSupplyListings(filters?: {
  categoryId?: number | null;
  districtId?: number | null;
  searchQuery?: string;
}): Promise<SupplyListing[]> {
  if (!isSupabaseConfigured()) {
    // Return filtered mock data
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

    // Map database records to SupplyListing structure
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

// Log phone reveal event to unified listing_events ledger
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
