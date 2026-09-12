---
name: rls-policy-change
description: "Use when adding or modifying row level security in Amar Aroth — any create policy / alter policy / drop policy, any new table that will hold data, any grant or revoke, or when debugging a query that returns zero rows, an empty array, or a permission-denied error from Supabase. Triggers on: RLS, policy, grant, permission denied, returns nothing, 401/403 from PostgREST, anon vs authenticated."
---

# RLS changes — Amar Aroth

## The three-part rule

A table is reachable only if **all three** of these exist. Two out of three fails silently,
which is the expensive part — a missing policy returns an empty array, not an error.

1. `alter table public.X enable row level security;`
2. A policy naming the correct role: `to anon`, `to authenticated`, or both.
3. An explicit `grant` in section 9 of the schema.

Section 1 of `0001_schema.sql` revokes Supabase's default grants
(`alter default privileges ... revoke all on tables from anon, authenticated`). So a new
table has **no** privileges until you grant them. This is deliberate: a missing grant throws
a clear `permission denied`, which is a better failure than a policy that silently matches
nothing.

Do not treat an RLS change as complete until you have written all three and said so.

## Before writing a policy, answer these

- **Which role?** `anon` is a logged-out visitor. `authenticated` is any signed-in user.
  A policy written `to authenticated` does nothing for a request with no access token.
  This distinction has already broken signup once — see `app/api/auth/signup/route.ts`.
- **`using` or `with check`?** `using` filters what the caller can see or touch.
  `with check` validates the row after the write. INSERT policies need `with check`.
  UPDATE policies usually need both.
- **Does it recurse?** A policy on `profiles` may not query `profiles` directly. Use the
  `security definer` helpers instead: `public.is_admin()`, `public.my_user_type()`,
  `public.current_user_id()`.

## Identity

Never write `auth.uid()`. This schema uses `public.current_user_id()`, which resolves in
order: the `app.user_id` setting, then `request.jwt.claims -> sub`, then null. It returns
null rather than raising, so a malformed claim reads as anonymous instead of leaking through
a policy. Keeping this adapter is what makes the schema portable off Supabase.

`current_user_id()` and the helpers are granted to `anon` as well as `authenticated`. They
must stay that way: a view calls them as the *calling* role even when the view itself
bypasses RLS on tables. That asymmetry is what previously broke anonymous reads.

## Append-only ledgers need an author check

`with check (true)` on an insert-only table lets anyone forge rows. `user_device_logs` and
`listing_events` are currently open to `anon` with `with check (true)`, and `user_device_logs`
feeds risk scoring — so a forged row can raise someone else's `risk_score`. When touching
these, prefer `with check (user_id = public.current_user_id())`, or write the rows with the
service-role client from the server and revoke the anon grant.

## Cross-user reads

Never add a permissive SELECT policy to `public.profiles` — it holds `phone` and
`nid_number`. Cross-user reads go through the `profiles_public` view, whose WHERE clause is
the authorization boundary. The view is intentionally **not** `security_invoker`, because
`profiles` is own-row-only by design.

Beware: a simple view like that one is auto-updatable, so writes could reach the base table.
Never grant INSERT or UPDATE on `profiles_public`.

## Verify, do not assert

After any RLS change, verify against the live database rather than reasoning about it. Use
the Supabase MCP server to run the query as the affected role, and run:

```
supabase/tests/tier_invariants.sql
supabase/tests/contact_invariants.sql
```

Report actual row counts. "The policy looks correct" is not verification.

## Debugging an empty result

Work down this list in order:

1. Is RLS enabled but with zero policies? → deny-all.
2. Is the grant missing? → `permission denied for table X`.
3. Is the policy `to authenticated` while the request is anonymous? → check whether the
   caller actually has a session, not whether it should have one.
4. Is `current_user_id()` returning null? → `select public.current_user_id();` in the same
   session.
5. Is a `trade_permissions` row missing? → that is data, not a bug, and may be intentional.
