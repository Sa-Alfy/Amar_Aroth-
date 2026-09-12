# Amar Aroth (আমার আড়ত) - Agricultural Supply Index & Economy Security Platform

[![Build & Deploy](https://github.com/Sa-Alfy/Amar_Aroth-/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sa-Alfy/Amar_Aroth-/actions/workflows/deploy.yml)

**Amar Aroth** is a digital **Agricultural Supply Index & Discovery Infrastructure** designed specifically for Bangladesh. It creates real-time, transparent visibility between rural producers (farmers, aggregators, cooperatives) and wholesale buyers (dealers/*Aratdars*).

Instead of acting as a traditional transactional e-commerce store with checkout bloat, Amar Aroth serves as a **secure, indexed inventory discovery engine**—enabling dealers to locate crops by division, district, upazila, quantity, and price, and connect directly via rate-limited mobile phone reveals.

---

## 🌟 Key Features

* 🌾 **Instant Supply Creator:** Farmers post crop yield details with photos in under 2 minutes with automatic district/upazila geographic tagging.
* 🔎 **Multi-Parametric Search Index:** Filter live crop inventory by Category (Potato 🥔, Egg 🥚, Fish 🐟, Rice 🌾, Vegetables 🥦, Livestock 🐄), Bangladesh Location Hierarchy (Division $\rightarrow$ District $\rightarrow$ Upazila), and Price/Quantity ranges.
* 🛡️ **Database Security & Fraud Engine:** Automatic price band enforcement (+100% / -50% outlier detection), risk scoring, IP/device footprint audit trails, and automatic hold triggers for suspicious listings.
* 📞 **Rate-Limited Phone Reveal:** Server-enforced rate limits (10/day retail, 25/day commercial, 5/hour per IP) preventing phone scraping and agent harvesting.
* 📊 **Stock Lifecycle Manager:** Farmers toggle listing states between `Live (সচল)`, `Negotiating (আলোচনাধীন)`, `Reserved (সংরক্ষিত)`, and `Sold Out (বিক্রিত)` with live view counters.
* ⚖️ **Admin Moderation Dashboard:** Real-time alert feed for price anomalies, phone scraping attempts, and user KYC verification.

---

## 🏗️ Backend & Security Architecture

Amar Aroth uses a **Backend-First Architecture** where the browser **never directly accesses the database**:

```
Browser Frontend → fetch('/api/...') → Next.js Server API Route → PostgreSQL (Supabase)
```

1. **Server-Side API Layer (`app/api/`)**: All authentication, listings, locations, categories, units, and moderation actions are processed through server API routes with session cookie verification.
2. **Client Fetch Abstraction (`lib/client/api.ts`)**: Single unified interface for all frontend data calls, eliminating browser-side database SDK exposure.
3. **Database Security (PL/pgSQL & RLS)**: Business logic, rate limits, and fraud control live in PostgreSQL triggers (`trg_check_price_band_and_verification`) and `SECURITY DEFINER` stored procedures (`reveal_seller_phone_number`).

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 16 (App Router, TypeScript)
* **Backend:** Next.js Server API Routes + Node.js
* **Database:** PostgreSQL via Supabase (Row Level Security, Custom Triggers, Stored Procedures)
* **Styling:** Tailwind CSS + Custom Bangladeshi Agricultural Palette
* **Icons:** Lucide React
* **Repository:** [https://github.com/Sa-Alfy/Amar_Aroth-.git](https://github.com/Sa-Alfy/Amar_Aroth-.git)

---

## 🌿 Branching Strategy

The repository follows a clean, 2-branch model:

* **`main`**: Production-ready code and release deployments.
* **`dev`**: Active development and integration testing.

---

## 🔑 Environment Variables

Three are required. The app **fails loudly** when any is missing — there is no placeholder
fallback, because a misconfigured deploy that quietly serves fixture data is worse than one
that refuses to start.

| Variable | Where it is used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | e.g. `https://<project-ref>.supabase.co`, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | user-scoped requests; RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | bypasses RLS — never prefix it `NEXT_PUBLIC_` |

Copy `.env.example` to `.env.local` and fill it in. `.env*.local` is gitignored.

---

## 🚀 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/Sa-Alfy/Amar_Aroth-.git
cd Amar_Aroth-

# Install dependencies
npm install

# Configure environment (see the table above)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup

Apply the migrations in `supabase/migrations/` **in numeric order** through the Supabase SQL
editor. They are never edited once applied; a change means a new numbered file.

| File | What it does |
|---|---|
| `0001_schema.sql` | the whole schema: tables, RLS, grants, triggers, `SECURITY DEFINER` helpers |
| `0002_lock_append_only_ledgers.sql` | author checks on `user_device_logs` and `listing_events` |
| `0003_profile_nid_documents.sql` | `profiles.nid_front_url` / `nid_back_url` |

Then `supabase/seed.sql` for reference data (categories, units, the 64-district location tree).

**Storage:** create a **private** bucket named `kyc-documents` (5 MB limit, `image/jpeg`,
`image/png`, `image/webp`). Signup uploads the NID photos there and stores only the object
path on the profile. The `listing-images` bucket is public by design; this one must not be.

**Auth settings:** Authentication → Providers → Email must be **enabled**, and *Confirm email*
**off**. Login addresses are synthetic (`{phone}@amararoth.com`) and can never receive a
confirmation link, so accounts are created server-side with `email_confirm: true`.

### Invariant tests

Not migrations — repeatable proofs. Run both after any change to RLS, `trade_permissions`,
`profiles.user_type`, or the listing visibility trigger:

```
supabase/tests/tier_invariants.sql      -- expect: dokandar sees 0 farmer supply listings
supabase/tests/contact_invariants.sql   -- expect: tier_blocked, plus the control returning ok
```

A schema change without a passing invariant run is not finished.

---

## 🔐 The Tier Rule

Who may see and contact whom is **data, not code** — it lives in the `trade_permissions`
table, and navigation feeds are derived from it on the server. There is deliberately no
`dokandar → farmer` row: a shopkeeper must not reach a farmer directly. That absence is the
product's core constraint, enforced twice — by RLS for visibility, and by
`reveal_seller_phone_number` for contact, which logs a `tier_violation` when it blocks one.

Never hardcode a role name in a policy or a component. Add a row instead.

---

## 📦 Build Verification

```bash
npm run verify     # tsc --noEmit && eslint && next build
```

---

## ⚠️ Known Gaps

* **Password reset is not implemented.** The UI says so plainly rather than faking success.
  A real one needs an SMS provider for the OTP plus a server route calling
  `auth.admin.updateUserById`.
* **NID verification is a stub.** The signup step shows a checkmark; nothing is verified.
* **KYC has no review screen yet.** `is_verified` no longer gates posting — it is a trust
  badge, and phone reveal still enforces it — but an admin must flip it by hand.
* **No rate limiting on `/api/auth/login`**, and signup distinguishes "already registered"
  from other failures, which makes it a phone-number oracle. Address both before launch.

---

## 📄 License & Copyright

**All Rights Reserved © 2026 Amar Aroth.**  
Repository: [https://github.com/Sa-Alfy/Amar_Aroth-.git](https://github.com/Sa-Alfy/Amar_Aroth-.git)
