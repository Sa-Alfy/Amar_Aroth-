import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MEASUREMENT_UNITS } from '@/lib/mockData';

/**
 * GET /api/units
 * 
 * Fetch all measurement units.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('measurement_units')
      .select('id, name_en, name_bn, symbol_en, symbol_bn')
      .order('id', { ascending: true });

    if (error || !data) {
      return NextResponse.json({ success: true, units: MEASUREMENT_UNITS });
    }

    const units = data.map((row: any) => ({
      id: row.id,
      nameEn: row.name_en,
      nameBn: row.name_bn,
      symbol: row.symbol_en,
    }));

    return NextResponse.json({ success: true, units });
  } catch {
    return NextResponse.json({ success: true, units: MEASUREMENT_UNITS });
  }
}
