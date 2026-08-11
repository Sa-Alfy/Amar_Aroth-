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

## 🚀 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/Sa-Alfy/Amar_Aroth-.git
cd Amar_Aroth-

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build Verification

To verify production compilation and TypeScript checks:

```bash
npm run build
```

---

## 📄 License & Copyright

**All Rights Reserved © 2026 Amar Aroth.**  
Repository: [https://github.com/Sa-Alfy/Amar_Aroth-.git](https://github.com/Sa-Alfy/Amar_Aroth-.git)
