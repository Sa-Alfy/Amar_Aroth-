---
name: supabase-migrations
description: "Use when changing the Amar Aroth database — adding or altering a table, column, constraint, index, trigger, function, view, or seed row; writing anything under supabase/; or when a task requires knowing the real shape of a table. Triggers on: migration, schema, ALTER TABLE, CREATE TABLE, new column, trigger, seed, supabase/migrations."
---

# Database changes — Amar Aroth

## Truth source

`supabase/migrations/*.sql` is the only description of the database. **Never guess a column,
table, policy, trigger, or RPC signature.** Read the migration file first. If a column you
need does not exist there, it does not exist — say so and propose a migration instead of
writing code against it.

Current state: one consolidated migration, `0001_schema.sql` (990 lines), plus `reset.sql`,
`seed.sql`, `seed/dokandar_test_account.sql`, and two test files under `tests/`.

Note: `docs/NEXT_PHASE_C3.md` and some code comments reference migrations `0008`–`0010`.
Those files are not in the repo. If a task depends on which version the live database
actually reflects, verify through the Supabase MCP server before proceeding — do not assume.

## Rules

1. **Never edit or delete an existing file in `supabase/migrations/`.** They are applied.
   New changes go in a new file: `supabase/migrations/00NN_short_name.sql`, where `NN` is the
   next unused number.
2. **Never run destructive commands.** No `supabase db reset`, no `db push`, no running
   `reset.sql` or `seed.sql`. Write the migration; the human applies it.
3. Lowercase, unquoted identifiers. Snake_case. Match the existing style in `0001_schema.sql`.
4. Every new function is `security definer` with `set search_path = ''` and fully qualified
   names (`public.profiles`, not `profiles`). The existing helpers show why: a policy on
   `profiles` cannot query `profiles` directly without recursing.
5. Every new table needs three things or it is invisible to the app — see the
   `rls-policy-change` skill. RLS with zero policies is deny-all.
6. `create index concurrently` for indexes on tables that already hold data, and say so in a
   comment, since it cannot run inside a transaction.

## Server-owned columns — do not let a client write these

| Table | Columns | Enforced by |
|---|---|---|
| `profiles` | `user_type`, `is_verified`, `phone_verified`, `nid_verified`, `kyc_status`, `risk_score` | `fn_protect_privileged_profile_fields` (BEFORE UPDATE) |
| `listings` | `poster_user_type`, `is_public`, `listing_kind` on UPDATE | `fn_set_listing_poster_and_visibility` |

The bypass for trigger-driven writes and admin scripts is `set local app.system_write = 'on';`.
Use it in seeds and one-off fixes, never in a route handler.

## Trigger ordering

BEFORE triggers on one table fire in **alphabetical order by trigger name**.
`trg_a_set_listing_poster_and_visibility` is named to sort first so the tier is resolved
before the price-band logic reads it. Renaming a trigger changes behaviour. If you add a
BEFORE trigger to `listings`, name it so it sorts after `trg_a_`.

## Authorization is data, not code

Who may trade with whom lives in the `trade_permissions` table. Adding a relationship is an
INSERT, not a branch in a policy or a route handler. Never hardcode a role name in a new
policy — join `trade_permissions` the way the existing listing policies do.

There is deliberately no `dokandar -> farmer` row. That absence is the product's core
constraint. Do not add one. There is deliberately no `admin` row either.

## After the change

If the migration touches RLS, `trade_permissions`, `user_type`, or the visibility trigger,
tell the user to re-run both invariant tests and report the results:

```
supabase/tests/tier_invariants.sql      -- expect: dokandar sees 0 farmer listings
supabase/tests/contact_invariants.sql   -- expect: tier_blocked, plus the control returning ok
```

A schema change without a passing invariant run is not finished.
