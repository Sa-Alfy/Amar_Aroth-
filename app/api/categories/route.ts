import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/mockData';

/**
 * GET /api/categories
 * 
 * Fetch all product categories.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name_en, name_bn, slug, icon')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      return NextResponse.json({ success: true, categories: CATEGORIES });
    }

    const categories = data.map((row: any) => ({
      id: row.id,
      nameEn: row.name_en,
      nameBn: row.name_bn,
      slug: row.slug,
      icon: row.icon,
    }));

    return NextResponse.json({ success: true, categories });
  } catch {
    return NextResponse.json({ success: true, categories: CATEGORIES });
  }
}
