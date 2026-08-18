-- Migration: 0010_tighten_user_type.sql
-- Description: Drops the legacy 'dealer' and 'aggregator' values from the
--   profiles.user_type check constraint.
--
-- Why this is safe now:
--   - 0008 migrated the only two 'aggregator' rows onto 'arathdar'.
--     No row carries a legacy type (verified 2026-08-18: admin 1, arathdar 2,
--     farmer 3).
--   - Signup cannot produce one. UserRole in lib/client/api.ts is exactly
--     'farmer' | 'arathdar' | 'dokandar', and app/api/auth/signup/route.ts
--     writes that value straight through to user_type.
--
-- Why it matters: neither legacy value appears in any trade_permissions row,
--   so an account holding one can neither see nor be seen by anybody, and its
--   listings can never go public. It is a silent dead end, not a tier. The
--   constraint should not be able to create one.
--
-- Postgres validates existing rows when adding the constraint, so if any row
-- still holds a legacy value this migration fails loudly rather than
-- half-applying. That is the intended guard.

alter table public.profiles drop constraint if exists profiles_user_type_check;

alter table public.profiles add constraint profiles_user_type_check
  check (user_type in ('farmer', 'arathdar', 'dokandar', 'admin'));

-- Verify: every tier present, and every non-admin tier backed by at least one
-- trade_permissions row. A tier with no permission rows is invisible in both
-- directions -- that is the failure mode this migration exists to prevent.
select
  p.user_type,
  count(*) as accounts,
  (select count(*) from public.trade_permissions tp
    where tp.buyer_type = p.user_type or tp.seller_type = p.user_type) as permission_rows
from public.profiles p
group by p.user_type
order by p.user_type;
