-- ═══════════════════════════════════════════════════════════════════════════
-- Amar Aroth — consolidated schema
--
-- Replaces the old 0001–0010 chain. Those are in git history (commit 5c592e3
-- and earlier); nothing was deployed, so there was no reason to carry seven
-- migrations of archaeology forward.
--
-- PORTABILITY CONTRACT
-- --------------------
-- This schema is plain PostgreSQL 15+. It runs on Supabase, on a container,
-- or on a managed Postgres, with exactly one thing to change: the identity
-- adapter, public.current_user_id(), in section 2.
--
-- It deliberately does NOT use:
--   * auth.uid()          -- reads the JWT claim directly instead
--   * a foreign key to auth.users
--   * any Supabase extension or schema
--
-- The `anon` and `authenticated` roles are ordinary Postgres roles. Supabase
-- creates them; section 1 creates them if they are missing, so the same file
-- works anywhere.
--
-- To move off Supabase you rewrite section 2 and the ~15 route handlers that
-- speak PostgREST. The security model — every rule below — comes with you
-- unchanged, because RLS is a Postgres feature, not a vendor feature.
--
-- INVARIANTS THIS FILE ENFORCES (see CLAUDE.md)
--   1. The database is the security boundary. The anon key is public.
--   2. Identity never comes from a request body.
--   3. poster_user_type / is_public / listing_kind / source_listing_id are
--      server-owned, set by trigger on INSERT and UPDATE.
--   4. Errors are never masked.
--   5. Fraud logging must survive — guard paths return a status, never raise.
--   6. phone and nid_number never reach a client payload except via the
--      reveal RPC.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════
-- 1. ROLES
-- Supabase already has these. Creating them here keeps the file portable.
-- ═══════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

grant usage on schema public to anon, authenticated;

-- Supabase's default privileges grant ALL on every new table to anon and
-- authenticated. That is what made profiles_public writable by anonymous
-- callers in the previous schema. Shut it off before creating anything, then
-- grant explicitly in section 9.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;


-- ═══════════════════════════════════════════════════════════
-- 2. IDENTITY ADAPTER  ← the only vendor-aware code in this schema
--
-- Resolution order:
--   1. app.user_id           -- set by your own backend, per transaction:
--                               SET LOCAL app.user_id = '<uuid>';
--   2. request.jwt.claims    -- set by PostgREST from the JWT. This is what
--                               Supabase's auth.uid() reads internally; we
--                               read it directly so the schema does not
--                               depend on the auth schema existing.
--
-- Returns null when neither is present, which is the anonymous case.
-- ═══════════════════════════════════════════════════════════

create or replace function public.current_user_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_raw text;
begin
  v_raw := current_setting('app.user_id', true);
  if v_raw is not null and v_raw <> '' then
    return v_raw::uuid;
  end if;

  v_raw := current_setting('request.jwt.claims', true);
  if v_raw is not null and v_raw <> '' then
    return nullif(v_raw::jsonb ->> 'sub', '')::uuid;
  end if;

  return null;
exception
  when others then
    -- A malformed claim must read as "anonymous", never as an error that
    -- leaks through a policy.
    return null;
end;
$$;

grant execute on function public.current_user_id() to anon, authenticated;


-- ═══════════════════════════════════════════════════════════
-- 3. REFERENCE TABLES
-- No user data. Readable by everyone, writable by nobody through the API.
-- ═══════════════════════════════════════════════════════════

create table public.categories (
  id          serial primary key,
  name_en     text not null,
  name_bn     text not null,
  slug        text unique not null,
  icon        text not null,
  description text,
  sort_order  integer default 0
);

create table public.measurement_units (
  id          serial primary key,
  name_en     text not null,
  name_bn     text not null,
  symbol_en   text not null,
  symbol_bn   text not null,
  category_id integer references public.categories(id)
);

create table public.divisions (
  id      integer primary key,
  name_en text not null,
  name_bn text not null
);

create table public.districts (
  id          integer primary key,
  division_id integer references public.divisions(id),
  name_en     text not null,
  name_bn     text not null
);

create table public.upazilas (
  id          integer primary key,
  district_id integer references public.districts(id),
  name_en     text not null,
  name_bn     text not null
);


-- ═══════════════════════════════════════════════════════════
-- 4. IDENTITY AND TRADE
--
-- profiles.id is a plain uuid, NOT a foreign key to auth.users. The auth
-- provider owns credentials; this table owns the application user. Keeping
-- them decoupled is what makes the schema portable, and it means a test
-- account can be seeded in pure SQL.
--
-- Trade-off, stated plainly: nothing at the database level stops a profile
-- from outliving its auth record. The signup route creates both; an account
-- deletion path must delete both.
-- ═══════════════════════════════════════════════════════════

create table public.profiles (
  id              uuid primary key,
  phone           text unique,
  full_name       text not null,
  user_type       text not null
                    check (user_type in ('farmer', 'arathdar', 'dokandar', 'admin')),
  division_id     integer references public.divisions(id),
  district_id     integer references public.districts(id),
  upazila_id      integer references public.upazilas(id),
  address         text,
  nid_number      text,
  avatar_url      text,

  -- trust state — server-owned, see fn_protect_privileged_profile_fields
  is_verified     boolean not null default false,
  phone_verified  boolean not null default false,
  nid_verified    boolean not null default false,
  risk_score      integer not null default 0 check (risk_score >= 0),
  kyc_status      text not null default 'pending'
                    check (kyc_status in ('pending', 'verified', 'rejected')),
  kyc_reviewed_by uuid references public.profiles(id),
  kyc_reviewed_at timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Who may deal with whom is DATA, never code. Adding a trade relationship is
-- an INSERT. Read forward (buyer_type = me) for supply, backward
-- (seller_type = me) for demand.
create table public.trade_permissions (
  buyer_type  text not null,
  seller_type text not null,
  can_view    boolean not null default true,
  can_contact boolean not null default true,
  primary key (buyer_type, seller_type)
);

insert into public.trade_permissions (buyer_type, seller_type, can_view, can_contact) values
  ('arathdar', 'farmer',   true,  true),   -- arathdar buys from farmer
  ('dokandar', 'arathdar', true,  true),   -- dokandar buys from arathdar
  ('arathdar', 'arathdar', true,  true),   -- inter-district arbitrage
  ('farmer',   'farmer',   true,  false);  -- peer price reference, NO phone

-- There is deliberately no row for dokandar -> farmer. That absence IS the
-- product's core constraint. Do not add one.
-- There is deliberately no row for admin either: moderation must not be a
-- back door to every phone number in the country.


-- ═══════════════════════════════════════════════════════════
-- 5. LISTINGS
-- ═══════════════════════════════════════════════════════════

create table public.listings (
  id                     uuid primary key default gen_random_uuid(),
  seller_id              uuid not null references public.profiles(id) on delete cascade,
  created_by_user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id            integer not null references public.categories(id),
  title                  text not null,
  description            text,
  quantity               numeric(12,2) not null check (quantity > 0),
  unit_id                integer not null references public.measurement_units(id),
  expected_price         numeric(12,2) not null check (expected_price >= 0),
  minimum_order_quantity numeric(12,2),
  division_id            integer not null references public.divisions(id),
  district_id            integer not null references public.districts(id),
  upazila_id             integer not null references public.upazilas(id),
  specific_location      text,

  status                 text not null default 'active'
                           check (status in ('draft','active','negotiating','reserved',
                                             'sold','hidden','rejected',
                                             'flagged_review','suspended')),

  -- SERVER-OWNED. Set by trg_a_set_listing_poster_and_visibility on INSERT
  -- and UPDATE. Never accept these from a client body.
  listing_kind           text not null default 'supply'
                           check (listing_kind in ('supply','demand')),
  poster_user_type       text,
  is_public              boolean not null default false,
  source_listing_id      uuid references public.listings(id) on delete set null,

  available_from         date default current_date,
  expires_at             timestamptz default (now() + interval '30 days'),
  view_count             integer not null default 0,
  phone_reveal_count     integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url  text not null,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create table public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create table public.listing_events (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  event_type text not null
               check (event_type in ('created','updated','viewed','phone_revealed',
                                     'reserved','sold','reported')),
  user_id    uuid references public.profiles(id),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.moderation_reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid references public.profiles(id),
  reason      text not null
                check (reason in ('fake_price','wrong_location','sold_out',
                                  'spam','inappropriate')),
  details     text,
  status      text not null default 'pending'
                check (status in ('pending','reviewed','dismissed')),
  created_at  timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════
-- 6. FRAUD AND RATE-LIMIT LEDGERS
-- Written by SECURITY DEFINER code only. No client ever inserts here.
-- ═══════════════════════════════════════════════════════════

create table public.market_price_aggregates (
  id           uuid primary key default gen_random_uuid(),
  category_id  integer not null references public.categories(id) on delete cascade,
  upazila_id   integer not null references public.upazilas(id) on delete cascade,
  district_id  integer not null references public.districts(id) on delete cascade,
  avg_price    numeric(12,2) not null check (avg_price >= 0),
  min_price    numeric(12,2) not null check (min_price >= 0),
  max_price    numeric(12,2) not null check (max_price >= 0),
  std_dev      numeric(12,2) not null default 0 check (std_dev >= 0),
  sample_count integer not null default 0,
  period_date  date not null default current_date,
  updated_at   timestamptz not null default now(),
  unique (category_id, upazila_id, period_date)
);

create table public.user_device_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete cascade,
  ip_address         inet not null,
  device_fingerprint text,
  user_agent         text,
  action             text not null
                       check (action in ('login','signup','create_listing',
                                         'update_listing','phone_reveal')),
  created_at         timestamptz not null default now()
);

create table public.fraud_alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete cascade,
  alert_type  text not null
                check (alert_type in ('price_outlier','phone_scraping','ip_cluster',
                                      'velocity_spike','syndicate_match','tier_violation')),
  severity    text not null check (severity in ('low','medium','high','critical')),
  description text not null,
  metadata    jsonb not null default '{}'::jsonb,
  status      text not null default 'pending'
                check (status in ('pending','reviewed','actioned','dismissed')),
  created_at  timestamptz not null default now()
);

create table public.phone_reveal_logs (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references public.listings(id) on delete cascade,
  viewer_user_id uuid not null references public.profiles(id) on delete cascade,
  viewer_ip      inet not null,
  created_at     timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════
-- 7. INDEXES
-- ═══════════════════════════════════════════════════════════

create index idx_listings_active_category_location
  on public.listings (category_id, upazila_id, status, created_at desc);
create index idx_listings_status_partial
  on public.listings (status) where status = 'active';
create index idx_listings_kind_poster_status
  on public.listings (listing_kind, poster_user_type, status);
create index idx_listings_public
  on public.listings (is_public, status) where is_public;
create index idx_listings_seller        on public.listings (seller_id);
create index idx_listings_creator       on public.listings (created_by_user_id);
create index idx_listing_images_listing on public.listing_images (listing_id);
create index idx_listing_events_listing on public.listing_events (listing_id);
create index idx_bookmarks_user         on public.bookmarks (user_id);
create index idx_districts_division     on public.districts (division_id);
create index idx_upazilas_district      on public.upazilas (district_id);
create index idx_market_price_aggregates_lookup
  on public.market_price_aggregates (category_id, upazila_id, period_date desc);
create index idx_user_device_logs_ip_action
  on public.user_device_logs (ip_address, action, created_at desc);
create index idx_phone_reveal_user_window
  on public.phone_reveal_logs (viewer_user_id, created_at desc);
create index idx_phone_reveal_ip_window
  on public.phone_reveal_logs (viewer_ip, created_at desc);
create index idx_fraud_alerts_status
  on public.fraud_alerts (status, severity, created_at desc);


-- ═══════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
--
-- Every one is SECURITY DEFINER with `set search_path = ''` and fully
-- qualified names. is_admin and my_user_type exist to break RLS recursion:
-- a policy on profiles cannot query profiles directly without looping.
--
-- These are granted to anon as well as authenticated. They read only the
-- caller's own identity and return null/false when there is none, so they
-- disclose nothing — and a view that calls them needs the CALLING role to
-- hold EXECUTE even when the view itself bypasses RLS. That asymmetry
-- (tables resolve as the view owner, functions do not) is what broke the
-- previous schema for anonymous readers.
-- ═══════════════════════════════════════════════════════════

create or replace function public.is_admin(uid uuid default public.current_user_id())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.user_type = 'admin'
  );
$$;

create or replace function public.my_user_type()
returns text language sql stable security definer set search_path = '' as $$
  select p.user_type from public.profiles p where p.id = public.current_user_id();
$$;

create or replace function public.can_contact_poster(p_poster_type text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trade_permissions tp
    where tp.buyer_type = public.my_user_type()
      and tp.seller_type = p_poster_type
      and tp.can_contact
  );
$$;

grant execute on function public.is_admin(uuid)           to anon, authenticated;
grant execute on function public.my_user_type()           to anon, authenticated;
grant execute on function public.can_contact_poster(text) to authenticated;


-- ═══════════════════════════════════════════════════════════
-- 9. TRIGGERS
--
-- BEFORE triggers on one table fire in ALPHABETICAL ORDER BY TRIGGER NAME.
-- trg_a_* is named to sort first so the tier is resolved before the price
-- band logic reads it. Renaming these changes behaviour.
-- ═══════════════════════════════════════════════════════════

-- 9a. Server-owned listing columns. Tier derives from seller_id, because
--     seller_id's phone is what a reveal exposes.
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

create trigger trg_a_set_listing_poster_and_visibility
  before insert or update on public.listings
  for each row execute function public.fn_set_listing_poster_and_visibility();


-- 9b. Trust state is server-owned. A non-admin writer silently keeps the
--     old values rather than being rejected, so an ordinary profile edit
--     still succeeds. app.system_write is the bypass for trigger-driven
--     writes (see 9d) and for admin scripts run outside a session.
create or replace function public.fn_protect_privileged_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('app.system_write', true) = 'on' then
    return new;
  end if;
  if not public.is_admin(public.current_user_id()) then
    new.user_type      := old.user_type;
    new.is_verified    := old.is_verified;
    new.risk_score     := old.risk_score;
    new.phone_verified := old.phone_verified;
    new.nid_verified   := old.nid_verified;
    new.kyc_status     := old.kyc_status;
  end if;
  return new;
end; $$;

create trigger trg_protect_privileged_profile_fields
  before update on public.profiles
  for each row execute function public.fn_protect_privileged_profile_fields();


-- 9c. Price band, BEFORE: may change status. Demand listings are exempt —
--     a buyer naming their own price is not a market anomaly.
create or replace function public.fn_price_band_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_risk integer; v_avg numeric(12,2); v_std numeric(12,2); v_n integer;
  v_hi numeric(12,2); v_lo numeric(12,2);
begin
  if new.listing_kind = 'demand' then return new; end if;

  select p.risk_score into v_risk from public.profiles p
  where p.id = coalesce(new.seller_id, new.created_by_user_id);

  if coalesce(v_risk, 0) > 70 then
    new.status := 'flagged_review';
    return new;
  end if;

  select m.avg_price, m.std_dev, m.sample_count into v_avg, v_std, v_n
  from public.market_price_aggregates m
  where m.category_id = new.category_id and m.upazila_id = new.upazila_id
  order by m.period_date desc limit 1;

  if v_avg is not null and v_n >= 3 then
    v_hi := greatest(v_avg * 2.0, v_avg + (2.5 * coalesce(v_std, 0)));
    v_lo := v_avg * 0.5;
    if new.expected_price > v_hi or new.expected_price < v_lo then
      new.status := 'flagged_review';
    end if;
  end if;
  return new;
end; $$;


-- 9d. Price band, AFTER: writes the alert. Split from the BEFORE half
--     because new.id does not exist yet in a BEFORE INSERT, and an alert
--     without a listing_id is useless to a moderator.
create or replace function public.fn_price_band_after()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_risk integer; v_avg numeric(12,2); v_std numeric(12,2); v_n integer;
  v_hi numeric(12,2); v_lo numeric(12,2); v_owner uuid;
begin
  if new.listing_kind = 'demand' then return new; end if;
  v_owner := coalesce(new.seller_id, new.created_by_user_id);

  select p.risk_score into v_risk from public.profiles p where p.id = v_owner;

  if coalesce(v_risk, 0) > 70 then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (v_owner, new.id, 'velocity_spike', 'high',
      'Listing submitted by user with elevated risk score (' || v_risk || ')',
      jsonb_build_object('risk_score', v_risk, 'expected_price', new.expected_price));
    return new;
  end if;

  select m.avg_price, m.std_dev, m.sample_count into v_avg, v_std, v_n
  from public.market_price_aggregates m
  where m.category_id = new.category_id and m.upazila_id = new.upazila_id
  order by m.period_date desc limit 1;

  if v_avg is not null and v_n >= 3 then
    v_hi := greatest(v_avg * 2.0, v_avg + (2.5 * coalesce(v_std, 0)));
    v_lo := v_avg * 0.5;
    if new.expected_price > v_hi or new.expected_price < v_lo then
      insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
      values (v_owner, new.id, 'price_outlier', 'medium',
        'Listing price (' || new.expected_price || ') deviates from benchmark (' || v_avg || ')',
        jsonb_build_object('expected_price', new.expected_price, 'market_avg', v_avg,
                           'upper_limit', v_hi, 'lower_limit', v_lo, 'samples', v_n));

      -- system write: the risk bump must not be reverted by 9b
      perform set_config('app.system_write', 'on', true);
      update public.profiles set risk_score = risk_score + 5 where id = v_owner;
      perform set_config('app.system_write', 'off', true);
    end if;
  end if;
  return new;
end; $$;

-- `update of expected_price` only, so an admin approving a listing by
-- changing its status never re-flags it.
create trigger trg_check_price_band_before
  before insert or update of expected_price on public.listings
  for each row execute function public.fn_price_band_before();

create trigger trg_check_price_band_after
  after insert or update of expected_price on public.listings
  for each row execute function public.fn_price_band_after();


-- 9e. Rolling 7-day market benchmarks. Called on a schedule, not by a trigger.
create or replace function public.recalculate_market_aggregates()
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.market_price_aggregates
    (category_id, upazila_id, district_id, avg_price, min_price, max_price,
     std_dev, sample_count, period_date, updated_at)
  select
    l.category_id, l.upazila_id, l.district_id,
    round(avg(l.expected_price), 2),
    min(l.expected_price),
    max(l.expected_price),
    coalesce(round(stddev(l.expected_price), 2), 0),
    count(l.id),
    current_date,
    now()
  from public.listings l
  where l.status = 'active'
    and l.listing_kind = 'supply'
    and l.created_at >= (now() - interval '7 days')
  group by l.category_id, l.upazila_id, l.district_id
  on conflict (category_id, upazila_id, period_date)
  do update set
    avg_price    = excluded.avg_price,
    min_price    = excluded.min_price,
    max_price    = excluded.max_price,
    std_dev      = excluded.std_dev,
    sample_count = excluded.sample_count,
    updated_at   = now();
end; $$;


-- ═══════════════════════════════════════════════════════════
-- 10. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

alter table public.categories              enable row level security;
alter table public.measurement_units        enable row level security;
alter table public.divisions                enable row level security;
alter table public.districts                enable row level security;
alter table public.upazilas                 enable row level security;
alter table public.profiles                 enable row level security;
alter table public.trade_permissions        enable row level security;
alter table public.listings                 enable row level security;
alter table public.listing_images           enable row level security;
alter table public.bookmarks                enable row level security;
alter table public.listing_events           enable row level security;
alter table public.moderation_reports       enable row level security;
alter table public.market_price_aggregates  enable row level security;
alter table public.user_device_logs         enable row level security;
alter table public.fraud_alerts             enable row level security;
alter table public.phone_reveal_logs        enable row level security;

-- RLS with zero policies means deny-all. Every table above therefore needs a
-- policy or it is invisible — the previous schema had five reference tables
-- in exactly that state, returning nothing to the app for weeks.

-- 10a. Reference data: readable by all, writable by none.
create policy "Categories readable"  on public.categories
  for select to anon, authenticated using (true);
create policy "Units readable"       on public.measurement_units
  for select to anon, authenticated using (true);
create policy "Divisions readable"   on public.divisions
  for select to anon, authenticated using (true);
create policy "Districts readable"   on public.districts
  for select to anon, authenticated using (true);
create policy "Upazilas readable"    on public.upazilas
  for select to anon, authenticated using (true);
create policy "Market aggregates readable" on public.market_price_aggregates
  for select to anon, authenticated using (true);

-- 10b. Profiles: the base table is own-row or admin only. Cross-user reads
--      go through profiles_public (section 11), never here — this table
--      holds phone and nid_number.
create policy "Users view own profile" on public.profiles
  for select to authenticated using (id = public.current_user_id());

create policy "Admins view any profile" on public.profiles
  for select to authenticated using (public.is_admin());

create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (
    id = public.current_user_id()
    and public.current_user_id() is not null
    and user_type <> 'admin'
    and is_verified = false
    and nid_verified = false
    and kyc_status = 'pending'
    and risk_score = 0
  );

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = public.current_user_id())
  with check (id = public.current_user_id());

create policy "Admins update any profile" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 10c. Trade permissions: readable so the client can build feeds; writable
--      by admins only.
create policy "Trade permissions readable" on public.trade_permissions
  for select to authenticated using (true);
create policy "Admins manage trade permissions" on public.trade_permissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 10d. Listings — the tier rule. Note every branch reads trade_permissions
--      rather than naming a role.
create policy "Public wholesale listings viewable by everyone" on public.listings
  for select to anon, authenticated
  using (is_public and status in ('active','negotiating','reserved','sold'));

create policy "Users view own listings" on public.listings
  for select to authenticated
  using (created_by_user_id = public.current_user_id()
      or seller_id = public.current_user_id());

create policy "Admins view any listing" on public.listings
  for select to authenticated using (public.is_admin());

create policy "Permitted supply listings viewable by buyers" on public.listings
  for select to authenticated
  using (
    listing_kind = 'supply'
    and status in ('active','negotiating','reserved','sold')
    and exists (
      select 1 from public.trade_permissions tp
      where tp.buyer_type = public.my_user_type()
        and tp.seller_type = listings.poster_user_type
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
      where tp.buyer_type = listings.poster_user_type
        and tp.seller_type = public.my_user_type()
        and tp.can_view
    )
  );

create policy "Authenticated users create listings" on public.listings
  for insert to authenticated
  with check (created_by_user_id = public.current_user_id());

create policy "Creators update own listings" on public.listings
  for update to authenticated
  using (created_by_user_id = public.current_user_id())
  with check (created_by_user_id = public.current_user_id());

create policy "Admins update any listing" on public.listings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Creators delete own listings" on public.listings
  for delete to authenticated using (created_by_user_id = public.current_user_id());

-- 10e. Images inherit the parent listing's visibility. The subquery is
--      evaluated under the caller's RLS on listings, so the tier rule
--      applies without being restated. `using (true)` here was a cross-tier
--      leak in the previous schema.
create policy "Images follow listing visibility" on public.listing_images
  for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_images.listing_id));

create policy "Creators manage listing images" on public.listing_images
  for all to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_images.listing_id
      and l.created_by_user_id = public.current_user_id()
  ));

-- 10f. Bookmarks: strictly own-row.
create policy "Users view own bookmarks" on public.bookmarks
  for select to authenticated using (user_id = public.current_user_id());
create policy "Users add own bookmarks" on public.bookmarks
  for insert to authenticated with check (user_id = public.current_user_id());
create policy "Users delete own bookmarks" on public.bookmarks
  for delete to authenticated using (user_id = public.current_user_id());

-- 10g. Events: append-only for clients, readable by admins. Zero policies
--      here previously meant every insert was rejected and the ledger stayed
--      empty.
create policy "Anyone can log a listing event" on public.listing_events
  for insert to anon, authenticated with check (true);
create policy "Admins view listing events" on public.listing_events
  for select to authenticated using (public.is_admin());

-- 10h. Moderation: a user may report, and see their own reports. Admins see
--      and manage everything.
create policy "Users file own reports" on public.moderation_reports
  for insert to authenticated with check (reporter_id = public.current_user_id());
create policy "Users view own reports" on public.moderation_reports
  for select to authenticated using (reporter_id = public.current_user_id());
create policy "Admins manage moderation reports" on public.moderation_reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 10i. Audit ledgers: clients may append device logs at signup/login; the
--      fraud and reveal ledgers are written only by SECURITY DEFINER code.
create policy "Clients append device logs" on public.user_device_logs
  for insert to anon, authenticated with check (true);
create policy "Admins view device logs" on public.user_device_logs
  for select to authenticated using (public.is_admin());
create policy "Admins manage fraud alerts" on public.fraud_alerts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins view phone reveal logs" on public.phone_reveal_logs
  for select to authenticated using (public.is_admin());


-- ═══════════════════════════════════════════════════════════
-- 11. PUBLIC PROFILE PROJECTION
--
-- This view deliberately runs WITHOUT security_invoker, so it does not apply
-- RLS on profiles. The WHERE clause is the authorization boundary instead,
-- and it reads trade_permissions like everything else.
--
-- Why not security_invoker? Because profiles is own-row-only by design. With
-- invoker on, an arathdar could not see the name of a farmer whose listing
-- they are entitled to see, and the anonymous board would lose seller names.
-- The alternative — a permissive SELECT policy on profiles — would expose
-- phone and nid_number to direct PostgREST queries. Invariant 6 forbids that.
--
-- A view that bypasses RLS must never be writable. A single-table projection
-- like this one is auto-updatable, so writes would reach profiles with RLS
-- bypassed. Section 12 grants SELECT and nothing else. Do not add write
-- privileges here.
-- ═══════════════════════════════════════════════════════════

create view public.profiles_public as
select
  p.id, p.full_name, p.user_type, p.is_verified,
  p.division_id, p.district_id, p.upazila_id
from public.profiles p
where
  p.id = public.current_user_id()
  or public.is_admin(public.current_user_id())
  or exists (
    select 1 from public.listings l
    where l.seller_id = p.id and l.is_public
      and l.status in ('active','negotiating','reserved','sold')
  )
  or exists (
    select 1 from public.listings l
    join public.trade_permissions tp
      on tp.buyer_type = public.my_user_type()
     and tp.seller_type = l.poster_user_type
    where l.seller_id = p.id and l.listing_kind = 'supply' and tp.can_view
      and l.status in ('active','negotiating','reserved','sold')
  )
  or exists (
    select 1 from public.listings l
    join public.trade_permissions tp
      on tp.buyer_type = l.poster_user_type
     and tp.seller_type = public.my_user_type()
    where l.seller_id = p.id and l.listing_kind = 'demand' and tp.can_view
      and l.status in ('active','negotiating')
  );


-- ═══════════════════════════════════════════════════════════
-- 12. GRANTS
--
-- Explicit and minimal. RLS decides WHICH ROWS; grants decide WHETHER THE
-- VERB IS AVAILABLE AT ALL. Both matter: RLS does not protect a view, and a
-- missing grant is a clearer failure than a policy that silently matches
-- nothing.
-- ═══════════════════════════════════════════════════════════

-- reference data
grant select on public.categories, public.measurement_units,
                public.divisions, public.districts, public.upazilas,
                public.market_price_aggregates
  to anon, authenticated;

-- identity
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles_public to anon, authenticated;
grant select on public.trade_permissions to authenticated;

-- listings
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant select on public.listing_images to anon, authenticated;
grant insert, update, delete on public.listing_images to authenticated;
grant select, insert, delete on public.bookmarks to authenticated;

-- ledgers
grant insert on public.listing_events to anon, authenticated;
grant select on public.listing_events to authenticated;
grant insert on public.user_device_logs to anon, authenticated;
grant select on public.user_device_logs to authenticated;
grant select, insert, update on public.moderation_reports to authenticated;
grant select, update on public.fraud_alerts to authenticated;
grant select on public.phone_reveal_logs to authenticated;

-- sequences behind the serial reference keys are admin-only on purpose:
-- clients never insert reference rows.


-- ═══════════════════════════════════════════════════════════
-- 13. PHONE REVEAL RPC
--
-- The only path to a phone number. SECURITY DEFINER, so it bypasses RLS —
-- which means a caller who knows a listing id never has to see that listing
-- in a feed. Every check therefore lives here, not in the policies.
--
-- INVARIANT 5: this function RETURNS A STATUS. It must never `raise`, because
-- `raise` in Postgres rolls back the transaction — including the fraud_alerts
-- row inserted moments earlier. A blocked attempt that logs nothing is worse
-- than no check at all.
-- ═══════════════════════════════════════════════════════════

create or replace function public.reveal_seller_phone_number(
  p_listing_id uuid,
  p_viewer_ip  inet
)
returns table (status text, phone text, seller_name text, is_verified boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_viewer uuid; v_vtype text; v_vverified boolean;
  v_seller uuid; v_ptype text;
  v_phone text; v_name text; v_sverified boolean;
  v_can_contact boolean; v_daily int; v_ip int; v_max_daily int := 10;
begin
  v_viewer := public.current_user_id();
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

  select tp.can_contact into v_can_contact
  from public.trade_permissions tp
  where tp.buyer_type = v_vtype and tp.seller_type = v_ptype;

  if not coalesce(v_can_contact, false) then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (v_viewer, p_listing_id, 'tier_violation', 'medium',
      'Cross-tier contact attempt: ' || coalesce(v_vtype,'?') || ' -> ' || coalesce(v_ptype,'?'),
      jsonb_build_object('viewer_user_type', v_vtype, 'poster_user_type', v_ptype, 'ip', p_viewer_ip));
    return query select 'tier_blocked'::text, null::text, null::text, null::boolean; return;
  end if;

  if v_vtype = 'arathdar' then v_max_daily := 25; end if;

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

  update public.listings set phone_reveal_count = phone_reveal_count + 1
  where id = p_listing_id;

  insert into public.listing_events (listing_id, event_type, user_id, metadata)
  values (p_listing_id, 'phone_revealed', v_viewer, jsonb_build_object('ip', p_viewer_ip));

  return query select 'ok'::text, v_phone, v_name, v_sverified;
end; $$;

revoke execute on function public.reveal_seller_phone_number(uuid, inet) from public, anon;
grant  execute on function public.reveal_seller_phone_number(uuid, inet) to authenticated;
