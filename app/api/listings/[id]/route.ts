import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const allowedStatuses = new Set(['active', 'negotiating', 'reserved', 'sold', 'hidden']);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const status = typeof body?.status === 'string' ? body.status : null;

    if (!status || !allowedStatuses.has(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status.' }, { status: 400 });
    }

    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, created_by_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.created_by_user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('listings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update listing.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, listingId: data.id, status: data.status }, { status: 200 });
  } catch (err: any) {
    console.error('[api/listings/[id]] PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, created_by_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.created_by_user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'hidden', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to hide listing.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, listingId: data.id, status: data.status }, { status: 200 });
  } catch (err: any) {
    console.error('[api/listings/[id]] DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
