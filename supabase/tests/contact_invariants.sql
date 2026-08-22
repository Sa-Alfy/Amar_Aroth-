-- supabase/tests/contact_invariants.sql
-- The other half of the tier rule: "must not see OR CONTACT".
-- tier_invariants.sql proves the see half through RLS. This proves the
-- contact half through reveal_seller_phone_number, which is SECURITY DEFINER
-- and therefore bypasses RLS entirely -- a dokandar who already knows a
-- farmer's listing id never has to see it in a feed to call this.
--
-- NOT read-only. A blocked attempt is supposed to write a 'tier_violation'
-- row to fraud_alerts, and a permitted one writes to phone_reveal_logs and
-- bumps phone_reveal_count. That is the behaviour under test, not a side
-- effect -- CLAUDE.md invariant 5 is that this logging survives instead of
-- being rolled back by a raised exception. Expect a few log rows afterwards.

create temp table if not exists contact_check (
  scenario       text,
  status         text,
  phone_returned text,
  verdict        text
);
truncate contact_check;

do $$
declare
  v_dokandar        uuid;
  v_farmer_listing  uuid;
  v_arath_listing   uuid;
  r                 record;
begin
  select id into v_dokandar
  from public.profiles
  where user_type = 'dokandar'
  order by is_verified desc, created_at
  limit 1;

  select id into v_farmer_listing
  from public.listings
  where poster_user_type = 'farmer' and listing_kind = 'supply'
  limit 1;

  select id into v_arath_listing
  from public.listings
  where poster_user_type = 'arathdar' and listing_kind = 'supply'
  limit 1;

  if v_dokandar is null or v_farmer_listing is null or v_arath_listing is null then
    insert into contact_check
    values ('setup', null, null, 'SKIPPED - need a dokandar plus one farmer and one arathdar supply listing');
    return;
  end if;

  perform set_config('app.user_id', v_dokandar::text, true);
  perform set_config('role', 'authenticated', true);

  -- THE ONE THAT MATTERS: a farmer's phone, requested directly by id.
  select * into r
  from public.reveal_seller_phone_number(v_farmer_listing, '203.0.113.9'::inet);
  perform set_config('role', 'none', true);

  insert into contact_check values (
    'dokandar -> farmer phone',
    r.status,
    coalesce(r.phone, '(null)'),
    case
      when r.phone is not null then 'FAIL - farmer phone was returned'
      when r.status <> 'tier_blocked' then 'FAIL - expected tier_blocked, got ' || coalesce(r.status, 'null')
      else 'ok - blocked and logged'
    end
  );

  -- Control: the permitted direction must still work, or the block above
  -- proves nothing (a function that always denies would also pass).
  perform set_config('role', 'authenticated', true);
  select * into r
  from public.reveal_seller_phone_number(v_arath_listing, '203.0.113.9'::inet);
  perform set_config('role', 'none', true);

  insert into contact_check values (
    'dokandar -> arathdar phone',
    r.status,
    coalesce(r.phone, '(null)'),
    case
      when r.status = 'ok' and r.phone is not null then 'ok - permitted path works'
      else 'FAIL - permitted contact did not return a phone (' || coalesce(r.status, 'null') || ')'
    end
  );
end $$;

-- One combined result: the SQL editor only shows the LAST statement's grid,
-- and the temp table does not survive to a second run.
-- Rows 1-2 are the test. Row 3 confirms the block reached moderation --
-- a silent denial is worse than a loud one, because nothing would ever
-- surface for review.
select 1 as ord, scenario, status, phone_returned, verdict
from contact_check
union all
select 2, 'logged: ' || description, alert_type, severity, created_at::text
from public.fraud_alerts
where alert_type = 'tier_violation'
  and created_at >= now() - interval '5 minutes'
order by ord, scenario;
