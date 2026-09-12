'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/client/api';
import {
  Store, Phone, Lock, Eye, EyeOff, ShieldCheck,
  X, KeyRound, Loader2, LogIn, ArrowRight
} from 'lucide-react';

// ─── FORGOT PASSWORD NOTICE ───────────────────────────────────────────────────
// Password reset is not built yet. This used to be a 4-step OTP flow that
// verified a hardcoded '1234' and changed nothing, so users believed their PIN
// was reset and then could not log in. An honest dead end beats a fake success.

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-700" />
            </div>
            <h2 className="text-base font-black text-slate-900">পাসওয়ার্ড ভুলে গেছেন?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            পাসওয়ার্ড রিসেট সুবিধা এখনো চালু হয়নি। আপনার নম্বরে এসএমএস কোড পাঠানোর ব্যবস্থা
            তৈরি হলে এই সুবিধা যুক্ত হবে।
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            এখন পাসওয়ার্ড পরিবর্তন করতে আমার আড়ত সহায়তা কেন্দ্রে যোগাযোগ করুন।
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            বুঝেছি
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(phone, password);
    setIsLoading(false);

    if (!res.success || !res.user) {
      setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে। নম্বর ও পাসওয়ার্ড পরীক্ষা করুন।');
      return;
    }

    // Refresh the RSC cache first, otherwise Server Components render as logged out.
    router.refresh();

    const userType = res.user.userType;
    if (userType === 'farmer') {
      router.push('/account');
    } else if (userType === 'arathdar' || userType === 'dokandar' || userType === 'dealer' || userType === 'aggregator') {
      router.push('/browse');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6">

        {/* ─── Brand Header ─── */}
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center mb-6 space-y-3">
          <Link href="/" className="inline-block group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 group-hover:scale-105 transition-transform mx-auto">
              <Store className="w-9 h-9" />
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">আমার আড়তে লগইন</h1>
            <p className="text-sm text-slate-500 mt-1">মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে প্রবেশ করুন</p>
          </div>
        </div>

        <div className="sm:mx-auto w-full sm:max-w-sm">
          {/* ─── Login Card ─── */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
            <form onSubmit={handleLogin} className="p-5 space-y-4">
              {/* Phone Input */}
              <div>
                <label htmlFor="login-phone" className="text-sm font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>মোবাইল নম্বর</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pr-3 border-r border-slate-200">
                    <span className="text-sm">🇧🇩</span>
                    <span className="text-xs font-bold text-slate-600">+880</span>
                  </div>
                  <input
                    id="login-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="01711223344"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-24 pr-4 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-wide placeholder:font-sans"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 pl-1">১১ ডিজিটের মোবাইল নম্বর লিখুন</p>
              </div>

              {/* Password / PIN Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="login-password" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>পাসওয়ার্ড / পিন</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-bold text-emerald-700 hover:underline transition-colors"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    required
                    placeholder="আপনার পিন বা পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl flex items-start gap-2">
                  <span className="text-base mt-0.5">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                id="login-submit-btn"
                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 text-white font-black py-4 px-4 rounded-2xl text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin text-white" /><span className="text-white font-black text-base">লগইন হচ্ছে...</span></>
                ) : (
                  <><LogIn className="w-5 h-5 text-white" /><span className="text-white font-black text-base">লগইন করুন</span></>
                )}
              </button>
            </form>
          </div>

          {/* ─── Register Link ─── */}
          <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-sm text-slate-600 mb-1">নতুন ব্যবহারকারী? একাউন্ট নেই?</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-base font-black text-emerald-700 hover:underline transition-colors"
            >
              <span>নতুন একাউন্ট নিবন্ধন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ─── Security Badge ─── */}
          <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SSL এনক্রিপ্টেড নিরাপদ সংযোগ</span>
          </div>
        </div>
      </div>
    </>
  );
}
