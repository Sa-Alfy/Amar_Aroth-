'use client';

import React, { useState } from 'react';
import { SupplyListing } from '@/lib/mockData';
import { revealPhone } from '@/lib/client/api';
import { X, PhoneCall, CheckCircle2, MapPin, Package, Tag, ShieldCheck } from 'lucide-react';

interface ContactModalProps {
  listing: SupplyListing | null;
  onClose: () => void;
}

export default function ContactModal({ listing, onClose }: ContactModalProps) {
  const [revealed, setRevealed] = useState<{ phone?: string; sellerName?: string; isVerified?: boolean } | null>(null);
  const [revealState, setRevealState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [revealError, setRevealError] = useState<string | null>(null);

  const handleReveal = async () => {
    if (!listing?.id) return;

    setRevealState('loading');
    setRevealError(null);

    try {
      const result = await revealPhone(String(listing.id));

      if (result.success && result.phone) {
        setRevealed({
          phone: result.phone,
          sellerName: result.sellerName ?? listing.sellerName,
          isVerified: result.isVerified ?? listing.isSellerVerified,
        });
        setRevealState('success');
        return;
      }

      const message = (() => {
        const error = result.error || 'অভিযোগের নম্বর দেখাতে ব্যর্থ হয়েছে।';
        if (error.includes('Authentication required') || error.includes('login') || error.includes('logged in')) {
          return 'আপনাকে লগইন করতে হবে';
        }
        if (error.includes('quota exceeded') || error.includes('quota') || error.includes('Too many') || error.includes('Daily')) {
          return 'দৈনিক নম্বর দেখার সীমা শেষ হয়েছে';
        }
        return 'নম্বর দেখাতে ব্যর্থ হয়েছে';
      })();

      setRevealError(message);
      setRevealState('error');
    } catch (error: any) {
      const message = (() => {
        const fallback = error?.message || 'নম্বর দেখাতে ব্যর্থ হয়েছে';
        if (fallback.includes('Authentication required') || fallback.includes('login') || fallback.includes('logged in')) {
          return 'আপনাকে লগইন করতে হবে';
        }
        if (fallback.includes('quota exceeded') || fallback.includes('quota') || fallback.includes('Too many') || fallback.includes('Daily')) {
          return 'দৈনিক নম্বর দেখার সীমা শেষ হয়েছে';
        }
        return 'নম্বর দেখাতে ব্যর্থ হয়েছে';
      })();

      setRevealError(message);
      setRevealState('error');
    }
  };

  if (!listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full w-fit mb-4 border border-brand-200">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>সরাসরি যোগাযোগের নম্বর</span>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {revealed?.sellerName ?? listing.sellerName}
              {(revealed?.isVerified ?? listing.isSellerVerified) && (
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

          <div className="pt-2 text-center space-y-3">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 min-h-[88px] flex flex-col items-center justify-center">
              <span className="text-xs text-slate-400 block mb-1.5 uppercase font-semibold tracking-wider">মোবাইল নম্বর</span>

              {revealState === 'idle' && (
                <span className="text-sm text-slate-300">••••••••••</span>
              )}

              {revealState === 'loading' && (
                <span className="text-sm text-slate-300 animate-pulse">নম্বর যাচাই করা হচ্ছে...</span>
              )}

              {revealState === 'error' && (
                <span className="text-sm text-red-300 text-center">{revealError}</span>
              )}

              {revealState === 'success' && revealed?.phone && (
                <span className="text-2xl font-black text-white tracking-widest font-mono">
                  {revealed.phone}
                </span>
              )}
            </div>

            {revealState === 'success' && revealed?.phone ? (
              <a
                href={`tel:${revealed.phone}`}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-4 px-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
              >
                <PhoneCall className="w-5 h-5 animate-pulse" />
                <span>এখনই কল দিন</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={handleReveal}
                disabled={revealState === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-70 text-white py-4 px-4 rounded-xl font-bold text-base shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
              >
                <PhoneCall className="w-5 h-5" />
                <span>{revealState === 'loading' ? 'লোড হচ্ছে...' : 'নম্বর দেখুন'}</span>
              </button>
            )}

            <p className="text-[11px] text-slate-400">
              দাম, পরিবহন সুবিধা এবং মূল্য পরিশোধের শর্ত সরাসরি কৃষকের সাথে ফোনে আলোচনা করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
