# Next phase — C3: role-derived navigation and the আড়তদার mode switch

Written 2026-08-18, after the RLS audit landed (`5c592e3` on `main`).
This is a planning document. Nothing in it has been implemented.

---

## 1. Where the project actually stands

The database phase is finished. `0008`, `0009`, `0010` are applied and both
halves of the tier rule are proven against live RLS, not asserted:

| Check | Result |
|---|---|
| dokandar sees farmer supply | 0 listings |
| dokandar → farmer phone reveal | `tier_blocked`, violation logged |
| dokandar → arathdar phone reveal | `ok`, phone returned |
| Accounts by tier | 1 admin, 2 arathdar, 3 farmer, 1 dokandar |
| Public listings | 2 (the first the product has ever had) |

Re-run `supabase/tests/tier_invariants.sql` and
`supabase/tests/contact_invariants.sql` after any change to RLS,
`trade_permissions`, `user_type`, or the visibility trigger.

### The finding that defines this phase

**The server already computes the correct navigation. Nothing in the UI reads it.**

`app/api/listings/route.ts` derives a `feeds` array from `trade_permissions`
(`deriveFeeds`, line 39–83) and returns it on every listings response
(lines 265, 302). `lib/client/api.ts:176` types it and `fetchListings` passes
it through. The comment at `lib/client/api.ts:192` even states the intent:

> Navigation and the arathdar কিনছি/বেচছি switch are built from `feeds` —
> never from a role switch

A grep for `feeds` across `app/` and `components/` returns **zero consumers.**

Meanwhile `components/BottomNav.tsx` hardcodes four tabs — হোম, পণ্য খুঁজুন,
পোস্ট করুন, and an account/login slot — identical for a farmer, an arathdar and
a dokandar. The tier model exists in the database and in the API, and stops at
the component boundary.

C3 is closing that gap. It is not new logic; it is wiring.

```ts
// lib/mockData.ts:60
export interface ListingFeed {
  key: string;             // stable id, e.g. "supply:farmer"
  labelBn: string;         // "কৃষকের সরবরাহ"
  kind: 'supply' | 'demand';
  posterUserType: string;  // whose listings this feed contains
}
```

What each tier receives today, derived from `trade_permissions`:

| Viewer | Feeds returned |
|---|---|
| anonymous | public supply only |
| farmer | supply:farmer (peer reference, contact blocked) |
| arathdar | supply:farmer, supply:arathdar, demand:dokandar |
| dokandar | supply:arathdar |

The arathdar case is why the mode switch exists: they are the only tier with
both a buying and a selling direction, so কিনছি | বেচছি is a real state, not
decoration.

---

## 2. Scope of C3

**In scope**

1. Bottom navigation built from `feeds`, not a hardcoded array.
2. The কিনছি | বেচছি segmented control for arathdars, driven by `feeds[].kind`.
3. A decision about where `feeds` lives client-side (see §3 — do this first).
4. Empty states in Bangla for a tier whose feed legitimately has no listings.

**Out of scope — do not let it creep in**

- `/listings/[id]` as a server component, metadata, JSON-LD (that is C4).
- The rate board component itself (design work, separate).
- Any RLS, policy, or migration change. The database is settled.
- Anything touching `reveal_seller_phone_number`.

---

## 3. Do this one thing serially, before fanning out

`feeds` currently arrives bundled with listings from `fetchListings`. Both the
nav and the mode switch need it, and the nav renders on pages that do not fetch
listings at all.

**Decide where `feeds` lives before parallelising anything**, or two agents will
invent two different answers and you will merge a mess. Three viable options:

| Option | Cost | Note |
|---|---|---|
| Add `feeds` to `/api/auth/me` | one route + one type | nav already calls `fetchCurrentUser`; smallest diff |
| React context provider in `app/layout.tsx` | new provider, client boundary | one fetch, shared everywhere |
| Each consumer fetches independently | none | duplicate requests, drift risk |

Recommendation: **the first.** `BottomNav` already calls `fetchCurrentUser()`
in a `useEffect` (`components/BottomNav.tsx:14`), so the data arrives where it
is needed with no new plumbing, and `feeds` is genuinely a property of the
session rather than of a listings query.

Whoever does this touches `app/api/auth/me/route.ts`, `lib/client/api.ts`, and
the `UserProfile` type. That is the dependency for every task below.

---

## 4. Task breakdown

Each task is sized to stay under the `CLAUDE.md` limit of roughly four files.
`C3.0` blocks the rest. `C3.1`–`C3.4` can run in parallel afterwards.

### C3.0 — Serve `feeds` from the session endpoint *(blocking, do first)*
- Files: `app/api/auth/me/route.ts`, `lib/client/api.ts`, `lib/mockData.ts`
- Reuse `deriveFeeds` from `app/api/listings/route.ts` — extract it to
  `lib/feeds.ts` rather than duplicating the logic.
- Done when: `GET /api/auth/me` returns `feeds` matching the table in §1 for
  each of the four viewer states.

### C3.1 — Bottom navigation from `feeds`
- Files: `components/BottomNav.tsx`
- হোম, পোস্ট করুন and the account/login slot stay fixed. The browse slot becomes
  feed-driven.
- A dokandar must never see a farmer-supply tab. That is the visible surface of
  the core constraint.
- Done when: the four viewer states each render the correct tabs, and no tab
  points at a feed the viewer cannot load.

### C3.2 — কিনছি | বেচছি segmented control
- Files: `app/browse/page.tsx`, plus one new component
- Render only when `feeds` contains both a `supply` and a `demand` entry —
  i.e. never branch on `userType === 'arathdar'`. Deriving it from the data is
  what makes adding a tier an INSERT rather than a code change.
- Selection maps to the `kind` and `posterType` query params `/api/listings`
  already accepts.
- Done when: an arathdar can switch directions; a farmer and a dokandar never
  see the control.

### C3.3 — Bangla empty states
- Files: `app/browse/page.tsx`, `components/` as needed
- A farmer's peer feed and a dokandar's arathdar feed can both be legitimately
  empty. No English fallback strings, per `CLAUDE.md`.

### C3.4 — Seller name on the card *(independent, pairs well with C3)*
- Files: `app/api/listings/route.ts`, `components/ListingCard.tsx`
- The listings payload has `isSellerVerified` but **no `sellerName`**, so a card
  cannot show which arath is selling. `profiles_public` already exposes
  `full_name` and the join is already there.
- While in that file: `route.ts:268` catches a failed seller join, falls back to
  a query that fails identically, and still returns `success: true` with `200`.
  That violates invariant 4. It is why the `42501` bug stayed invisible for a
  day. Return a real status.

---

## 5. Follow-on work, not part of C3

- **C4** — `/listings/[id]` server component, `generateMetadata`, JSON-LD, OG.
- **C5** — block status transitions out of `flagged_review | suspended | rejected`;
  make `?mine=true` return the owner's hidden and flagged listings.
- **C6** — delete the lying flows: hardcoded `'1234'` password reset, fake NID
  verification via `setTimeout`.
- **Legacy tier strings** — `app/login/page.tsx:241` branches on dead types,
  `app/post-supply/page.tsx:222` still offers `স্থানীয় সংগ্রাহক` and a
  `cooperative` value that was never in the database constraint at all, and
  `lib/mockData.ts:51` carries all of them. `UserType` is shared across many
  pages; list every consumer before editing it.
- **Token cleanup owed** — delete the legacy `brand-*` and `harvest-*` colour
  tokens and the `.btn-primary`, `.card-hover-effect`, `.text-bn` rules from
  `app/globals.css`. They are dead-but-present on purpose: pre-redesign
  components still use them. Grep for the classes across `app/` and
  `components/` first; deletion is only safe once the last one is gone.
- **Unsplash fallback** — `components/ListingCard.tsx` still substitutes a stock
  photo in `src`/`onError`. The API no longer injects one. Both public listings
  currently show the same image, which is exactly what the rate board replaces.
- **Admin cannot reveal any phone** — `admin` has no `trade_permissions` rows, so
  `reveal_seller_phone_number` returns `tier_blocked` and logs the admin doing
  moderation as a violator. Arguably correct, but it falls out of a missing row
  rather than a decision. If moderation needs a phone, give it its own audited
  path — do **not** add an `admin` row to `trade_permissions`, which would
  silently grant admins the entire graph.
- **Invalid `posterType` is ignored, not rejected** — `?posterType=banana`
  returns the full feed. Same quiet-success pattern as above; should be a `400`.
- **Restore `react-hooks/set-state-in-effect` to `error`** in
  `eslint.config.mjs` once `page.tsx`, `browse` and `admin` become server
  components in C4.

---

## 6. Handing a task to another agent

A fresh agent has none of this session's context. Give it three things: the
standing rules, one task brief, and the verification bar.

### 6.1 Rules every agent must be given

Paste this above any task prompt. `CLAUDE.md` is in the repo, but an agent will
not necessarily read it before editing.

```
Read CLAUDE.md first and follow it exactly. In particular:
- The database is the security boundary. Do not weaken any tier or RLS rule.
  A dokandar must never see or contact a farmer. If a change could weaken that,
  stop and ask.
- Never hardcode role-to-role rules in TypeScript. Tier relationships come from
  the trade_permissions table via the feeds array.
- Identity never comes from the request body.
- Never mask an error with mock data or a success response. Return a real status.
- All user-facing strings are Bangla. No English fallbacks, including errors.
- Numbers, currency and dates go through lib/format.ts.
- Do not create or edit any migration. 0001-0010 are applied and settled.
- Do not commit or push.
- Run `npm run verify` before reporting. A green tsc alone is not enough —
  it has hidden real build failures in this repo more than once.
- Report: files changed, what changed, what you deliberately did NOT do, and
  any manual steps for me.
```

### 6.2 Which agent type for which job

| Job | Agent | Why |
|---|---|---|
| "Where is X handled? What consumes Y?" | `Explore` | Read-only sweep, returns the conclusion not the file dump |
| "Design the approach for C3.0" | `Plan` | Returns a step plan and flags trade-offs before code is written |
| Implementing one C3.x task | `general-purpose` | Can read, edit, and run `npm run verify` |
| Reviewing the result | `/code-review` | Runs against the diff |

Run agents **in parallel only for C3.1 through C3.4, and only after C3.0 has
landed.** They all read the same `feeds` shape; if it is still in flux they will
each assume a different one.

### 6.3 A task brief that works standalone

Example for C3.1. The pattern matters more than the wording — state the file,
the data source, the constraint, and the done condition.

```
Task: build the bottom navigation from the session's `feeds` array instead of
the hardcoded tab list.

Context you need:
- components/BottomNav.tsx currently hardcodes four tabs, identical for every
  tier. It already calls fetchCurrentUser() in a useEffect.
- The server derives `feeds` from the trade_permissions table. Shape is
  ListingFeed in lib/mockData.ts:60 — { key, labelBn, kind, posterUserType }.
- C3.0 has added `feeds` to the /api/auth/me response. Read it from there.

Constraints:
- Do not branch on userType. Everything comes from feeds. Adding a tier must be
  an INSERT in the database, never a code change.
- A dokandar must never see a farmer-supply tab.
- Bangla labels only; labelBn already arrives from the server.

Done when:
- Each of anonymous / farmer / arathdar / dokandar renders the correct tabs.
- No tab links to a feed the viewer cannot load.
- `npm run verify` passes.
```

### 6.4 Verifying an agent's work

Do not accept "it builds" as proof.

1. `npm run verify` must pass — typecheck, lint, and a clean build.
2. Start the dev server and check the real payloads. A tier bug will not show up
   in a screenshot:
   ```
   curl -s "http://localhost:3000/api/auth/me"
   curl -s "http://localhost:3000/api/listings?limit=10"
   ```
3. Log in as the dokandar (`01829828155`) and confirm no farmer listing and no
   farmer tab appears anywhere.
4. If the agent touched anything database-adjacent, re-run both files in
   `supabase/tests/`.
5. Read the diff. Not the summary.

### 6.5 What no agent should touch without you

- Any file in `supabase/migrations/`. Applied and settled.
- `reveal_seller_phone_number` and the fraud-alert paths — invariant 5 means a
  `raise exception` there rolls back the very log row that was just written.
- `lib/mockData.ts` type changes, which ripple across many pages.
- The `brand-*` / `harvest-*` tokens in `app/globals.css`, which look dead and
  are not.
- Anything needing a service-role key. There is no service-role client in this
  project. If a task seems to need one, that is a signal to stop and rethink.

---

## 7. Traps already paid for

Worth handing to any agent that touches the database, because each of these
cost a round trip today.

- A view **without** `security_invoker` resolves *table* permissions as the view
  owner, but *function* EXECUTE privileges are still checked against the calling
  role. This is what broke `0008` for anon.
- Supabase's default privileges grant `anon` **all** privileges on new tables and
  views. RLS saves tables; it does not save views. A view that bypasses RLS and
  is auto-updatable is a write path.
- A single-table view with no aggregate or `DISTINCT` is auto-updatable, so
  `INSERT`/`UPDATE`/`DELETE` pass straight through to the base table.
- The Supabase SQL editor starts a new session per run: temp tables do not
  survive between runs, and only the **last** statement's grid is displayed. Test
  scripts must end in a single combined `select`.
- There is no `min(uuid)` in Postgres. Use `distinct on`.
- `BEFORE` triggers on the same table fire in alphabetical order by trigger name.
- `trg_protect_privileged_profile_fields` silently reverts privileged columns for
  any writer that is not an admin. The SQL editor has no `auth.uid()`, so admin
  writes there need the `app.system_write` bypass.
