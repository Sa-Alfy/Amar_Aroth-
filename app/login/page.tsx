'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole, loginWithPhoneAndPassword } from '@/lib/api/auth';
import { Store, Phone, Lock, Eye, EyeOff, Sparkles, ShieldCheck, User, Store as StoreIcon, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Active Role Tab
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await loginWithPhoneAndPassword(phone, password, selectedRole);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে। নম্বর ও পাসওয়ার্ড পরীক্ষা করুন।');
      return;
    }

    // Role-specific redirection based on confirmed grill-me interview choices
    if (selectedRole === 'farmer') {
      router.push('/account');
    } else if (selectedRole === 'arathdar') {
      router.push('/browse');
    } else if (selectedRole === 'agent') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        
        {/* Brand Badge */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform mx-auto">
            <Store className="w-7 h-7" />
          </div>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          আমার আড়ত একাউন্ট লগইন
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
          আপনার ভূমিকা সিলেক্ট করে মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          
          {/* ROLE SELECTOR TABS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider text-center">
              আপনার ভূমিকা সিলেক্ট করুন
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {[
                { id: 'farmer', label: 'কৃষক', icon: User, color: 'text-emerald-700 bg-emerald-50' },
                { id: 'agent', label: 'এজেন্ট', icon: Briefcase, color: 'text-blue-700 bg-blue-50' },
                { id: 'arathdar', label: 'আড়তদার', icon: StoreIcon, color: 'text-amber-700 bg-amber-50' },
              ].map((role) => {
                const isSelected = selectedRole === role.id;
                const Icon = role.icon;
                return (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => setSelectedRole(role.id as UserRole)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-md scale-[1.02] border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Mobile Phone Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                মোবাইল নম্বর (১১ ডিজিট) *
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 01711223344"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  পাসওয়ার্ড *
                </label>
                <a href="#" className="text-xs text-brand-700 hover:underline font-medium">
                  পাসওয়ার্ড ভুলে গেছেন?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {isLoading ? (
                <><span className="animate-spin">⏳</span><span>লগইন হচ্ছে...</span></>
              ) : (
                <><Sparkles className="w-5 h-5" /><span>লগইন করুন</span></>
              )}
            </button>
          </form>

          {/* Quick Registration Link */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            <span>নতুন ব্যবহারকারী? </span>
            <Link href="/signup" className="text-brand-700 font-bold hover:underline">
              এখানে নতুন একাউন্ট খুলুন (রেজিস্ট্রেশন)
            </Link>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>সুরক্ষিত এনক্রিপ্টেড সেশন (আপনার তথ্য নিরাপদ)</span>
        </div>
      </div>
    </div>
  );
}
