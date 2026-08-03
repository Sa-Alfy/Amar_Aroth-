-- Migration: 0001_initial_schema.sql
-- Description: Core Amar Aroth schema including profiles, categories, measurement_units, locations, listings, listing_images, bookmarks, listing_events, and moderation_reports.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text unique,
  full_name text not null,
  user_type text not null check (user_type in ('farmer', 'dealer', 'arathdar', 'aggregator', 'admin')),
  division_id integer,
  district_id integer,
  upazila_id integer,
  address text,
  is_verified boolean default false,
  nid_number text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id serial primary key,
  name_en text not null,
  name_bn text not null,
  slug text unique not null,
  icon text not null,
  description text,
  sort_order integer default 0
);

-- 3. MEASUREMENT UNITS TABLE
create table if not exists public.measurement_units (
  id serial primary key,
  name_en text not null,
  name_bn text not null,
  symbol_en text not null,
  symbol_bn text not null,
  category_id integer references public.categories(id)
);

-- 4. LOCATIONS TABLES (Divisions, Districts, Upazilas)
create table if not exists public.divisions (
  id integer primary key,
  name_en text not null,
  name_bn text not null
);

create table if not exists public.districts (
  id integer primary key,
  division_id integer references public.divisions(id),
  name_en text not null,
  name_bn text not null
);

create table if not exists public.upazilas (
  id integer primary key,
  district_id integer references public.districts(id),
  name_en text not null,
  name_bn text not null
);

-- 5. SUPPLY LISTINGS TABLE
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  created_by_user_id uuid references public.profiles(id) on delete cascade not null,
  category_id integer references public.categories(id) not null,
  title text not null,
  description text,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_id integer references public.measurement_units(id) not null,
  expected_price numeric(12, 2) not null check (expected_price >= 0),
  minimum_order_quantity numeric(12, 2),
  division_id integer references public.divisions(id) not null,
  district_id integer references public.districts(id) not null,
  upazila_id integer references public.upazilas(id) not null,
  specific_location text,
  status text not null default 'active' check (status in ('draft', 'active', 'negotiating', 'reserved', 'sold', 'hidden', 'rejected')),
  available_from date default current_date,
  expires_at timestamp with time zone default (now() + interval '30 days'),
  view_count integer default 0,
  phone_reveal_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. LISTING IMAGES TABLE
create table if not exists public.listing_images (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  image_url text not null,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. BOOKMARKS TABLE
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, listing_id)
);

-- 8. UNIFIED LISTING EVENTS LEDGER
create table if not exists public.listing_events (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  event_type text not null check (event_type in ('created', 'updated', 'viewed', 'phone_revealed', 'reserved', 'sold', 'reported')),
  user_id uuid references public.profiles(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. MODERATION REPORTS TABLE
create table if not exists public.moderation_reports (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id),
  reason text not null check (reason in ('fake_price', 'wrong_location', 'sold_out', 'spam', 'inappropriate')),
  details text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.bookmarks enable row level security;
alter table public.listing_events enable row level security;
alter table public.moderation_reports enable row level security;

-- PROFILES POLICIES
create policy "Public profiles viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- LISTINGS POLICIES
create policy "Active listings viewable by everyone" on public.listings for select using (status in ('active', 'negotiating', 'reserved', 'sold') or (select auth.uid()) = created_by_user_id);
create policy "Authenticated users create listings" on public.listings for insert to authenticated with check ((select auth.uid()) = created_by_user_id);
create policy "Creators update own listings" on public.listings for update to authenticated using ((select auth.uid()) = created_by_user_id) with check ((select auth.uid()) = created_by_user_id);
create policy "Creators delete own listings" on public.listings for delete to authenticated using ((select auth.uid()) = created_by_user_id);

-- LISTING IMAGES POLICIES
create policy "Images viewable by everyone" on public.listing_images for select using (true);
create policy "Creators manage listing images" on public.listing_images for all to authenticated using (
  exists (select 1 from public.listings where id = listing_images.listing_id and created_by_user_id = (select auth.uid()))
);

-- BOOKMARKS POLICIES
create policy "Users view own bookmarks" on public.bookmarks for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own bookmarks" on public.bookmarks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users delete own bookmarks" on public.bookmarks for delete to authenticated using ((select auth.uid()) = user_id);
