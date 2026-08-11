'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole, login, requestPasswordResetOtp, verifyOtpAndResetPassword } from '@/lib/client/api';
import {
  Store, Phone, Lock, Eye, EyeOff, ShieldCheck, User,
  Store as StoreIcon, Briefcase, X, MessageSquare, KeyRound,
  CheckCircle2, ArrowLeft, Loader2, PhoneCall, LogIn, ArrowRight
} from 'lucide-react';

// ─── ROLE CONFIG ──────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'farmer' as UserRole,
    label: 'কৃষক',
    labelEn: 'Farmer',
    desc: 'উৎপাদক',
    icon: User,
    emoji: '🌾',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    activeBg: 'bg-emerald-600',
  },
  {
    id: 'agent' as UserRole,
    label: 'এজেন্ট',
    labelEn: 'Agent',
    desc: 'সংগ্রাহক',
    icon: Briefcase,
    emoji: '💼',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'arathdar' as UserRole,
    label: 'আড়তদার',
    labelEn: 'Dealer',
    desc: 'পাইকার/ডিলার',
    icon: StoreIcon,
    emoji: '🏪',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    activeBg: 'bg-amber-600',
  },
];

// ─── FORGOT PASSWORD MODAL ────────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    setError(null);
    if (!phone || phone.trim().length < 11) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    setIsLoading(true);
    const res = await requestPasswordResetOtp(phone);
    setIsLoading(false);
    if (!res.success) { setError(res.error || 'OTP পাঠানো যায়নি'); return; }
    setStep(2);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const code = otp.join('');
    if (code.length < 4) { setError('৪ ডিজিটের OTP কোড দিন'); return; }
    if (!newPin || newPin.length < 4) { setError('নতুন পিন/পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে'); return; }
    setIsLoading(true);
    const res = await verifyOtpAndResetPassword(phone, code, newPin);
    setIsLoading(false);
    if (!res.success) { setError(res.error || 'যাচাই ব্যর্থ হয়েছে'); return; }
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">পাসওয়ার্ড রিসেট</p>
              <p className="text-[11px] text-slate-400">SMS OTP দিয়ে যাচাই করুন</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1: Phone */}
          {step === 1 && (
            <>
              <p className="text-sm text-slate-600 leading-relaxed">
                আপনার রেজিস্টার্ড মোবাইল নম্বরে একটি ৪ ডিজিটের OTP পাঠানো হবে।
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>মোবাইল নম্বর</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="01711223344"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-wide"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 text-center bg-red-50 rounded-xl p-2.5">{error}</p>}
              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-emerald-600/30"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
                <span className="text-white font-bold">{isLoading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}</span>
              </button>
            </>
          )}

          {/* Step 2: OTP + New PIN */}
          {step === 2 && (
            <>
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{phone}</span> নম্বরে OTP পাঠানো হয়েছে
                </p>
                <p className="text-xs text-slate-400 mt-0.5">(ডেমো মোড: OTP হলো 1234)</p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2 text-center">OTP কোড লিখুন</label>
                <div className="flex gap-3 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-14 h-14 text-center text-2xl font-black rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-slate-50 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>নতুন পিন / পাসওয়ার্ড সেট করুন</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    placeholder="কমপক্ষে ৪ ডিজিট"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-4 pr-11 py-3.5 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-widest"
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700">
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-600 text-center bg-red-50 rounded-xl p-2.5">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 text-sm">
                  <ArrowLeft className="w-4 h-4" />ফিরুন
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                  className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/30"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                  <span className="text-white font-bold">{isLoading ? 'যাচাই হচ্ছে...' : 'পাসওয়ার্ড সেট করুন'}</span>
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!</h3>
                <p className="text-sm text-slate-500 mt-1">এখন নতুন পিন দিয়ে লগইন করুন।</p>
              </div>
              <button
                onClick={onClose}
                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-emerald-600/30"
              >
                <span className="text-white font-bold">লগইন পেজে ফিরুন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN LOGIN PAGE ──────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const activeRole = ROLES.find((r) => r.id === selectedRole)!;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(phone, password, selectedRole);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'লগইন ব্যর্থ হয়েছে। নম্বর ও পাসওয়ার্ড পরীক্ষা করুন।');
      return;
    }

    if (selectedRole === 'farmer') router.push('/account');
    else if (selectedRole === 'arathdar') router.push('/browse');
    else if (selectedRole === 'agent') router.push('/admin');
    else router.push('/');
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
            <p className="text-sm text-slate-500 mt-1">আপনার ভূমিকা বেছে নিয়ে প্রবেশ করুন</p>
          </div>
        </div>

        <div className="sm:mx-auto w-full sm:max-w-sm">
          {/* ─── Role Selector ─── */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {ROLES.map((role) => {
              const isActive = selectedRole === role.id;
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  aria-pressed={isActive}
                  className={`relative py-3.5 px-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                    isActive
                      ? `${role.border} ${role.bg} shadow-md scale-[1.02]`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isActive && (
                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ${role.activeBg} flex items-center justify-center`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? role.bg : 'bg-slate-100'}`}>
                    <RoleIcon className={`w-5 h-5 ${isActive ? role.color : 'text-slate-600'}`} />
                  </div>
                  <span className={`text-xs font-black ${isActive ? role.color : 'text-slate-700'}`}>{role.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{role.desc}</span>
                </button>
              );
            })}
          </div>

          {/* ─── Login Card ─── */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
            {/* Role Banner */}
            <div className={`${activeRole.bg} px-5 py-3 flex items-center gap-2.5 border-b ${activeRole.border}/30`}>
              <activeRole.icon className={`w-5 h-5 ${activeRole.color}`} />
              <span className={`text-sm font-bold ${activeRole.color}`}>{activeRole.label} ({activeRole.labelEn}) একাউন্টে লগইন</span>
            </div>

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
                    placeholder="আপনার পিন বা পাসওয়ার্ড"
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

          {/* ─── Helpline Banner ─── */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">সাহায্যের জন্য কল করুন</p>
              <p className="text-sm font-black text-amber-800">01XXXXXXXXX</p>
              <p className="text-[10px] text-amber-600">সকাল ৮টা - রাত ১০টা</p>
            </div>
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
