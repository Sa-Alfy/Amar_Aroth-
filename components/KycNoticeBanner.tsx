'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredUser, UserProfile } from '@/lib/api/auth';
import { Clock, ShieldAlert, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function KycNoticeBanner() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const active = getStoredUser();
    setUser(active);
  }, []);

  if (!user || user.kycStatus === 'verified' || dismissed) {
    return null;
  }

  const isPending = user.kycStatus === 'pending';
  const isRejected = user.kycStatus === 'rejected';

  return (
    <div className={`border-b px-4 py-3 text-sm transition-all ${
      isRejected
        ? 'bg-red-50 border-red-200 text-red-900'
        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isRejected ? 'bg-red-100 text-red-700' : 'bg-white/20 text-white backdrop-blur-xs'
          }`}>
            {isRejected ? <ShieldAlert className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <p className="font-extrabold tracking-tight flex items-center gap-1.5">
              <span>{isRejected ? 'এনআইডি যাচাই প্রত্যাখ্যাত হয়েছে' : 'এনআইডি (KYC) যাচাই প্রক্রিয়াধীন (২৪ ঘণ্টা)'}</span>
            </p>
            <p className={`text-xs ${isRejected ? 'text-amber-100' : 'text-amber-100'}`}>
              {isRejected
                ? 'আপনার জমা দেওয়া এনআইডি তথ্যে গরমিল পাওয়া গেছে। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।'
                : 'আপনি সমস্ত পণ্য ব্রাউজ করতে পারবেন, তবে পণ্য পোস্ট করার জন্য এনআইডি অনুমোদন প্রয়োজন।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {isRejected ? (
            <Link
              href="/signup"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors shadow-sm"
            >
              পুনরায় তথ্য দিন
            </Link>
          ) : (
            <span className="bg-white/20 text-white font-bold text-xs px-3 py-1 rounded-xl backdrop-blur-xs">
              স্ট্যাটাস: অপেক্ষমাণ (Pending)
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-black/10 rounded-lg transition-colors text-white/80 hover:text-white"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
