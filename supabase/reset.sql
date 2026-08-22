-- ═══════════════════════════════════════════════════════════════════════════
-- DESTRUCTIVE. Drops every Amar Aroth object in the public schema.
--
-- Run order for a clean rebuild:
--   1. reset.sql          <- this file
--   2. migrations/0001_schema.sql
--   3. seed.sql
--   4. tests/tier_invariants.sql      (expect: dokandar sees 0 farmer)
--   5. tests/contact_invariants.sql   (expect: tier_blocked + control ok)
--
-- Objects are dropped explicitly rather than via `drop schema public cascade`
-- so that anything else living in the schema is left alone.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists public.profiles_public;

-- Order does not matter with cascade, but ledgers first keeps the notices
-- readable if you are watching.
drop table if exists public.phone_reveal_logs       cascade;
drop table if exists public.fraud_alerts            cascade;
drop table if exists public.user_device_logs        cascade;
drop table if exists public.market_price_aggregates cascade;
drop table if exists public.moderation_reports      cascade;
drop table if exists public.listing_events          cascade;
drop table if exists public.bookmarks               cascade;
drop table if exists public.listing_images          cascade;
drop table if exists public.listings                cascade;
drop table if exists public.trade_permissions       cascade;
drop table if exists public.profiles                cascade;
drop table if exists public.upazilas                cascade;
drop table if exists public.districts               cascade;
drop table if exists public.divisions               cascade;
drop table if exists public.measurement_units       cascade;
drop table if exists public.categories              cascade;

drop function if exists public.reveal_seller_phone_number(uuid, inet);
drop function if exists public.recalculate_market_aggregates();
drop function if exists public.fn_price_band_after();
drop function if exists public.fn_price_band_before();
drop function if exists public.fn_protect_privileged_profile_fields();
drop function if exists public.fn_set_listing_poster_and_visibility();
drop function if exists public.can_contact_poster(text);
drop function if exists public.my_user_type();
drop function if exists public.is_admin(uuid);
drop function if exists public.current_user_id();

-- ── Auth accounts ──────────────────────────────────────────────────────────
-- The new schema has NO foreign key from profiles to auth.users, so the old
-- auth accounts survive this reset. They will be able to log in and land
-- without a profile.
--
-- The seeded profiles in seed.sql have no auth account either, so they cannot
-- log in — they exist for RLS testing and for the browse UI to have stock.
-- To click through the app, register through the signup flow, or use
-- seed/dokandar_test_account.sql which creates both halves.
--
-- Uncomment to clear the old Supabase auth accounts too:
--
-- delete from auth.users where email like '%@amararoth.com';

select 'reset complete — now run migrations/0001_schema.sql' as status;
