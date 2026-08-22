-- supabase/tests/tier_invariants.sql
-- NOT a migration. A repeatable read-only proof of the tier rule.
-- Run it in the SQL editor after any change to RLS, trade_permissions,
-- profiles.user_type, or the listings visibility trigger.
--
-- It impersonates one real account per tier through app.user_id -- the same
-- setting the identity adapter reads first -- then counts what public.listings
-- actually returns under that identity. Nothing is written; the role and the
-- setting are transaction local and revert on their own.
--
-- THE ASSERTION THAT MATTERS: dokandar -> farmer supply must be 0.
-- Everything else is context for reading that number.

create temp table if not exists tier_check (
  viewer_type      text,
  sees_farmer      int,
  sees_arathdar    int,
  sees_dokandar    int,
  verdict          text
);
truncate tier_check;

do $$
declare
  v            record;
  n_farmer     int;
  n_arathdar   int;
  n_dokandar   int;
  v_verdict    text;
begin
  for v in
    -- one account per tier; prefer a verified one, since reveals gate on it.
    -- (distinct on, not min(id) -- there is no min() for uuid)
    select distinct on (user_type) user_type, id
    from public.profiles
    where user_type in ('farmer', 'arathdar', 'dokandar')
    order by user_type, is_verified desc, created_at
  loop
    -- become this user via the portable identity setting (section 2 of the
    -- schema); works on Supabase and on plain Postgres alike
    perform set_config('app.user_id', v.id::text, true);
    perform set_config('role', 'authenticated', true);

    select
      count(*) filter (where poster_user_type = 'farmer'),
      count(*) filter (where poster_user_type = 'arathdar'),
      count(*) filter (where poster_user_type = 'dokandar')
    into n_farmer, n_arathdar, n_dokandar
    from public.listings
    where listing_kind = 'supply';

    -- back to the session user before writing results
    perform set_config('role', 'none', true);

    v_verdict := case
      when v.user_type = 'dokandar' and n_farmer > 0
        then 'FAIL - dokandar can see ' || n_farmer || ' farmer listing(s)'
      when v.user_type = 'dokandar'
        then 'ok - farmer supply invisible'
      when v.user_type = 'arathdar' and n_farmer = 0
        then 'WARN - arathdar sees no farmer supply, check trade_permissions'
      when v.user_type = 'farmer' and n_farmer = 0
        then 'WARN - farmer peer reference returning nothing'
      else 'ok'
    end;

    insert into tier_check
    values (v.user_type, n_farmer, n_arathdar, n_dokandar, v_verdict);
  end loop;

  if not exists (select 1 from tier_check where viewer_type = 'dokandar') then
    insert into tier_check
    values ('dokandar', null, null, null,
            'NOT TESTED - no dokandar account exists yet');
  end if;
end $$;

-- Reading the result:
--   farmer   -> sees farmer supply (peer price reference, contact blocked)
--               and arathdar supply only because those rows are is_public
--   arathdar -> sees farmer supply (buys upstream) and arathdar supply (arbitrage)
--   dokandar -> MUST see arathdar supply and nothing from farmers
select * from tier_check order by viewer_type;
