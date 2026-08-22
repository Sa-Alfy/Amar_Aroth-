# Amar Aroth — database

Plain PostgreSQL 15+. Runs on Supabase today; designed so that leaving is a
data-layer swap rather than a rewrite.

## Files

| File | What it is |
|---|---|
| `migrations/0001_schema.sql` | The whole schema. Tables, RLS, functions, triggers, grants. |
| `seed.sql` | Reference data (8 categories, 8 divisions, 64 districts, upazilas, units) plus demo profiles and listings. |
| `reset.sql` | Destructive. Drops everything so you can rebuild. |
| `tests/tier_invariants.sql` | Proves a dokandar cannot **see** a farmer. |
| `tests/contact_invariants.sql` | Proves a dokandar cannot **contact** a farmer, and that the block is logged. |
| `seed/dokandar_test_account.sql` | Creates a Supabase auth account **plus** profile, so you can actually log in as a dokandar. |

## Rebuilding from scratch

Run in the SQL editor, in this order:

1. `reset.sql`
2. `migrations/0001_schema.sql`
3. `seed.sql`
4. `tests/tier_invariants.sql` — expect `dokandar` → `sees_farmer 0`
5. `tests/contact_invariants.sql` — expect `tier_blocked` plus a working control

Steps 4 and 5 are not optional. They are how you know the rebuild is correct.

## The portability contract

The only vendor-aware code is `public.current_user_id()` in section 2 of the
schema. It resolves identity in this order:

1. `app.user_id` — a setting your own backend writes per transaction:
   `SET LOCAL app.user_id = '<uuid>';`
2. `request.jwt.claims` — what PostgREST sets from the JWT. This is what
   Supabase's `auth.uid()` reads internally; the schema reads it directly so it
   never references the `auth` schema.

Everything else — RLS, the tier rule, the triggers, the reveal RPC — is
standard Postgres and moves unchanged.

**`profiles.id` is not a foreign key to `auth.users`.** The auth provider owns
credentials; `profiles` owns the application user. That decoupling is what makes
this portable, and it is why a test account can now be seeded in pure SQL. The
cost: nothing at the database level stops a profile from outliving its auth
record. Signup creates both; an account-deletion path must delete both.

### What leaving Supabase would still require

| Piece | Work |
|---|---|
| Schema and security model | None. It comes with you. |
| Identity | Rewrite `current_user_id()`, or just set `app.user_id` per request. |
| Auth (GoTrue) | Real work: password hashing, sessions, refresh, SMS OTP, rate limiting. |
| PostgREST | ~40 `.from()` calls across ~15 route handlers become SQL. |
| Storage | NID images move to S3/R2 with signed URLs. |

## Rules that are not style preferences

- **`trade_permissions` is the tier rule.** Adding a trade relationship is an
  INSERT. Never encode a role-to-role rule in TypeScript or in a policy body.
- **There is deliberately no `dokandar → farmer` row.** That absence is the
  product's core constraint.
- **There is deliberately no `admin` row either.** Moderation must not be a back
  door to every phone number in the country. If moderation needs a phone, give
  it its own audited path.
- **`profiles_public` must never be granted a write privilege.** It runs without
  `security_invoker` on purpose — its `WHERE` clause is the authorization
  boundary — and a single-table projection like it is auto-updatable, so any
  write grant becomes a path into `profiles` with RLS bypassed. This was a real
  bug in the previous schema, not a hypothetical.
- **The reveal RPC returns a status and never raises.** `raise` rolls back the
  transaction, including the `fraud_alerts` row written moments earlier. A
  blocked attempt that logs nothing is worse than no check at all.
- **RLS with zero policies is deny-all.** Five reference tables sat in exactly
  that state in the previous schema, returning nothing to the app.

## Postgres behaviour worth knowing here

- `BEFORE` triggers on one table fire in **alphabetical order by trigger name**.
  `trg_a_set_listing_poster_and_visibility` is named to sort first so the tier
  is resolved before the price-band logic reads it.
- A view **without** `security_invoker` resolves *table* permissions as the view
  owner, but *function* `EXECUTE` privileges are still checked against the
  **calling** role. Helper functions used by `profiles_public` are therefore
  granted to `anon` as well as `authenticated`.
- Supabase's default privileges grant `anon` **all** privileges on new tables and
  views. Section 1 revokes those defaults before anything is created.
- `trg_protect_privileged_profile_fields` silently reverts privileged columns for
  any writer that is not an admin. Scripts run in the SQL editor have no
  identity, so admin-style writes there need
  `perform set_config('app.system_write', 'on', true)` inside the same
  transaction.
- The Supabase SQL editor starts a new session per run: temp tables do not
  survive between runs, and only the **last** statement's grid is shown. Test
  scripts end in a single combined `select` for that reason.
- There is no `min(uuid)`. Use `distinct on`.
