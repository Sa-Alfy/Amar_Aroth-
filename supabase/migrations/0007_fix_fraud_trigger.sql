-- Migration: 0007_fix_fraud_trigger.sql
-- Description: Split the fraud trigger into a pre-check and a post-write step so the listing row exists before fraud_alerts is inserted, and do not re-run on admin status approvals.

-- Drop the old trigger and any legacy function names before recreating the logic.
drop trigger if exists trg_check_price_band_and_verification on public.listings;
drop function if exists public.fn_check_price_band_and_verification_before();
drop function if exists public.fn_check_price_band_and_verification_after();

create or replace function public.fn_check_price_band_and_verification_before()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_risk integer;
  v_avg_price numeric(12, 2);
  v_std_dev numeric(12, 2);
  v_samples integer;
  v_upper_limit numeric(12, 2);
  v_lower_limit numeric(12, 2);
begin
  select risk_score
  into v_user_risk
  from public.profiles
  where id = NEW.created_by_user_id;

  if v_user_risk > 70 then
    NEW.status := 'flagged_review';
    return NEW;
  end if;

  select avg_price, std_dev, sample_count
  into v_avg_price, v_std_dev, v_samples
  from public.market_price_aggregates
  where category_id = NEW.category_id
    and upazila_id = NEW.upazila_id
  order by period_date desc
  limit 1;

  if v_avg_price is not null and v_samples >= 3 then
    v_upper_limit := greatest(v_avg_price * 2.0, v_avg_price + (2.5 * coalesce(v_std_dev, 0)));
    v_lower_limit := v_avg_price * 0.5;

    if NEW.expected_price > v_upper_limit or NEW.expected_price < v_lower_limit then
      NEW.status := 'flagged_review';
    end if;
  end if;

  return NEW;
end;
$$;

create or replace function public.fn_check_price_band_and_verification_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avg_price numeric(12, 2);
  v_std_dev numeric(12, 2);
  v_samples integer;
  v_user_risk integer;
  v_upper_limit numeric(12, 2);
  v_lower_limit numeric(12, 2);
begin
  select risk_score
  into v_user_risk
  from public.profiles
  where id = NEW.created_by_user_id;

  if v_user_risk > 70 then
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

  select avg_price, std_dev, sample_count
  into v_avg_price, v_std_dev, v_samples
  from public.market_price_aggregates
  where category_id = NEW.category_id
    and upazila_id = NEW.upazila_id
  order by period_date desc
  limit 1;

  if v_avg_price is not null and v_samples >= 3 then
    v_upper_limit := greatest(v_avg_price * 2.0, v_avg_price + (2.5 * coalesce(v_std_dev, 0)));
    v_lower_limit := v_avg_price * 0.5;

    if NEW.expected_price > v_upper_limit or NEW.expected_price < v_lower_limit then
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

      update public.profiles
      set risk_score = risk_score + 5
      where id = NEW.created_by_user_id;
    end if;
  end if;

  return NEW;
end;
$$;

create trigger trg_check_price_band_and_verification_before
  before insert or update of expected_price
  on public.listings
  for each row
  execute function public.fn_check_price_band_and_verification_before();

create trigger trg_check_price_band_and_verification_after
  after insert or update of expected_price
  on public.listings
  for each row
  execute function public.fn_check_price_band_and_verification_after();
