---
name: api-contract
description: "Use when writing or changing anything that crosses the client/server boundary in Amar Aroth — a route handler under app/api/, a fetch helper in lib/client/api.ts, a page or component that loads data, or any code touching a Supabase client, session, cookie, or auth. Triggers on: route handler, /api/, createClient, supabase client, session, cookies, auth, fetch, service role."
---

# Client/server boundary — Amar Aroth

## The one path

```
component / page
  → lib/client/api.ts          (the only file that calls fetch)
    → app/api/*/route.ts       (the only place a Supabase client exists)
      → Supabase
```

**Never import a Supabase client into a page or component.** The browser must never hold a
Supabase client, a token, or a table name. If a page needs data, add a function to
`lib/client/api.ts` and a route handler behind it.

If a fix appears to require breaking this, stop and report it rather than breaking it.

## Which client

There are two, and picking the wrong one is how registration broke.

| Client | File | Runs as | Use for |
|---|---|---|---|
| SSR / anon | `lib/supabase/server.ts` → `createClient()` | the signed-in user, via cookie | every user-scoped read and write; RLS applies |
| Service role | `lib/supabase/admin.ts` → `createAdminClient()` | superuser, **bypasses RLS** | account creation, admin repair, writes to server-owned ledgers |

Rules:

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be prefixed `NEXT_PUBLIC_`, never
  be imported into a component, and never be returned in a response.
- Reach for the admin client only when RLS legitimately blocks a server-vouched write, and
  say in a comment why. Default to the anon client.
- **The anon client has no session until one exists.** `supabase.auth.signUp()` returns
  `session: null` when email confirmation is on, so any write that follows it runs as `anon`
  and RLS rejects it. Create accounts with `admin.auth.admin.createUser({ email_confirm: true })`.

## Identity comes from the session

Read the user with `supabase.auth.getUser()` inside the route handler. **Never** trust an id
from the request body. `CreateListingPayload` in `lib/client/api.ts` deliberately has no
`sellerId`, and `app/api/listings/route.ts` deliberately ignores one if sent — re-adding it
reopens impersonation.

Server-owned fields are never accepted from a body: `listing_kind`, `poster_user_type`,
`is_public`, and every trust field on `profiles`.

## Multi-step writes must compensate

A route that creates an auth user and then a profile row is two writes with no transaction
between them. If the second fails, **undo the first** (`admin.auth.admin.deleteUser`).
Otherwise the account is permanently stuck: signup returns 409 "already exists" and login
returns 404 "profile not found" for the same phone number. That exact bug is why registration
was down.

## Auth identifiers

Auth email is synthetic: `${normalizePhone(phone)}@amararoth.com`. Always route the phone
through `normalizePhone` before building it, on both signup and login, or the two will
disagree and login will fail for an account that exists.

Password/PIN minimum is **6** characters. Keep signup, login, and reset in agreement; a
mismatch locks users out of accounts they just changed.

## Responses

- Shape: `{ success: true, ... }` or `{ success: false, error: '<Bangla string>' }`.
  See the `bangla-copy` skill — never return a raw Supabase error message to a user.
- Status codes already in use: 400 validation, 401 bad credentials, 403 not permitted,
  404 missing, 409 already exists, 429 rate limited, 500 server fault.
- Log the real error server-side with a `[route/name]` prefix and return the Bangla one.

## Session lifetime

`middleware.ts` at the repo root is what refreshes the access token; it must call
`supabase.auth.getUser()`. Without it tokens expire after about an hour and users are
silently logged out. The `catch {}` in `lib/supabase/server.ts` assumes middleware exists —
if it does not, create it rather than removing the catch.

After a successful login or logout on the client, call `router.refresh()` before
`router.push()` so Server Components do not serve a stale, logged-out render.

## Never fake a backend

Do not write functions that simulate success with `setTimeout`, `sessionStorage`, or a
hardcoded value. `requestPasswordResetOtp` does this today — it stores `'1234'` and returns
success without changing any password. If a real implementation is out of scope, say so and
leave the UI disabled rather than shipping something that lies to the user.

Similarly, do not silently fall back to `lib/mockData.ts` when env vars are missing. A
misconfigured deploy should fail loudly, not serve fake listings.
