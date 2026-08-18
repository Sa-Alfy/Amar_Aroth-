-- Migration: 0008_close_view_and_reference_gaps.sql
-- Description: Closes four gaps found by the 2026-08-18 live audit.
--   1. profiles_public bypassed RLS AND was writable by anon (auto-updatable view).
--   2. Reference tables had RLS enabled with zero policies -> invisible to the app.
--   3. listing_images was world-readable, leaking farmer listings across tiers.
--   4. listing_events had RLS enabled with zero policies -> event logging was dead.
-- Plus: migrates the legacy 'aggregator' tier onto 'arathdar' so the tier model
--       has real data to exercise.
-- Run this in the Supabase SQL editor. Read section 5 before running.

-- ═══════════════════════════════════════════════════════════
-- 1. profiles_public — stop the write path, scope the read path
--
-- The view has no security_invoker, so it runs as its owner and does NOT
-- apply RLS on public.profiles. That is deliberate here: the view itself is
-- the authorization boundary, and its WHERE clause carries the tier rule.
-- But a view that bypasses RLS must never be writable, and Supabase's default
-- privileges had granted anon INSERT/UPDATE/DELETE on it. Because the view was
-- a plain projection of one table, it was auto-updatable — those writes reached
-- public.profiles with RLS bypassed.
--
-- The visibility rule below is read from trade_permissions, never hardcoded.
-- ═══════════════════════════════════════════════════════════

create or replace view public.profiles_public as
select
  p.id,
  p.full_name,
  p.user_type,
  p.is_verified,
  p.division_id,
  p.district_id,
  p.upazila_id
from public.profiles p
where
  -- own row
  p.id = (select auth.uid())

  -- admins
  or public.is_admin((select auth.uid()))

  -- seller of a listing on the anonymous/public surface
  or exists (
    select 1 from public.listings l
    where l.seller_id = p.id
      and l.is_public
      and l.status in ('active','negotiating','reserved','sold')
  )

  -- forward read: seller of a supply listing this caller's tier may view
  or exists (
    select 1
    from public.listings l
    join public.trade_permissions tp
      on tp.buyer_type  = public.my_user_type()
     and tp.seller_type = l.poster_user_type
    where l.seller_id = p.id
      and l.listing_kind = 'supply'
      and tp.can_view
      and l.status in ('active','negotiating','reserved','sold')
  )

  -- backward read: poster of a demand listing this caller's tier may sell into
  or exists (
    select 1
    from public.listings l
    join public.trade_permissions tp
      on tp.buyer_type  = l.poster_user_type
     and tp.seller_type = public.my_user_type()
    where l.seller_id = p.id
      and l.listing_kind = 'demand'
      and tp.can_view
      and l.status in ('active','negotiating')
  );

revoke all on public.profiles_public from public;
revoke all on public.profiles_public from anon;
revoke all on public.profiles_public from authenticated;
grant select on public.profiles_public to anon;
grant select on public.profiles_public to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 2. Reference tables — RLS is on, no policy exists, so every read
--    returns zero rows. The data is there (8/8/64/63/7 rows).
--    These tables carry no user data; they are readable by design.
-- ═══════════════════════════════════════════════════════════

alter table public.categories        enable row level security;
alter table public.divisions         enable row level security;
alter table public.districts         enable row level security;
alter table public.upazilas          enable row level security;
alter table public.measurement_units enable row level security;

drop policy if exists "Categories readable by everyone" on public.categories;
create policy "Categories readable by everyone" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Divisions readable by everyone" on public.divisions;
create policy "Divisions readable by everyone" on public.divisions
  for select to anon, authenticated using (true);

drop policy if exists "Districts readable by everyone" on public.districts;
create policy "Districts readable by everyone" on public.districts
  for select to anon, authenticated using (true);

drop policy if exists "Upazilas readable by everyone" on public.upazilas;
create policy "Upazilas readable by everyone" on public.upazilas
  for select to anon, authenticated using (true);

drop policy if exists "Measurement units readable by everyone" on public.measurement_units;
create policy "Measurement units readable by everyone" on public.measurement_units
  for select to anon, authenticated using (true);

-- ═══════════════════════════════════════════════════════════
-- 3. listing_images — was `using (true)`, so anon and dokandar could
--    enumerate images of farmer listings they may not see.
--    Derive visibility from the parent listing: the subquery is evaluated
--    under the caller's RLS on public.listings, so the tier rule applies
--    without being restated here.
-- ═══════════════════════════════════════════════════════════

drop policy if exists "Images viewable by everyone" on public.listing_images;
create policy "Images follow listing visibility" on public.listing_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 4. listing_events — RLS on, zero policies, so every insert was
--    rejected and the table sat empty. Append-only for clients;
--    reads stay admin-only.
-- ═══════════════════════════════════════════════════════════

drop policy if exists "Anyone can log a listing event" on public.listing_events;
create policy "Anyone can log a listing event" on public.listing_events
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins view listing events" on public.listing_events;
create policy "Admins view listing events" on public.listing_events
  for select to authenticated using (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- 5. DATA — migrate the legacy 'aggregator' tier onto 'arathdar'
--
-- 'aggregator' and 'dealer' appear in the user_type constraint but in no
-- trade_permissions row, so those two accounts can neither see nor be seen
-- by anyone, and their listings can never be public. Both are verified and
-- already own listings, which makes them the natural first arathdars.
--
-- The set_config bypass is required: trg_protect_privileged_profile_fields
-- silently reverts user_type for any writer that is not an admin, and the
-- SQL editor has no auth.uid(). Wrapped in a DO block so the setting and
-- the update share one transaction.
--
-- The listings touch re-fires trg_a_set_listing_poster_and_visibility, which
-- recomputes poster_user_type and is_public. It does not touch expected_price,
-- so the price-band fraud triggers do not re-fire.
-- ═══════════════════════════════════════════════════════════

do $$
begin
  perform set_config('app.system_write', 'on', true);
  update public.profiles set user_type = 'arathdar' where user_type = 'aggregator';
  perform set_config('app.system_write', 'off', true);

  update public.listings set updated_at = now() where poster_user_type = 'aggregator';
end $$;

-- ═══════════════════════════════════════════════════════════
-- 6. VERIFY — expect: is_public true for the 2 migrated supply listings,
--    and no rows still carrying a legacy tier.
-- ═══════════════════════════════════════════════════════════

select 'profiles' as what, user_type as detail, count(*)
from public.profiles group by 2
union all
select 'listings', poster_user_type || ' / public=' || is_public, count(*)
from public.listings group by 2
order by 1, 2;
