'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, INITIAL_LISTINGS, BANGLADESH_LOCATIONS, SupplyListing } from '@/lib/mockData';
import ListingCard from '@/components/ListingCard';
import ContactModal from '@/components/ContactModal';
import { Search, MapPin, Filter, ArrowRight, ShieldCheck, PhoneCall, TrendingUp, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactListing, setActiveContactListing] = useState<SupplyListing | null>(null);

  // Filter listings for the live directory stream
  const filteredListings = INITIAL_LISTINGS.filter((item) => {
    if (selectedCategory && item.categoryId !== selectedCategory) return false;
    if (selectedDistrict && item.districtId !== selectedDistrict) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchLoc = item.districtNameEn.toLowerCase().includes(q) || item.districtNameBn.includes(q);
      const matchCat = item.categoryNameEn.toLowerCase().includes(q) || item.categoryNameBn.includes(q);
      if (!matchTitle && !matchLoc && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 lg:py-24">
        {/* Background Decorative Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 opacity-95" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-brand-300 text-xs font-semibold px-3.5 py-1.5 rounded-full backdrop-blur">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Digital Agricultural Supply Index Bangladesh</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Find Agricultural Supply <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-amber-300">
                Across Bangladesh
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              বাংলাদেশ জুড়ে কৃষকের তাজা পণ্য সরবরাহ খুঁজুন। আলু, ডিম, মাছ, ধান ও গবাদিপশুর সরাসরি পাইকারি রিয়েল-টাইম তথ্য।
            </p>

            {/* HERO SEARCH BAR */}
            <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-2xl border border-slate-200 text-slate-900 mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                
                {/* Keyword Search */}
                <div className="sm:col-span-5 relative flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    placeholder="Search product (e.g. Potato, Egg, Fish)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 border border-slate-200"
                  />
                </div>

                {/* District Picker */}
                <div className="sm:col-span-4 relative flex items-center">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-3" />
                  <select
                    value={selectedDistrict || ''}
                    onChange={(e) => setSelectedDistrict(e.target.value ? Number(e.target.value) : null)}
                    className="w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 border border-slate-200 text-slate-700 appearance-none"
                  >
                    <option value="">All Districts (সকল জেলা)</option>
                    {BANGLADESH_LOCATIONS.flatMap((div) => div.districts).map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.nameBn} ({dist.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Action CTA */}
                <div className="sm:col-span-3">
                  <Link
                    href={`/browse?q=${encodeURIComponent(searchQuery)}${selectedDistrict ? `&district=${selectedDistrict}` : ''}`}
                    className="w-full h-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-md shadow-brand-600/30"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Index</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Verified Farmers & Aggregators</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-400" />
                <span>Direct Voice Call (No Middleman)</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span>Real-Time Wholesale Price Index</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURED COMMODITIES CATEGORY TILES */}
      <section className="py-12 bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Explore Agricultural Categories</h2>
              <p className="text-xs text-slate-500">Select a category to view live supply lots</p>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-brand-700 font-semibold hover:underline"
            >
              Reset Category Filter
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md scale-105'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-brand-500 hover:shadow-sm'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="text-xs font-bold leading-tight">
                    {cat.nameBn}
                  </div>
                  <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-500'}`}>
                    {cat.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIVE SUPPLY DIRECTORY STREAM */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900">Live Agricultural Supply Index</h2>
              <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200">
                {filteredListings.length} Lots Available
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Verified supply listings posted directly by farmers and production hubs
            </p>
          </div>

          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm hover:gap-2 transition-all"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onContactClick={(listing) => setActiveContactListing(listing)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Listings Found</h3>
            <p className="text-xs text-slate-500">
              No active supply matches your current category or district filters. Try clearing your filters or posting a supply listing.
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedDistrict(null);
                setSearchQuery('');
              }}
              className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* WHY AAROTH SUPPLY INDEX SECTION */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl font-black text-slate-900">
              Why Aaroth is Built as a Supply Index
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              We do not take commissions, lock payments in checkout, or force complex software on rural producers. Aaroth provides pure discovery and price transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Direct Dealer Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dealers discover available crop inventory directly from district farms (Bogra, Gazipur, Shatkhira) without navigating multi-layered local middlemen.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Instant Live Publishing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Farmers post crop yield details with photos in under 2 minutes. Listings go live instantly to ensure real-time trade speed.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Direct Voice Settlement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dealers tap to reveal verified phone numbers and negotiate transport, payment, and delivery offline via direct mobile call.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT MODAL REVEAL */}
      <ContactModal
        listing={activeContactListing}
        onClose={() => setActiveContactListing(null)}
      />
    </div>
  );
}
