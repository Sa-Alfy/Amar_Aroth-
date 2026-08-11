import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout
 * 
 * Server-side logout. Clears Supabase session and cookies.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[auth/logout] Error:', err);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
