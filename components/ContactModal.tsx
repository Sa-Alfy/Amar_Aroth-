'use client';

import React, { useEffect } from 'react';
import { SupplyListing } from '@/lib/mockData';
import { recordPhoneRevealEvent } from '@/lib/api/listings';
import { X, PhoneCall, CheckCircle2, MapPin, Package, Tag, ShieldCheck } from 'lucide-react';

interface ContactModalProps {
  listing: SupplyListing | null;
  onClose: () => void;
}

export default function ContactModal({ listing, onClose }: ContactModalProps) {
  useEffect(() => {
    if (listing?.id) {
      recordPhoneRevealEvent(listing.id);
    }
  }, [listing?.id]);

  if (!listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full w-fit mb-4 border border-brand-200">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>সরাসরি যোগাযোগের নম্বর</span>
        </div>

        {/* Seller Info Card */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {listing.sellerName}
              {listing.isSellerVerified && (
                <span title="Verified Producer">
                  <CheckCircle2 className="w-5 h-5 text-brand-600 fill-brand-100" />
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              পরিচয়: <span className="font-medium text-slate-700">
                {listing.sellerType === 'farmer' ? 'কৃষক' : listing.sellerType === 'aggregator' ? 'সংগ্রাহক' : 'সমবায়'}
              </span>
            </p>
          </div>

          {/* Listing Specs Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs text-slate-700 border border-slate-200/80">
            <div className="font-semibold text-slate-900 text-sm line-clamp-1">
              {listing.title}
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-brand-600" />
                <span>{listing.quantity.toLocaleString()} {listing.unitSymbolBn}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold text-slate-900">৳{listing.expectedPricePerUnit.toLocaleString()} /{listing.unitSymbolBn}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 pt-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{listing.upazilaNameBn}, {listing.districtNameBn}</span>
            </div>
          </div>

          {/* Phone Call Call-To-Action */}
          <div className="pt-2 text-center space-y-3">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs text-slate-500 block mb-1">মোবাইল নম্বর:</span>
              <span className="text-2xl font-black text-slate-900 tracking-wider font-mono">
                {listing.sellerPhone}
              </span>
            </div>

            <a
              href={`tel:${listing.sellerPhone}`}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3.5 px-4 rounded-xl font-semibold text-base shadow-md shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-5 h-5 animate-pulse" />
              <span>এখনই কল দিন</span>
            </a>

            <p className="text-[11px] text-slate-400">
              দাম, পরিবহন সুবিধা এবং মূল্য পরিশোধের শর্ত সরাসরি কৃষকের সাথে ফোনে আলোচনা করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
