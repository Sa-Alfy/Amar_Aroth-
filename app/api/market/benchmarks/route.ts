import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/market/benchmarks?categoryId=&upazilaId=
 * 
 * Fetch market price benchmarks for a given category and upazila.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const upazilaId = searchParams.get('upazilaId');

    if (!categoryId || !upazilaId) {
      return NextResponse.json({ success: false, error: 'categoryId and upazilaId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('market_price_aggregates')
      .select('*')
      .eq('category_id', Number(categoryId))
      .eq('upazila_id', Number(upazilaId))
      .order('period_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: true, benchmark: null });
    }

    return NextResponse.json({
      success: true,
      benchmark: {
        categoryId: data.category_id,
        upazilaId: data.upazila_id,
        districtId: data.district_id,
        avgPrice: Number(data.avg_price),
        minPrice: Number(data.min_price),
        maxPrice: Number(data.max_price),
        stdDev: Number(data.std_dev),
        sampleCount: data.sample_count,
        periodDate: data.period_date,
      },
    });
  } catch (err: any) {
    console.error('[api/market/benchmarks] Error:', err);
    return NextResponse.json({ success: true, benchmark: null });
  }
}
