import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BANGLADESH_LOCATIONS } from '@/lib/mockData';

/**
 * GET /api/locations
 * 
 * Fetch divisions → districts → upazilas tree.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const [divRes, distRes, upRes] = await Promise.all([
      supabase.from('divisions').select('id, name_en, name_bn').order('id'),
      supabase.from('districts').select('id, division_id, name_en, name_bn').order('id'),
      supabase.from('upazilas').select('id, district_id, name_en, name_bn').order('id'),
    ]);

    if (divRes.error || !divRes.data || divRes.data.length === 0) {
      return NextResponse.json({ success: true, locations: BANGLADESH_LOCATIONS });
    }

    const locations = divRes.data.map((div: any) => ({
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

    return NextResponse.json({ success: true, locations });
  } catch {
    return NextResponse.json({ success: true, locations: BANGLADESH_LOCATIONS });
  }
}
