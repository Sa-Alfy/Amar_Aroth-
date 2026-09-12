import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client.
 *
 * Bypasses RLS. Server-side only — never import this into a page or component,
 * and never return anything derived from SUPABASE_SERVICE_ROLE_KEY in a response.
 *
 * Use it only where RLS legitimately blocks a write the server itself vouches
 * for: account creation, admin repair, and server-owned ledgers. Default to the
 * SSR client in lib/supabase/server.ts for every user-scoped read and write.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase admin env vars missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are both required'
    );
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
