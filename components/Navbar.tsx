'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, PlusCircle, Search, User, ShieldCheck, Menu, X, PhoneCall, LogIn, UserPlus } from 'lucide-react';
import { fetchCurrentUser, UserProfile } from '@/lib/client/api';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setCurrentUser);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* ব্র্যান্ড লোগো */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">আমার আড়ত</span>
                <span className="text-xs bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-medium border border-brand-200">Aaroth</span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">বাংলাদেশের কৃষি সরবরাহ সূচক</p>
            </div>
          </Link>

          {/* ডেস্কটপ নেভিগেশন */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link 
              href="/browse" 
              className="text-slate-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>পণ্য খুঁজুন</span>
            </Link>
            
            <Link 
              href="/account" 
              className="text-slate-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>আমার পোস্ট</span>
            </Link>

            <Link 
              href="/admin" 
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all opacity-60 hover:opacity-100"
              title="অ্যাডমিন প্যানেল"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="sr-only md:not-sr-only">অ্যাডমিন</span>
            </Link>
          </nav>

          {/* অ্যাকশন বাটন ও লগইন/রেজিস্ট্রেশন */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <Link
                href="/account"
                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[100px] truncate">{currentUser.fullName}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1 text-slate-700 hover:text-brand-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:flex items-center gap-1 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-600" />
                  <span>রেজিস্ট্রেশন</span>
                </Link>
              </>
            )}

            <Link
              href="/post-supply"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-amber-500/30 transition-all hover:shadow-amber-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>পোস্ট করুন</span>
            </Link>

            {/* মোবাইল মেনু বাটন */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* মোবাইল ড্রয়ার মেনু */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <Link
            href="/browse"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
          >
            <Search className="w-5 h-5 text-brand-600" />
            <span>পণ্য খুঁজুন</span>
          </Link>

          <Link
            href="/account"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
          >
            <User className="w-5 h-5 text-brand-600" />
            <span>আমার পোস্ট ও অ্যাকাউন্ট</span>
          </Link>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-slate-800 font-bold text-xs rounded-xl bg-slate-100 border border-slate-200"
            >
              <LogIn className="w-4 h-4 text-slate-600" />
              <span>লগইন করুন</span>
            </Link>

            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-brand-800 font-bold text-xs rounded-xl bg-brand-50 border border-brand-200"
            >
              <UserPlus className="w-4 h-4 text-brand-600" />
              <span>রেজিস্ট্রেশন</span>
            </Link>
          </div>

          <details className="group">
            <summary className="flex items-center gap-2 px-3 py-2 text-slate-500 font-medium rounded-lg hover:bg-slate-50 text-xs cursor-pointer list-none">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>অ্যাডমিন প্যানেল</span>
              <span className="ml-auto text-slate-400 text-[10px]">▾</span>
            </summary>
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-6 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-50 text-xs"
            >
              পরিচালনা প্যানেল দেখুন
            </Link>
          </details>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-3">
            <span>সহায়তা হেল্পলাইন:</span>
            <a href="tel:+8801700000000" className="flex items-center gap-1 text-brand-700 font-semibold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>০১৭০০-০০০০০০</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
