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
  // Status badge helper
  const getStatusBadge = (status: SupplyListing['status']) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">Live (সচল)</span>;
      case 'negotiating':
        return <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">Negotiating (আলোচনাধীন)</span>;
      case 'reserved':
        return <span className="bg-purple-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">Reserved (সংরক্ষিত)</span>;
      case 'sold':
        return <span className="bg-slate-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">Sold Out (বিক্রিত)</span>;
      default:
        return <span className="bg-slate-400 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      
      {/* Image & Overlay Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={listing.images[0] || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div>{getStatusBadge(listing.status)}</div>
          <span className="bg-slate-900/80 backdrop-blur text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
            {listing.categoryNameBn}
          </span>
        </div>

        {/* Bottom Location Overlay */}
        <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>{listing.districtNameBn}, {listing.upazilaNameBn}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Seller Header */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className="font-medium text-slate-700">{listing.sellerName}</span>
            {listing.isSellerVerified && (
              <span title="Verified Producer">
                <CheckCircle2 className="w-4 h-4 text-brand-600 fill-brand-50" />
              </span>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize ml-auto">
              {listing.sellerType}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
            {listing.title}
          </h3>
        </div>

        {/* Pricing & Quantity Box */}
        <div className="bg-brand-50/60 p-3 rounded-xl border border-brand-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Quantity (পরিমাণ)</span>
            <span className="text-sm font-extrabold text-slate-900">
              {listing.quantity.toLocaleString()} {listing.unitSymbolBn}
            </span>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Expected Price (দর)</span>
            <span className="text-base font-black text-brand-700">
              ৳{listing.expectedPricePerUnit.toLocaleString()}
              <span className="text-xs font-normal text-slate-600"> /{listing.unitSymbolBn}</span>
            </span>
          </div>
        </div>

        {/* Details Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Ready: {listing.availableFrom}</span>
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

        {/* Action Button */}
        <button
          onClick={() => onContactClick(listing)}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors mt-2"
        >
          <Phone className="w-4 h-4" />
          <span>Call Farmer (ফোন দিন)</span>
        </button>
      </div>
    </div>
  );
}
