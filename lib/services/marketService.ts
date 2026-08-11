import { createClient } from '@/lib/supabase/server';

export interface MarketPriceBenchmark {
  categoryId: number;
  upazilaId: number;
  districtId: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  stdDev: number;
  sampleCount: number;
  periodDate: string;
}

/**
 * Fetch 7-day rolling market price benchmark for a given category and upazila/district.
 */
export async function getMarketPriceBenchmark(
  categoryId: number,
  upazilaId: number
): Promise<MarketPriceBenchmark | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('market_price_aggregates')
      .select('*')
      .eq('category_id', categoryId)
      .eq('upazila_id', upazilaId)
      .order('period_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      categoryId: data.category_id,
      upazilaId: data.upazila_id,
      districtId: data.district_id,
      avgPrice: Number(data.avg_price),
      minPrice: Number(data.min_price),
      maxPrice: Number(data.max_price),
      stdDev: Number(data.std_dev),
      sampleCount: data.sample_count,
      periodDate: data.period_date,
    };
  } catch (err) {
    console.error('Error fetching market price benchmark:', err);
    return null;
  }
}

/**
 * Trigger database function to recalculate rolling market price aggregates.
 */
export async function refreshMarketAggregates(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('recalculate_market_aggregates');
    if (error) {
      console.error('Error recalculating market aggregates:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error refreshing market aggregates:', err);
    return false;
  }
}
