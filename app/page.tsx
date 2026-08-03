'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, INITIAL_LISTINGS, BANGLADESH_LOCATIONS, SupplyListing } from '@/lib/mockData';
import ListingCard from '@/components/ListingCard';
import ContactModal from '@/components/ContactModal';
import { Search, MapPin, Filter, ArrowRight, ShieldCheck, PhoneCall, TrendingUp, Sparkles, Zap, Globe, Users, BarChart3, CheckCircle2, Handshake, DollarSign, Compass } from 'lucide-react';

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

            {/* DUAL CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/post-supply"
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-2xl text-base shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl">🧑‍🌾</span>
                <span>Post Produce</span>
              </Link>
              <Link
                href="/browse"
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white font-bold py-4 px-8 rounded-2xl text-base backdrop-blur transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl">🏪</span>
                <span>Browse Supply</span>
              </Link>
            </div>

            {/* TRUST INDICATORS */}
            <div className="pt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Farmers</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Dealers</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <PhoneCall className="w-4 h-4" />
                <span>Direct Contact</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <MapPin className="w-4 h-4" />
                <span>Location-Based Search</span>
              </div>
            </div>

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

          </div>
        </div>
      </section>

      {/* MARKETPLACE ACTIVITY STATS BANNER */}
      <section className="bg-slate-900 border-y border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">12,500+</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Active Listings</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-5 h-5 text-brand-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">64</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Districts Covered</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">1,200+</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Farmers & Producers</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Handshake className="w-5 h-5 text-amber-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">300+</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Dealers & Wholesalers</p>
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

      {/* WHY AAROTH SECTION */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl font-black text-slate-900">
              Why Aaroth?
            </h2>
            <p className="text-slate-600 text-sm">
              The fastest way to discover, connect, and source agricultural produce across Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Find Supply Faster</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Search by crop, district, quantity, and price. No more phone calls to 10 middlemen.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Connect Directly</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Call verified farmers and producers directly. No middlemen, no commissions.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reduce Sourcing Costs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transparent pricing eliminates guesswork. Compare rates across districts instantly.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Discover Opportunities</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Explore agricultural supply from 64 districts. Find new sources you never knew existed.
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
