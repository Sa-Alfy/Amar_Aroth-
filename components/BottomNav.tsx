'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, User, LogIn } from 'lucide-react';
import { fetchCurrentUser, UserProfile } from '@/lib/client/api';

export default function BottomNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setCurrentUser);
  }, []);

  const tabs = [
    {
      href: '/',
      icon: Home,
      label: 'হোম',
      activeOn: ['/'],
    },
    {
      href: '/browse',
      icon: Search,
      label: 'পণ্য খুঁজুন',
      activeOn: ['/browse'],
    },
    {
      href: '/post-supply',
      icon: PlusCircle,
      label: 'পোস্ট করুন',
      activeOn: ['/post-supply'],
      highlight: true,
    },
    currentUser
      ? {
          href: '/account',
          icon: User,
          label: 'আমার পোস্ট',
          activeOn: ['/account'],
        }
      : {
          href: '/login',
          icon: LogIn,
          label: 'লগইন করুন',
          activeOn: ['/login', '/signup'],
        },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const isActive = pathname ? tab.activeOn.includes(pathname) : false;
          const Icon = tab.icon;

          if (tab.highlight) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center py-2 gap-0.5"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/30 transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-amber-500 to-orange-500'
                }`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-amber-600">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors active:bg-slate-50 ${
                isActive ? 'text-brand-600' : 'text-slate-500'
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-700' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0 w-8 h-0.5 bg-brand-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
