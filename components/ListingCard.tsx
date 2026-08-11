'use client';

import React from 'react';
import Image from 'next/image';
import { SupplyListing } from '@/lib/mockData';
import { MapPin, Phone, Eye, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface ListingCardProps {
  listing: SupplyListing;
  onContactClick: (listing: SupplyListing) => void;
  onViewClick?: (listing: SupplyListing) => void;
}

export default function ListingCard({ listing, onContactClick, onViewClick }: ListingCardProps) {
  const getStatusBadge = (status: SupplyListing['status']) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">🟢 সচল</span>;
      case 'negotiating':
        return <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">🟡 আলোচনাধীন</span>;
      case 'reserved':
        return <span className="bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">🔵 সংরক্ষিত</span>;
      case 'sold':
        return <span className="bg-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">⚫ বিক্রিত</span>;
      default:
        return <span className="bg-slate-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  const getSellerTypeLabel = (type: string) => {
    switch (type) {
      case 'farmer': return 'কৃষক';
      case 'aggregator': return 'সংগ্রাহক';
      case 'cooperative': return 'সমবায়';
      default: return type;
    }
  };

  return (
    <div
      onClick={() => (onViewClick || onContactClick)(listing)}
      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
    >
      
      {/* ছবি ও ব্যাজ */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={listing.images[0] || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80';
          }}
          loading="lazy"
        />
        
        {/* উপরের ব্যাজ */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div>{getStatusBadge(listing.status)}</div>
          <span className="bg-slate-900/80 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            {listing.categoryNameBn}
          </span>
        </div>

        {/* নিচের অবস্থান */}
        <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>{listing.districtNameBn}, {listing.upazilaNameBn}</span>
        </div>
      </div>

      {/* কন্টেন্ট এলাকা */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* বিক্রেতার তথ্য */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
            <span className="font-semibold text-slate-800">{listing.sellerName}</span>
            {listing.isSellerVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                যাচাইকৃত
              </span>
            )}
            <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium ml-auto">
              {getSellerTypeLabel(listing.sellerType)}
            </span>
          </div>

          {/* শিরোনাম */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
            {listing.title}
          </h3>

          {/* অবস্থান ব্যাজ */}
          <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>📍 {listing.districtNameBn} • {listing.upazilaNameBn}</span>
          </div>
        </div>

        {/* মূল্য ও পরিমাণ */}
        <div className="bg-brand-50/60 p-4 rounded-xl border border-brand-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 block uppercase font-semibold tracking-wide mb-0.5">পরিমাণ</span>
            <span className="text-lg font-black text-slate-900">
              {listing.quantity.toLocaleString('bn-BD')} {listing.unitSymbolBn}
            </span>
          </div>
          
          <div className="text-right">
            <span className="text-xs text-slate-600 block uppercase font-semibold tracking-wide mb-0.5">প্রতি ইউনিট দর</span>
            <span className="text-xl font-black text-brand-700">
              ৳{listing.expectedPricePerUnit.toLocaleString('bn-BD')}
              <span className="text-xs font-medium text-slate-700"> /{listing.unitSymbolBn}</span>
            </span>
          </div>
        </div>

        {/* মেটাডেটা */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>পাওয়া যাবে: {listing.availableFrom}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {listing.viewCount}
            </span>
            <span className="flex items-center gap-0.5 text-brand-700 font-semibold">
              <Phone className="w-3.5 h-3.5" />
              {listing.contactCount}
            </span>
          </div>
        </div>

        {/* ফোন বাটন — বড় ও সহজে চাপার জন্য বড় টাচ টার্গেট */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContactClick(listing);
          }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-emerald-700 hover:from-brand-700 hover:to-emerald-800 text-white font-bold text-sm sm:text-base py-3.5 sm:py-4 px-4 rounded-xl shadow-md shadow-brand-600/20 active:scale-[0.98] transition-all mt-2"
        >
          <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>কৃষককে ফোন দিন</span>
        </button>
      </div>
    </div>
  );
}
