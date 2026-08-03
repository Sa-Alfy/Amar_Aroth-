# Amar Aroth (আমার আড়ত) - Agricultural Supply Index Bangladesh

[![Build & Deploy to GitHub Pages](https://github.com/Sa-Alfy/Amar_Aroth-/actions/workflows/deploy.yml/badge.svg)](https://github.com/Sa-Alfy/Amar_Aroth-/actions/workflows/deploy.yml)

**Amar Aroth** is a digital **Agricultural Supply Index & Discovery Infrastructure** designed specifically for Bangladesh. It creates real-time, transparent visibility between rural producers (farmers, aggregators, cooperatives) and wholesale buyers (dealers/*Aratdars*).

Instead of acting as a traditional transactional e-commerce store with checkout bloat, Amar Aroth serves as an **indexed inventory discovery engine**—enabling dealers to locate crops by district, upazila, quantity, and price, and connect directly via mobile phone call.

---

## 🌟 Key Features

* 🚀 **Instant-Publish Supply Creator:** Farmers post crop yield details with photos in under 2 minutes. Listings go **Live immediately** without waiting for approval queues.
* 🔎 **Multi-Parametric Search Index:** Filter live crop inventory by Category (Potato 🥔, Egg 🥚, Fish 🐟, Rice 🌾, Vegetables 🥦, Livestock 🐄), Bangladesh Division $\rightarrow$ District $\rightarrow$ Upazila hierarchy, and Price/Quantity ranges.
* 📞 **Direct Voice Lead Reveal:** Tap-to-Call modal reveals verified seller phone numbers for direct offline negotiation, payment, and transport settlement.
* 📊 **Stock Lifecycle Manager:** Farmers toggle listing states between `Live (সচল)`, `Negotiating (আলোচনাধীন)`, `Reserved (সংরক্ষিত)`, and `Sold Out (বিক্রিত)` with live view and phone reveal counters.
* 🛡️ **Reactive Moderation Queue:** Post-publishing user flagging queue enabling admins to hide inaccurate or sold-out listings with 1 click.

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 14+ (App Router, TypeScript)
* **Styling:** TailwindCSS + Custom Bangladeshi Brand Palette
* **Icons:** Lucide React
* **Deployment:** GitHub Pages (Static Export) & Vercel
* **Repository:** [https://github.com/Sa-Alfy/Amar_Aroth-.git](https://github.com/Sa-Alfy/Amar_Aroth-.git)

---

## 🌿 Branching Strategy

1. **`main`**: Production deployment branch hosted automatically on GitHub Pages.
2. **`development`**: Active feature development & integration branch.
3. **`dev`**: Secondary development and testing deployment branch.

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

## 📦 Static Export Build

To generate the static bundle for deployment:

```bash
npm run build
```

The output will be placed in the `/out` directory ready for GitHub Pages hosting.

---

## 📄 License & Copyright

**All Rights Reserved © 2026 Amar Aroth.**  
Repository: [https://github.com/Sa-Alfy/Amar_Aroth-.git](https://github.com/Sa-Alfy/Amar_Aroth-.git)
