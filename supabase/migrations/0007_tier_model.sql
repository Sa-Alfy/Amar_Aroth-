-- 0007_tier_model.sql
-- Replaces the unapplied 0007/0008/0009.
-- Assumes 0001-0006 are applied.

begin;

-- ═══════════════════════════════════════════════════════════
-- 1. FRAUD TRIGGER: split BEFORE (status) from AFTER (alerts)
--    The combined version violates fraud_alerts.listing_id FK.
-- ═══════════════════════════════════════════════════════════
drop trigger if exists trg_check_price_band_and_verification on public.listings;
drop function if exists public.fn_check_price_band_and_verification();

-- ═══════════════════════════════════════════════════════════
-- 2. ROLES + KYC STATE
-- ═══════════════════════════════════════════════════════════
alter table public.profiles drop constraint if exists profiles_user_type_check;
alter table public.profiles add constraint profiles_user_type_check
  check (user_type in ('farmer','arathdar','dokandar','admin','dealer','aggregator'));

alter table public.profiles
  add column if not exists kyc_status text not null default 'pending'
    check (kyc_status in ('pending','verified','rejected')),
  add column if not exists kyc_reviewed_by uuid references public.profiles(id),
  add column if not exists kyc_reviewed_at timestamptz;

update public.profiles set kyc_status = 'verified' where is_verified = true;

-- ═══════════════════════════════════════════════════════════
-- 3. TRADE PERMISSIONS — view and contact are separate rights
-- ═══════════════════════════════════════════════════════════
create table if not exists public.trade_permissions (
  buyer_type  text not null,
  seller_type text not null,
  can_view    boolean not null default true,
  can_contact boolean not null default true,
  primary key (buyer_type, seller_type)
);

insert into public.trade_permissions (buyer_type, seller_type, can_view, can_contact) values
  ('arathdar', 'farmer',   true, true),
  ('dokandar', 'arathdar', true, true),
  ('arathdar', 'arathdar', true, true),   -- inter-district arbitrage
  ('farmer',   'farmer',   true, false)   -- peer price reference, no phone
on conflict (buyer_type, seller_type)
do update set can_view = excluded.can_view, can_contact = excluded.can_contact;

alter table public.trade_permissions enable row level security;
grant select on public.trade_permissions to authenticated;

drop policy if exists "Trade permissions readable by authenticated" on public.trade_permissions;
create policy "Trade permissions readable by authenticated"
  on public.trade_permissions for select to authenticated using (true);

drop policy if exists "Admins manage trade permissions" on public.trade_permissions;
create policy "Admins manage trade permissions"
  on public.trade_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- 4. LISTING TIER COLUMNS
-- ═══════════════════════════════════════════════════════════
alter table public.listings
  add column if not exists listing_kind text not null default 'supply'
    check (listing_kind in ('supply','demand')),
  add column if not exists poster_user_type text,
  add column if not exists is_public boolean not null default false,
  add column if not exists source_listing_id uuid references public.listings(id) on delete set null;

create index if not exists idx_listings_kind_poster_status
  on public.listings (listing_kind, poster_user_type, status);

-- foreign keys that had no index (join and cascade paths)
create index if not exists idx_listings_seller       on public.listings (seller_id);
create index if not exists idx_listings_creator      on public.listings (created_by_user_id);
create index if not exists idx_listing_images_listing on public.listing_images (listing_id);
create index if not exists idx_listing_events_listing on public.listing_events (listing_id);
create index if not exists idx_bookmarks_user        on public.bookmarks (user_id);
create index if not exists idx_districts_division    on public.districts (division_id);
create index if not exists idx_upazilas_district     on public.upazilas (district_id);

-- ═══════════════════════════════════════════════════════════
-- 5. SERVER-OWNED COLUMNS — client can never set these,
--    on INSERT or UPDATE. Tier derives from seller_id,
--    because seller_id's phone is what gets revealed.
-- ═══════════════════════════════════════════════════════════
create or replace function public.fn_set_listing_poster_and_visibility()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_type  text;
begin
  if tg_op = 'UPDATE' then
    new.listing_kind      := old.listing_kind;
    new.source_listing_id := coalesce(new.source_listing_id, old.source_listing_id);
  end if;

  v_owner := coalesce(new.seller_id, new.created_by_user_id);

  select p.user_type into v_type from public.profiles p where p.id = v_owner;

  if v_type is null then
    raise exception 'Cannot determine seller tier: profile % not found', v_owner;
  end if;

  new.poster_user_type := v_type;
  new.is_public := (new.listing_kind = 'supply' and v_type = 'arathdar');
  return new;
end; $$;

-- name sorts before trg_check_* so tier is set first (BEFORE triggers fire alphabetically)
drop trigger if exists trg_set_listing_poster_and_visibility on public.listings;
drop trigger if exists trg_a_set_listing_poster_and_visibility on public.listings;
create trigger trg_a_set_listing_poster_and_visibility
  before insert or update on public.listings
  for each row execute function public.fn_set_listing_poster_and_visibility();

update public.listings l
set poster_user_type = p.user_type,
    is_public = (coalesce(l.listing_kind,'supply') = 'supply' and p.user_type = 'arathdar')
from public.profiles p
where p.id = coalesce(l.seller_id, l.created_by_user_id);

delete from public.listings where poster_user_type is null;
alter table public.listings alter column poster_user_type set not null;

-- ═══════════════════════════════════════════════════════════
-- 6. HELPERS
-- ═══════════════════════════════════════════════════════════
create or replace function public.my_user_type()
returns text language sql stable security definer set search_path = '' as $$
  select p.user_type from public.profiles p where p.id = auth.uid();
$$;
revoke execute on function public.my_user_type() from public, anon;
grant  execute on function public.my_user_type() to authenticated;

create or replace function public.can_contact_poster(p_poster_type text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trade_permissions tp
    where tp.buyer_type = public.my_user_type()
      and tp.seller_type = p_poster_type
      and tp.can_contact
  );
$$;
revoke execute on function public.can_contact_poster(text) from public, anon;
grant  execute on function public.can_contact_poster(text) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 7. LISTING VISIBILITY (replaces 0001's blanket policy)
--    "Admins view any listing" from 0006 stays untouched.
-- ═══════════════════════════════════════════════════════════
drop policy if exists "Active listings viewable by everyone" on public.listings;
drop policy if exists "Public wholesale listings viewable by everyone" on public.listings;
drop policy if exists "Users view own listings" on public.listings;
drop policy if exists "Permitted supply listings viewable by buyers" on public.listings;
drop policy if exists "Permitted demand listings viewable by sellers" on public.listings;

create policy "Public wholesale listings viewable by everyone" on public.listings
  for select to anon, authenticated
  using (is_public = true and status in ('active','negotiating','reserved','sold'));

create policy "Users view own listings" on public.listings
  for select to authenticated
  using ((select auth.uid()) = created_by_user_id or (select auth.uid()) = seller_id);

create policy "Permitted supply listings viewable by buyers" on public.listings
  for select to authenticated
  using (
    listing_kind = 'supply'
    and status in ('active','negotiating','reserved','sold')
    and exists (
      select 1 from public.trade_permissions tp
      where tp.buyer_type = public.my_user_type()
        and tp.seller_type = public.listings.poster_user_type
        and tp.can_view
    )
  );

create policy "Permitted demand listings viewable by sellers" on public.listings
  for select to authenticated
  using (
    listing_kind = 'demand'
    and status in ('active','negotiating')
    and exists (
      select 1 from public.trade_permissions tp
      where tp.buyer_type = public.listings.poster_user_type
        and tp.seller_type = public.my_user_type()
        and tp.can_view
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 8. PRICE BAND: BEFORE sets status, AFTER writes alerts
--    Demand listings are excluded from both.
-- ═══════════════════════════════════════════════════════════
create or replace function public.fn_price_band_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_risk integer; v_avg numeric(12,2); v_std numeric(12,2); v_n integer;
  v_hi numeric(12,2); v_lo numeric(12,2);
begin
  if new.listing_kind = 'demand' then return new; end if;

  select risk_score into v_risk from public.profiles
  where id = coalesce(new.seller_id, new.created_by_user_id);

  if coalesce(v_risk,0) > 70 then
    new.status := 'flagged_review';
    return new;
  end if;

  select avg_price, std_dev, sample_count into v_avg, v_std, v_n
  from public.market_price_aggregates
  where category_id = new.category_id and upazila_id = new.upazila_id
  order by period_date desc limit 1;

  if v_avg is not null and v_n >= 3 then
    v_hi := greatest(v_avg * 2.0, v_avg + (2.5 * coalesce(v_std,0)));
    v_lo := v_avg * 0.5;
    if new.expected_price > v_hi or new.expected_price < v_lo then
      new.status := 'flagged_review';
    end if;
  end if;
  return new;
end; $$;

create or replace function public.fn_price_band_after()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_risk integer; v_avg numeric(12,2); v_std numeric(12,2); v_n integer;
  v_hi numeric(12,2); v_lo numeric(12,2); v_owner uuid;
begin
  if new.listing_kind = 'demand' then return new; end if;
  v_owner := coalesce(new.seller_id, new.created_by_user_id);

  select risk_score into v_risk from public.profiles where id = v_owner;

  if coalesce(v_risk,0) > 70 then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (v_owner, new.id, 'velocity_spike', 'high',
      'Listing submitted by user with elevated risk score (' || v_risk || ')',
      jsonb_build_object('risk_score', v_risk, 'expected_price', new.expected_price));
    return new;
  end if;

  select avg_price, std_dev, sample_count into v_avg, v_std, v_n
  from public.market_price_aggregates
  where category_id = new.category_id and upazila_id = new.upazila_id
  order by period_date desc limit 1;

  if v_avg is not null and v_n >= 3 then
    v_hi := greatest(v_avg * 2.0, v_avg + (2.5 * coalesce(v_std,0)));
    v_lo := v_avg * 0.5;
    if new.expected_price > v_hi or new.expected_price < v_lo then
      insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
      values (v_owner, new.id, 'price_outlier', 'medium',
        'Listing price (' || new.expected_price || ') deviates from benchmark (' || v_avg || ')',
        jsonb_build_object('expected_price', new.expected_price, 'market_avg', v_avg,
                           'upper_limit', v_hi, 'lower_limit', v_lo, 'samples', v_n));

      -- system write: bypass the profile protection trigger (see section 9)
      perform set_config('app.system_write', 'on', true);
      update public.profiles set risk_score = risk_score + 5 where id = v_owner;
      perform set_config('app.system_write', 'off', true);
    end if;
  end if;
  return new;
end; $$;

-- status is NOT in the UPDATE OF list, so an admin approval never re-flags
create trigger trg_check_price_band_before
  before insert or update of expected_price on public.listings
  for each row execute function public.fn_price_band_before();

create trigger trg_check_price_band_after
  after insert or update of expected_price on public.listings
  for each row execute function public.fn_price_band_after();

-- ═══════════════════════════════════════════════════════════
-- 9. Allow system triggers to write risk_score
--    (column list matches 0006 exactly, plus the bypass)
-- ═══════════════════════════════════════════════════════════
create or replace function public.fn_protect_privileged_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('app.system_write', true) = 'on' then
    return new;
  end if;
  if not public.is_admin(auth.uid()) then
    new.user_type      := old.user_type;
    new.is_verified    := old.is_verified;
    new.risk_score     := old.risk_score;
    new.phone_verified := old.phone_verified;
    new.nid_verified   := old.nid_verified;
    new.kyc_status     := old.kyc_status;
  end if;
  return new;
end; $$;

-- ═══════════════════════════════════════════════════════════
-- 10. REVEAL RPC — returns status instead of raising, so the
--     fraud_alerts inserts actually commit
-- ═══════════════════════════════════════════════════════════
alter table public.fraud_alerts drop constraint if exists fraud_alerts_alert_type_check;
alter table public.fraud_alerts add constraint fraud_alerts_alert_type_check
  check (alert_type in ('price_outlier','phone_scraping','ip_cluster',
                        'velocity_spike','syndicate_match','tier_violation'));

drop function if exists public.reveal_seller_phone_number(uuid, inet);

create function public.reveal_seller_phone_number(p_listing_id uuid, p_viewer_ip inet)
returns table (status text, phone text, seller_name text, is_verified boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid; v_vtype text; v_vverified boolean;
  v_seller uuid; v_ptype text;
  v_phone text; v_name text; v_sverified boolean;
  v_can_contact boolean; v_daily int; v_ip int; v_max_daily int := 10;
begin
  v_viewer := auth.uid();
  if v_viewer is null then
    return query select 'unauthenticated'::text, null::text, null::text, null::boolean; return;
  end if;

  select p.user_type, p.is_verified into v_vtype, v_vverified
  from public.profiles p where p.id = v_viewer;

  if not coalesce(v_vverified, false) then
    return query select 'unverified'::text, null::text, null::text, null::boolean; return;
  end if;

  select l.poster_user_type, l.seller_id into v_ptype, v_seller
  from public.listings l where l.id = p_listing_id;

  if v_seller is null then
    return query select 'not_found'::text, null::text, null::text, null::boolean; return;
  end if;

  select tp.can_contact into v_can_contact from public.trade_permissions tp
  where tp.buyer_type = v_vtype and tp.seller_type = v_ptype;

  if not coalesce(v_can_contact, false) then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (v_viewer, p_listing_id, 'tier_violation', 'medium',
      'Cross-tier contact attempt: ' || coalesce(v_vtype,'?') || ' -> ' || coalesce(v_ptype,'?'),
      jsonb_build_object('viewer_user_type', v_vtype, 'poster_user_type', v_ptype, 'ip', p_viewer_ip));
    return query select 'tier_blocked'::text, null::text, null::text, null::boolean; return;
  end if;

  if v_vtype in ('arathdar','dealer','aggregator') then v_max_daily := 25; end if;

  select count(*) into v_daily from public.phone_reveal_logs
  where viewer_user_id = v_viewer and created_at >= now() - interval '24 hours';

  if v_daily >= v_max_daily then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (v_viewer, p_listing_id, 'phone_scraping', 'high',
      'Daily reveal quota exceeded (' || v_daily || '/' || v_max_daily || ')',
      jsonb_build_object('ip', p_viewer_ip, 'reveals_24h', v_daily));
    return query select 'quota_daily'::text, null::text, null::text, null::boolean; return;
  end if;

  select count(*) into v_ip from public.phone_reveal_logs
  where viewer_ip = p_viewer_ip and created_at >= now() - interval '1 hour';

  if v_ip >= 5 then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (v_viewer, p_listing_id, 'phone_scraping', 'high',
      'Hourly IP reveal quota exceeded (' || v_ip || '/5)',
      jsonb_build_object('ip', p_viewer_ip, 'reveals_1h', v_ip));
    return query select 'quota_ip'::text, null::text, null::text, null::boolean; return;
  end if;

  select p.phone, p.full_name, p.is_verified into v_phone, v_name, v_sverified
  from public.profiles p where p.id = v_seller;

  if v_phone is null then
    return query select 'not_found'::text, null::text, null::text, null::boolean; return;
  end if;

  insert into public.phone_reveal_logs (listing_id, viewer_user_id, viewer_ip)
  values (p_listing_id, v_viewer, p_viewer_ip);

  update public.listings set phone_reveal_count = phone_reveal_count + 1 where id = p_listing_id;

  insert into public.listing_events (listing_id, event_type, user_id, metadata)
  values (p_listing_id, 'phone_revealed', v_viewer, jsonb_build_object('ip', p_viewer_ip));

  return query select 'ok'::text, v_phone, v_name, v_sverified;
end; $$;

revoke execute on function public.reveal_seller_phone_number(uuid, inet) from public, anon;
grant  execute on function public.reveal_seller_phone_number(uuid, inet) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 11. Demand listings must not pollute the price index
-- ═══════════════════════════════════════════════════════════
create or replace function public.recalculate_market_aggregates()
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.market_price_aggregates
    (category_id, upazila_id, district_id, avg_price, min_price, max_price,
     std_dev, sample_count, period_date, updated_at)
  select l.category_id, l.upazila_id, l.district_id,
         round(avg(l.expected_price),2), min(l.expected_price), max(l.expected_price),
         coalesce(round(stddev(l.expected_price),2),0), count(l.id), current_date, now()
  from public.listings l
  where l.status = 'active'
    and l.listing_kind = 'supply'
    and l.created_at >= now() - interval '7 days'
  group by l.category_id, l.upazila_id, l.district_id
  on conflict (category_id, upazila_id, period_date) do update set
    avg_price = excluded.avg_price, min_price = excluded.min_price,
    max_price = excluded.max_price, std_dev = excluded.std_dev,
    sample_count = excluded.sample_count, updated_at = now();
end; $$;

commit;
