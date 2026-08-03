'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, MEASUREMENT_UNITS, BANGLADESH_LOCATIONS, INITIAL_LISTINGS, SupplyListing, ListingStatus } from '@/lib/mockData';
import { getSupplyListings } from '@/lib/api/listings';
import ListingCard from '@/components/ListingCard';
import ContactModal from '@/components/ContactModal';
import { Search, Filter, RefreshCw, SlidersHorizontal, MapPin, Tag, Package, Check, X } from 'lucide-react';

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedUpazila, setSelectedUpazila] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'quantity_high'>('newest');
  
  const [listings, setListings] = useState<SupplyListing[]>(INITIAL_LISTINGS);
  const [activeContactListing, setActiveContactListing] = useState<SupplyListing | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch from Supabase / Mock API
  useEffect(() => {
    getSupplyListings({
      categoryId: selectedCategory,
      districtId: selectedDistrict,
      searchQuery: searchQuery,
    }).then((data) => setListings(data));
  }, [selectedCategory, selectedDistrict, searchQuery]);

  // Available districts based on selected division
  const availableDistricts = useMemo(() => {
    if (!selectedDivision) return BANGLADESH_LOCATIONS.flatMap((div) => div.districts);
    const divObj = BANGLADESH_LOCATIONS.find((d) => d.id === selectedDivision);
    return divObj ? divObj.districts : [];
  }, [selectedDivision]);

  // Available upazilas based on selected district
  const availableUpazilas = useMemo(() => {
    if (!selectedDistrict) return [];
    const allDistricts = BANGLADESH_LOCATIONS.flatMap((div) => div.districts);
    const distObj = allDistricts.find((d) => d.id === selectedDistrict);
    return distObj ? distObj.upazilas : [];
  }, [selectedDistrict]);

  // Filter & Sort Logic
  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.districtNameEn.toLowerCase().includes(q) ||
          item.districtNameBn.includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    if (selectedDivision) {
      result = result.filter((item) => item.divisionId === selectedDivision);
    }

    if (selectedDistrict) {
      result = result.filter((item) => item.districtId === selectedDistrict);
    }

    if (selectedUpazila) {
      result = result.filter((item) => item.upazilaId === selectedUpazila);
    }

    if (selectedStatus !== 'all') {
      result = result.filter((item) => item.status === selectedStatus);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => a.expectedPricePerUnit - b.expectedPricePerUnit);
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => b.expectedPricePerUnit - a.expectedPricePerUnit);
    } else if (sortBy === 'quantity_high') {
      result.sort((a, b) => b.quantity - a.quantity);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedDivision, selectedDistrict, selectedUpazila, selectedStatus, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedDivision(null);
    setSelectedDistrict(null);
    setSelectedUpazila(null);
    setSelectedStatus('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Agricultural Supply Index Directory
            </h1>
            <p className="text-xs text-slate-500">
              Search live crop, poultry, fish & livestock inventory across all 64 districts of Bangladesh
            </p>
          </div>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center justify-center gap-2 bg-white border border-slate-300 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-800 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>Filter Search Index ({filteredListings.length})</span>
          </button>
        </div>

        {/* TOP SEARCH & SORT BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by keyword (e.g. Potato, Egg, Miniket, Sreepur)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Newest Listed First (সর্বশেষ)</option>
              <option value="price_low">Price: Low to High (কম দাম)</option>
              <option value="price_high">Price: High to Low (বেশি দাম)</option>
              <option value="quantity_high">Quantity: High to Low (বেশি পরিমাণ)</option>
            </select>
          </div>
        </div>

        {/* MAIN LAYOUT: SIDEBAR FILTERS + LISTINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden md:block space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-600" />
                <span>Index Filters</span>
              </h2>
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-brand-700 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Category (ক্যাটাগরি)
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                    selectedCategory === null ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === null && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      selectedCategory === cat.id ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.icon} {cat.nameBn}</span>
                    {selectedCategory === cat.id && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filters */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Location (অবস্থান)</span>
              </label>

              {/* Division Select */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Division (বিভাগ)</span>
                <select
                  value={selectedDivision || ''}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value ? Number(e.target.value) : null);
                    setSelectedDistrict(null);
                    setSelectedUpazila(null);
                  }}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Divisions</option>
                  {BANGLADESH_LOCATIONS.map((div) => (
                    <option key={div.id} value={div.id}>{div.nameBn} ({div.nameEn})</option>
                  ))}
                </select>
              </div>

              {/* District Select */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">District (জেলা)</span>
                <select
                  value={selectedDistrict || ''}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value ? Number(e.target.value) : null);
                    setSelectedUpazila(null);
                  }}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist.id} value={dist.id}>{dist.nameBn} ({dist.nameEn})</option>
                  ))}
                </select>
              </div>

              {/* Upazila Select */}
              {selectedDistrict && (
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Upazila (উপজিলা)</span>
                  <select
                    value={selectedUpazila || ''}
                    onChange={(e) => setSelectedUpazila(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Upazilas</option>
                    {availableUpazilas.map((up) => (
                      <option key={up.id} value={up.id}>{up.nameBn} ({up.nameEn})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Listing Lifecycle Status Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Status Lifecycle
              </label>
              <div className="space-y-1">
                {[
                  { value: 'all', label: 'All Active & Reserved' },
                  { value: 'active', label: 'Live (সচল)' },
                  { value: 'negotiating', label: 'Negotiating (আলোচনাধীন)' },
                  { value: 'reserved', label: 'Reserved (সংরক্ষিত)' },
                  { value: 'sold', label: 'Sold Out (বিক্রিত)' },
                ].map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setSelectedStatus(st.value as any)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      selectedStatus === st.value ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st.label}</span>
                    {selectedStatus === st.value && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* LISTINGS RESULTS GRID */}
          <main className="md:col-span-3">
            
            {/* Active Filters Pill Row */}
            {(selectedCategory || selectedDistrict || searchQuery || selectedStatus !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-400 font-medium">Active Filters:</span>
                {selectedCategory && (
                  <span className="text-xs bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.nameBn}
                    <button onClick={() => setSelectedCategory(null)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedDistrict && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                    District #{selectedDistrict}
                    <button onClick={() => setSelectedDistrict(null)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                    Status: {selectedStatus}
                    <button onClick={() => setSelectedStatus('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:underline ml-auto font-medium"
                >
                  Clear All
                </button>
              </div>
            )}

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
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-slate-500 text-sm">No supply listings found matching your search criteria.</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>

        </div>
      </div>

      {/* CONTACT MODAL REVEAL */}
      <ContactModal
        listing={activeContactListing}
        onClose={() => setActiveContactListing(null)}
      />
    </div>
  );
}
