'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES, BANGLADESH_LOCATIONS, SupplyListing, Category } from '@/lib/mockData';
import { fetchListings, fetchCategories } from '@/lib/client/api';
import ListingCard from '@/components/ListingCard';
import ContactModal from '@/components/ContactModal';
import { Search, MapPin, Filter, ArrowRight, ShieldCheck, PhoneCall, TrendingUp, Sparkles, Zap, Globe, Users, BarChart3, CheckCircle2, Handshake, DollarSign, Compass } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactListing, setActiveContactListing] = useState<SupplyListing | null>(null);
  const [listings, setListings] = useState<SupplyListing[]>([]);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories dynamically from backend API
  useEffect(() => {
    fetchCategories().then((res) => {
      if (res && res.length > 0) setCategories(res);
    });
  }, []);

  // Fetch listings dynamically when filters change
  useEffect(() => {
    setIsLoading(true);
    fetchListings({
      categoryId: selectedCategory,
      districtId: selectedDistrict,
      searchQuery,
    })
      .then(setListings)
      .finally(() => setIsLoading(false));
  }, [selectedCategory, selectedDistrict, searchQuery]);

  const filteredListings = listings;

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
              <span>বাংলাদেশের ডিজিটাল কৃষি সরবরাহ প্ল্যাটফর্ম</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              সারা দেশের তাজা কৃষি পণ্য <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-amber-300">
                সরাসরি কৃষক থেকে সংগ্রহ করুন
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              আলু, ডিম, মাছ, ধান ও গবাদিপশুর তাজা পাইকারি সরবরাহ সরাসরি পান। কোনো মাধ্যম ছাড়া সরাসরি কৃষকের সাথে কথা বলুন।
            </p>

            {/* DUAL CTA BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/post-supply"
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-2xl text-base shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl">🧑‍🌾</span>
                <span>ফসল পোস্ট করুন</span>
              </Link>
              <Link
                href="/browse"
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border-2 border-white/30 hover:border-white/50 text-white font-bold py-4 px-8 rounded-2xl text-base backdrop-blur transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xl">🏪</span>
                <span>পণ্য দেখুন</span>
              </Link>
            </div>

            {/* TRUST INDICATORS */}
            <div className="pt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <CheckCircle2 className="w-4 h-4" />
                <span>যাচাইকৃত কৃষক</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <CheckCircle2 className="w-4 h-4" />
                <span>যাচাইকৃত পাইকার</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <PhoneCall className="w-4 h-4" />
                <span>সরাসরি যোগাযোগের সুযোগ</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full backdrop-blur">
                <MapPin className="w-4 h-4" />
                <span>জেলাভিত্তিক অনুসন্ধান</span>
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
                    placeholder="পণ্যের নাম লিখুন (যেমন: আলু, ডিম, মাছ)..."
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
                    <option value="">সকল জেলা</option>
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
                    <span>অনুসন্ধান করুন</span>
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
                <span className="text-2xl sm:text-3xl font-black text-white">১২,৫০০+</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">সচল পোস্ট</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-5 h-5 text-brand-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">৬৪</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">জেলায় সেবা</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">১,২০০+</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">নিবন্ধিত কৃষক</p>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Handshake className="w-5 h-5 text-amber-400" />
                <span className="text-2xl sm:text-3xl font-black text-white">৩০০+</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">ব্যবসায়ী ও পাইকার</p>
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
            {categories.map((cat) => {
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
              <h2 className="text-2xl font-black text-slate-900">লাইভ কৃষি সরবরাহ সূচক</h2>
              <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200">
                {filteredListings.length} টি পণ্য সচল
              </span>
            </div>
            <p className="text-xs text-slate-500">
              কৃষক ও উৎপাদন কেন্দ্র থেকে সরাসরি সংগৃহীত তাজা পণ্যের তালিকা
            </p>
          </div>

          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm hover:gap-2 transition-all"
          >
            <span>সব পণ্য দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
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
              কেন "আমার আড়ত"?
            </h2>
            <p className="text-slate-600 text-sm">
              সারা বাংলাদেশের তাজা কৃষি পণ্য দ্রুততম সময়ে খুঁজে নেওয়া ও কেনাবেচার সেরা মাধ্যম।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">দ্রুত পণ্য খুঁজুন</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                পণ্য, জেলা, পরিমাণ ও দাম দিয়ে মুহূর্তেই অনুসন্ধান করুন। মধ্যস্বত্বভোগীদের পেছনে সময় নষ্ট হবে না।
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">সরাসরি কৃষককে কল</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                যাচাইকৃত কৃষক ও উৎপাদনকারীদের সাথে সরাসরি ফোনে কথা বলুন। কোনো কমিশন বা মধ্যস্থতাকারী নেই।
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">স্বচ্ছ ও সঠিক দাম</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                সঠিক বাজার দর সরাসরি জানুন। বিভিন্ন জেলার দাম তুলনা করে সেরা দামে কেনাবেচা করুন।
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">৬৪ জেলার নেটওয়ার্ক</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                দেশের যেকোনো প্রান্তের কৃষি পণ্যের নতুন সরবরাহ ও যোগাযোগের সুযোগ এক ক্লিকেই।
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
