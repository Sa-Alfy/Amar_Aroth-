'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, PlusCircle, Search, User, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { fetchCurrentUser, UserProfile } from '@/lib/client/api';

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setCurrentUser);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900">আমার আড়ত</span>
                <span className="text-[10px] md:text-xs bg-brand-100 text-brand-800 px-1.5 md:px-2 py-0.5 rounded-full font-medium border border-brand-200">Aaroth</span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">বাংলাদেশের কৃষি সরবরাহ সূচক</p>
            </div>
          </Link>

          {/* Desktop Navigation — hidden on mobile (BottomNav handles it) */}
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
              <span>অ্যাডমিন</span>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop: Login / Register / User pill */}
            {currentUser ? (
              <Link
                href="/account"
                className="hidden md:flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-2 rounded-xl"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[100px] truncate">{currentUser.fullName}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-1 text-slate-700 hover:text-brand-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </Link>
                <Link
                  href="/signup"
                  className="hidden md:flex items-center gap-1 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-600" />
                  <span>রেজিস্ট্রেশন</span>
                </Link>
              </>
            )}

            {/* Post CTA — visible on all screen sizes */}
            <Link
              href="/post-supply"
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-md shadow-amber-500/30 transition-all hover:shadow-amber-500/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">পোস্ট করুন</span>
              <span className="sm:hidden">পোস্ট</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
