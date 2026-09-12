-- ═══════════════════════════════════════════════════════════
-- 0002 — author checks on the append-only ledgers
--
-- 0001 shipped both client-writable ledgers with `with check (true)` and an
-- insert grant to anon. That let anyone post a row attributed to any user id.
-- user_device_logs feeds risk scoring, so a forged row could raise another
-- user's risk_score; listing_events was an open spam sink.
--
-- After this migration:
--   * user_device_logs  — a signed-in user may append rows about themselves only.
--                         Unattributed or server-side logging uses the service
--                         role client (lib/supabase/admin.ts), which bypasses RLS.
--   * listing_events    — a signed-in user appends rows attributed to themselves.
--                         An anonymous visitor may still append a 'viewed' event,
--                         but only with a null user_id, so it cannot claim to be
--                         somebody else.
--
-- Grants and policies both change: RLS decides which rows, grants decide whether
-- the table is reachable at all.
-- ═══════════════════════════════════════════════════════════

-- ── user_device_logs ──────────────────────────────────────

drop policy if exists "Clients append device logs" on public.user_device_logs;

create policy "Users append own device logs" on public.user_device_logs
  for insert to authenticated
  with check (user_id = public.current_user_id() and public.current_user_id() is not null);

revoke insert on public.user_device_logs from anon;

-- ── listing_events ────────────────────────────────────────

drop policy if exists "Anyone can log a listing event" on public.listing_events;

create policy "Users append own listing events" on public.listing_events
  for insert to authenticated
  with check (user_id = public.current_user_id() and public.current_user_id() is not null);

create policy "Anonymous visitors log views only" on public.listing_events
  for insert to anon
  with check (user_id is null and event_type = 'viewed');

-- anon keeps its insert grant, narrowed by the policy above.
