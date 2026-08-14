-- Migration: 0006_fix_rls_recursion.sql
-- Description: Replace recursive profile self-queries in admin RLS policies with a helper function and harden security-definer functions.

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where public.profiles.id = uid
      and public.profiles.user_type = 'admin'
  );
$$;

revoke execute on function public.is_admin(uuid) from anon;
revoke execute on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Drop recursive admin policies and recreate them using the helper function.
drop policy if exists "Admins update any profile" on public.profiles;
drop policy if exists "Admins can view any profile" on public.profiles;
drop policy if exists "Admins view any listing" on public.listings;
drop policy if exists "Admins update any listing" on public.listings;
drop policy if exists "Admins manage moderation reports" on public.moderation_reports;
drop policy if exists "Admins view device logs" on public.user_device_logs;
drop policy if exists "Admins manage fraud alerts" on public.fraud_alerts;
drop policy if exists "Admins view phone reveal logs" on public.phone_reveal_logs;

create policy "Admins update any profile" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view any profile" on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy "Admins view any listing" on public.listings
  for select to authenticated
  using (public.is_admin());

create policy "Admins update any listing" on public.listings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage moderation reports" on public.moderation_reports
  for all to authenticated
  using (public.is_admin());

create policy "Admins view device logs" on public.user_device_logs
  for select to authenticated
  using (public.is_admin());

create policy "Admins manage fraud alerts" on public.fraud_alerts
  for all to authenticated
  using (public.is_admin());

create policy "Admins view phone reveal logs" on public.phone_reveal_logs
  for select to authenticated
  using (public.is_admin());

-- Preserve the trust-boundary trigger but remove the recursive self-reference.
drop trigger if exists trg_protect_privileged_profile_fields on public.profiles;
drop function if exists public.fn_protect_privileged_profile_fields();

create or replace function public.fn_protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.user_type := old.user_type;
    new.is_verified := old.is_verified;
    new.risk_score := old.risk_score;
    new.phone_verified := old.phone_verified;
    new.nid_verified := old.nid_verified;
  end if;

  return new;
end;
$$;

create trigger trg_protect_privileged_profile_fields
  before update on public.profiles
  for each row
  execute function public.fn_protect_privileged_profile_fields();

-- Recreate security-definer functions with a hardened search path but no logic changes.
create or replace function public.recalculate_market_aggregates()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.market_price_aggregates (category_id, upazila_id, district_id, avg_price, min_price, max_price, std_dev, sample_count, period_date, updated_at)
  select 
    l.category_id,
    l.upazila_id,
    l.district_id,
    round(avg(l.expected_price), 2) as avg_price,
    min(l.expected_price) as min_price,
    max(l.expected_price) as max_price,
    coalesce(round(stddev(l.expected_price), 2), 0) as std_dev,
    count(l.id) as sample_count,
    current_date as period_date,
    now() as updated_at
  from public.listings l
  where l.status = 'active'
    and l.created_at >= (now() - interval '7 days')
  group by l.category_id, l.upazila_id, l.district_id
  on conflict (category_id, upazila_id, period_date) 
  do update set 
    avg_price = excluded.avg_price,
    min_price = excluded.min_price,
    max_price = excluded.max_price,
    std_dev = excluded.std_dev,
    sample_count = excluded.sample_count,
    updated_at = now();
end;
$$;

create or replace function public.fn_check_price_band_and_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avg_price numeric(12, 2);
  v_std_dev numeric(12, 2);
  v_samples integer;
  v_is_verified boolean;
  v_phone_verified boolean;
  v_user_risk integer;
  v_upper_limit numeric(12, 2);
  v_lower_limit numeric(12, 2);
begin
  -- Check seller profile details
  select is_verified, phone_verified, risk_score 
  into v_is_verified, v_phone_verified, v_user_risk
  from public.profiles 
  where id = NEW.created_by_user_id;

  -- High-risk user safeguard: auto-flag listings created by users with risk_score > 70
  if v_user_risk > 70 then
    NEW.status := 'flagged_review';
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (
      NEW.created_by_user_id, 
      NEW.id, 
      'velocity_spike', 
      'high', 
      'Listing submitted by user with elevated risk score (' || v_user_risk || ')',
      jsonb_build_object('risk_score', v_user_risk, 'expected_price', NEW.expected_price)
    );
    return NEW;
  end if;

  -- Fetch recent market average & std dev for this category and upazila
  select avg_price, std_dev, sample_count 
  into v_avg_price, v_std_dev, v_samples
  from public.market_price_aggregates
  where category_id = NEW.category_id 
    and upazila_id = NEW.upazila_id
  order by period_date desc 
  limit 1;

  -- If sufficient market samples exist (>= 3 listings), calculate price band limits
  if v_avg_price is not null and v_samples >= 3 then
    -- Allow max +100% price increase or -50% price drop from average benchmark
    v_upper_limit := greatest(v_avg_price * 2.0, v_avg_price + (2.5 * coalesce(v_std_dev, 0)));
    v_lower_limit := v_avg_price * 0.5;

    if NEW.expected_price > v_upper_limit or NEW.expected_price < v_lower_limit then
      -- Auto-hold in flagged_review status
      NEW.status := 'flagged_review';

      -- Create fraud alert
      insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
      values (
        NEW.created_by_user_id, 
        NEW.id, 
        'price_outlier', 
        'medium', 
        'Listing price (' || NEW.expected_price || ') deviates significantly from market benchmark (' || v_avg_price || ')',
        jsonb_build_object(
          'expected_price', NEW.expected_price, 
          'market_avg', v_avg_price, 
          'upper_limit', v_upper_limit, 
          'lower_limit', v_lower_limit,
          'samples', v_samples
        )
      );

      -- Increment user risk score slightly for price outlier attempts
      update public.profiles 
      set risk_score = risk_score + 5 
      where id = NEW.created_by_user_id;
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_check_price_band_and_verification on public.listings;
create trigger trg_check_price_band_and_verification
  before insert or update of expected_price, status
  on public.listings
  for each row
  execute function public.fn_check_price_band_and_verification();

create or replace function public.reveal_seller_phone_number(
  p_listing_id uuid,
  p_viewer_ip inet
)
returns table(phone text, seller_name text, is_verified boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viewer_id uuid;
  v_seller_id uuid;
  v_seller_phone text;
  v_seller_name text;
  v_seller_verified boolean;
  v_user_type text;
  v_daily_user_reveals integer;
  v_hourly_ip_reveals integer;
  v_max_daily integer := 10;
  v_max_hourly_ip integer := 5;
begin
  v_viewer_id := auth.uid();
  
  if v_viewer_id is null then
    raise exception 'Authentication required to reveal seller contact details.';
  end if;

  -- Get viewer user role to adjust rate limits
  select user_type into v_user_type from public.profiles where id = v_viewer_id;
  if v_user_type in ('dealer', 'arathdar', 'aggregator') then
    v_max_daily := 25; -- Higher limit for commercial buyers
  end if;

  -- 1. Check user 24-hour rate limit
  select count(*) into v_daily_user_reveals 
  from public.phone_reveal_logs 
  where viewer_user_id = v_viewer_id 
    and created_at >= (now() - interval '24 hours');

  if v_daily_user_reveals >= v_max_daily then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (
      v_viewer_id, 
      p_listing_id, 
      'phone_scraping', 
      'high', 
      'User exceeded daily phone reveal quota (' || v_daily_user_reveals || '/' || v_max_daily || ')',
      jsonb_build_object('ip', p_viewer_ip, 'reveals_24h', v_daily_user_reveals)
    );
    raise exception 'Daily phone reveal quota exceeded. Please try again tomorrow.';
  end if;

  -- 2. Check IP 1-hour rate limit
  select count(*) into v_hourly_ip_reveals 
  from public.phone_reveal_logs 
  where viewer_ip = p_viewer_ip 
    and created_at >= (now() - interval '1 hour');

  if v_hourly_ip_reveals >= v_max_hourly_ip then
    insert into public.fraud_alerts (user_id, listing_id, alert_type, severity, description, metadata)
    values (
      v_viewer_id, 
      p_listing_id, 
      'phone_scraping', 
      'high', 
      'IP address exceeded hourly phone reveal quota (' || v_hourly_ip_reveals || '/' || v_max_hourly_ip || ')',
      jsonb_build_object('ip', p_viewer_ip, 'reveals_1h', v_hourly_ip_reveals)
    );
    raise exception 'Too many phone reveals from this connection. Please try again later.';
  end if;

  -- Get seller profile
  select l.seller_id, p.phone, p.full_name, p.is_verified
  into v_seller_id, v_seller_phone, v_seller_name, v_seller_verified
  from public.listings l
  join public.profiles p on p.id = l.seller_id
  where l.id = p_listing_id;

  if v_seller_phone is null then
    raise exception 'Listing or seller contact not found.';
  end if;

  -- Record audit log
  insert into public.phone_reveal_logs (listing_id, viewer_user_id, viewer_ip)
  values (p_listing_id, v_viewer_id, p_viewer_ip);

  -- Update phone reveal counters
  update public.listings 
  set phone_reveal_count = phone_reveal_count + 1 
  where id = p_listing_id;

  -- Log event in general ledger
  insert into public.listing_events (listing_id, event_type, user_id, metadata)
  values (p_listing_id, 'phone_revealed', v_viewer_id, jsonb_build_object('ip', p_viewer_ip));

  -- Return seller details securely
  return query select v_seller_phone, v_seller_name, v_seller_verified;
end;
$$;
