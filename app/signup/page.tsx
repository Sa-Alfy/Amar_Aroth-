'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole, signup, fetchLocations } from '@/lib/client/api';
import { BANGLADESH_LOCATIONS, LocationDivision } from '@/lib/mockData';
import {
  Store, Phone, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck,
  User, Store as StoreIcon, Briefcase, Camera, MapPin, ArrowRight,
  ArrowLeft, Loader2, PhoneCall, Upload, X, Info, AlertCircle,
  FileText, Check
} from 'lucide-react';

// ─── ROLE CONFIG ──────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'farmer' as UserRole,
    label: 'কৃষক',
    labelEn: 'Farmer',
    desc: 'ফসল উৎপাদনকারী',
    icon: User,
    emoji: '🌾',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    activeBg: 'bg-emerald-600',
  },
  {
    id: 'arathdar' as UserRole,
    label: 'আড়তদার',
    labelEn: 'Arathdar',
    desc: 'পাইকারি ক্রেতা',
    icon: StoreIcon,
    emoji: '🏪',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    activeBg: 'bg-amber-600',
  },
  {
    id: 'dokandar' as UserRole,
    label: 'দোকানদার',
    labelEn: 'Dokandar',
    desc: 'খুচরা বিক্রেতা',
    icon: Briefcase,
    emoji: '🛍️',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    activeBg: 'bg-blue-600',
  },
];

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'পরিচয়' },
    { num: 2, label: 'NID' },
    { num: 3, label: 'ঠিকানা' },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-2">
      {steps.map((s, i) => {
        const isComplete = currentStep > s.num;
        const isActive = currentStep === s.num;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                isComplete
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isActive
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-400'
              }`}>
                {isComplete ? <CheckCircle2 className="w-5 h-5 text-white" /> : s.num}
              </div>
              <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-emerald-700' : isComplete ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mb-4 transition-all ${currentStep > s.num ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── NID PHOTO UPLOAD BOX ─────────────────────────────────────────────────────

function NidPhotoUpload({
  label,
  hint,
  preview,
  onChange,
}: {
  label: string;
  hint: string;
  preview: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
        <Camera className="w-4 h-4 text-slate-600" />
        <span>{label}</span>
      </label>
      <div
        onClick={() => fileRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
          preview ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30'
        }`}
      >
        {preview ? (
          <div className="relative h-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">পরিবর্তন করুন</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-700 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-white" /> আপলোড সম্পন্ন
            </div>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center gap-2 p-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Camera className="w-6 h-6 text-emerald-700" />
            </div>
            <p className="text-xs font-bold text-slate-600">ক্যামেরায় তুলুন বা ফাইল বেছে নিন</p>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">{hint}</p>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── MAIN SIGNUP PAGE ─────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [locations, setLocations] = useState<LocationDivision[]>(BANGLADESH_LOCATIONS);

  // Step 1 fields
  const [role, setRole] = useState<UserRole>('farmer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 fields
  const [nidNumber, setNidNumber] = useState('');
  const [nidFrontUrl, setNidFrontUrl] = useState('');
  const [nidBackUrl, setNidBackUrl] = useState('');
  const [isVerifyingNid, setIsVerifyingNid] = useState(false);
  const [nidVerified, setNidVerified] = useState(false);

  // Step 3 fields
  const [divisionId, setDivisionId] = useState<number>(1);
  const [districtId, setDistrictId] = useState<number>(101);
  const [upazilaId, setUpazilaId] = useState<number>(1001);
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const activeRole = ROLES.find((r) => r.id === role)!;

  useEffect(() => {
    fetchLocations().then((data) => {
      setLocations(data);
      if (data.length > 0) {
        setDivisionId(data[0].id);
        if (data[0].districts.length > 0) {
          setDistrictId(data[0].districts[0].id);
          if (data[0].districts[0].upazilas.length > 0) {
            setUpazilaId(data[0].districts[0].upazilas[0].id);
          }
        }
      }
    });
  }, []);

  const selectedDiv = locations.find((d) => d.id === divisionId);
  const availableDistricts = selectedDiv?.districts || [];
  const selectedDist = availableDistricts.find((d) => d.id === districtId);
  const availableUpazilas = selectedDist?.upazilas || [];

  // Password strength
  const pinStrength = password.length === 0 ? 0 : password.length < 4 ? 1 : password.length < 6 ? 2 : 3;
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];
  const strengthLabels = ['', 'দুর্বল', 'মাঝারি', 'শক্তিশালী'];

  // Step handlers
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!fullName || fullName.trim().length < 3) { setErrorMessage('আপনার পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)'); return; }
    if (!phone || phone.trim().length < 11) { setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন'); return; }
    if (!password || password.length < 6) { setErrorMessage('পাসওয়ার্ড বা পিন কমপক্ষে ৬ অক্ষরের হতে হবে'); return; }
    if (password !== confirmPassword) { setErrorMessage('পাসওয়ার্ড দুটি মিলছে না। আবার লিখুন।'); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNidVerify = () => {
    if (!nidNumber || nidNumber.trim().length < 10) {
      setErrorMessage('সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন');
      return;
    }
    setIsVerifyingNid(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsVerifyingNid(false);
      setNidVerified(true);
    }, 1200);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!nidNumber || nidNumber.trim().length < 10) { setErrorMessage('সঠিক এনআইডি নম্বর দিন'); return; }
    if (!nidFrontUrl) { setErrorMessage('এনআইডির সামনের পিঠের ছবি আপলোড করুন'); return; }
    if (!nidBackUrl) { setErrorMessage('এনআইডির পেছনের পিঠের ছবি আপলোড করুন'); return; }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await signup({
      role,
      fullName: fullName.trim(),
      phone: phone.trim(),
      password,
      nidNumber: nidNumber.trim(),
      nidFrontUrl,
      nidBackUrl,
      divisionId,
      districtId,
      upazilaId,
      address,
    });

    setIsLoading(false);
    if (!res.success) { setErrorMessage(res.error || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'); return; }
    setRegisteredUser(res.user);
    setStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToDashboard = () => {
    if (role === 'farmer') router.push('/account');
    else if (role === 'arathdar' || role === 'dokandar') router.push('/browse');
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        {/* ─── Brand Header ─── */}
        <div className="text-center mb-6 space-y-2">
          <Link href="/" className="inline-block group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 group-hover:scale-105 transition-transform mx-auto">
              <Store className="w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">নতুন একাউন্ট খুলুন</h1>
          <p className="text-sm text-slate-500">বিনামূল্যে রেজিস্ট্রেশন — NID দিয়ে নিরাপদ যাচাই</p>
        </div>

        {/* ─── Step Indicator (steps 1-3) ─── */}
        {step <= 3 && <StepIndicator currentStep={step} />}

        {/* ─── Main Card ─── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden mt-4">

          {/* ════════════════════════════════════════════════════
              STEP 1: ROLE + CONTACT INFO
          ════════════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleStep1}>
              {/* Step header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">ধাপ ১: আপনার পরিচয়</p>
                    <p className="text-[11px] text-slate-400">ভূমিকা, নাম ও মোবাইল নম্বর</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-1 rounded-full">১ / ৩</span>
              </div>

              <div className="p-5 space-y-5">
                {/* Role Picker */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">
                    আপনার ভূমিকা নির্বাচন করুন <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {ROLES.map((r) => {
                      const isActive = role === r.id;
                      const RoleIcon = r.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          aria-pressed={isActive}
                          className={`relative py-3.5 px-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                            isActive
                              ? `${r.border} ${r.bg} shadow-md`
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          {isActive && (
                            <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full ${r.activeBg} flex items-center justify-center`}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <span className="text-2xl leading-none">{r.emoji}</span>
                          <span className={`text-xs font-black ${isActive ? r.color : 'text-slate-700'}`}>{r.label}</span>
                          <span className="text-[9px] text-slate-400 text-center leading-tight">{r.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-600" />
                    <span>আপনার পুরো নাম</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোঃ আব্দুল করিম"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  <p className="text-xs text-slate-400 mt-1 pl-1">এনআইডি কার্ডের নাম লিখুন</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
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
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="01711223344"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-24 pr-4 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-wide placeholder:font-sans"
                    />
                  </div>
                </div>

                {/* PIN / Password */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>পিন / পাসওয়ার্ড তৈরি করুন</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      inputMode="numeric"
                      required
                      placeholder="কমপক্ষে ৬ অক্ষরের পিন বা পাসওয়ার্ড"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${pinStrength >= i ? strengthColors[pinStrength] : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-bold ${pinStrength === 1 ? 'text-red-500' : pinStrength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>{strengthLabels[pinStrength]}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>পিন আবার লিখুন (নিশ্চিত করুন)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      inputMode="numeric"
                      required
                      placeholder="পিন আবার লিখুন"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-4 pr-12 py-4 rounded-2xl border text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans transition-all ${
                        confirmPassword && confirmPassword !== password ? 'border-red-300 bg-red-50' : confirmPassword && confirmPassword === password ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {confirmPassword && confirmPassword === password && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-11 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1 pl-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />পাসওয়ার্ড দুটি মিলছে না
                    </p>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-2">
                    <span className="text-base mt-0.5">⚠️</span>{errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <span className="text-white font-black text-base">পরবর্তী ধাপ (NID তথ্য)</span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 2: NID & PHOTO VERIFICATION
          ════════════════════════════════════════════════════ */}
          {step === 2 && (
            <form onSubmit={handleStep2}>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">ধাপ ২: NID যাচাই</p>
                    <p className="text-[11px] text-slate-400">জাতীয় পরিচয়পত্রের তথ্য ও ছবি</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-1 rounded-full">২ / ৩</span>
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex gap-2.5">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    আমার আড়ত একটি নিরাপদ প্ল্যাটফর্ম। কৃষক ও ব্যবসায়ীদের পরিচয় যাচাই করতে এনআইডি ছবি সংগ্রহ করা হয়। এই তথ্য গোপনীয় ও সুরক্ষিত।
                  </p>
                </div>

                {/* NID Number */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>এনআইডি নম্বর</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="১০ বা ১৭ ডিজিট NID নম্বর"
                        value={nidNumber}
                        onChange={(e) => { setNidNumber(e.target.value); setNidVerified(false); }}
                        className={`w-full px-4 py-4 rounded-2xl border text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono tracking-widest placeholder:font-sans transition-all ${
                          nidVerified ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'
                        }`}
                      />
                      {nidVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                    </div>
                    <button
                      type="button"
                      onClick={handleNidVerify}
                      disabled={isVerifyingNid || nidVerified}
                      className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl transition-all whitespace-nowrap disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                    >
                      {isVerifyingNid ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700" /> : nidVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-700" />}
                      <span>{isVerifyingNid ? 'যাচাই...' : nidVerified ? 'যাচাই হয়েছে' : 'যাচাই করুন'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-1">স্মার্ট কার্ড / NID-এর নম্বর লিখুন</p>
                </div>

                {/* NID Front Photo */}
                <NidPhotoUpload
                  label="এনআইডির সামনের পিঠ (Front Side) *"
                  hint="আপনার NID কার্ডের সামনের দিকের ছবি তুলুন।"
                  preview={nidFrontUrl}
                  onChange={setNidFrontUrl}
                />

                {/* NID Back Photo */}
                <NidPhotoUpload
                  label="এনআইডির পেছনের পিঠ (Back Side) *"
                  hint="আপনার NID কার্ডের পেছনের দিকের ছবি তুলুন।"
                  preview={nidBackUrl}
                  onChange={setNidBackUrl}
                />

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-2">
                    <span className="text-base mt-0.5">⚠️</span>{errorMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrorMessage(null); }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-1.5 text-sm transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /><span>ফিরুন</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <span className="text-white font-black text-base">পরবর্তী (ঠিকানা)</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 3: LOCATION & ADDRESS
          ════════════════════════════════════════════════════ */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit}>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">ধাপ ৩: আপনার ঠিকানা</p>
                    <p className="text-[11px] text-slate-400">বিভাগ, জেলা ও উপজেলা বেছে নিন</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/80 px-2 py-1 rounded-full">৩ / ৩</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Division */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>বিভাগ</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={divisionId}
                    onChange={(e) => {
                      const dId = Number(e.target.value);
                      setDivisionId(dId);
                      const div = locations.find((d) => d.id === dId);
                      if (div && div.districts.length > 0) {
                        setDistrictId(div.districts[0].id);
                        if (div.districts[0].upazilas.length > 0) setUpazilaId(div.districts[0].upazilas[0].id);
                      }
                    }}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 appearance-none"
                  >
                    {locations.map((d) => <option key={d.id} value={d.id}>{d.nameBn} ({d.nameEn})</option>)}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>জেলা</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={districtId}
                    onChange={(e) => {
                      const dId = Number(e.target.value);
                      setDistrictId(dId);
                      const dist = availableDistricts.find((d) => d.id === dId);
                      if (dist && dist.upazilas.length > 0) setUpazilaId(dist.upazilas[0].id);
                    }}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 appearance-none"
                  >
                    {availableDistricts.map((d) => <option key={d.id} value={d.id}>{d.nameBn} ({d.nameEn})</option>)}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>উপজেলা</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={upazilaId}
                    onChange={(e) => setUpazilaId(Number(e.target.value))}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 appearance-none"
                  >
                    {availableUpazilas.map((u) => <option key={u.id} value={u.id}>{u.nameBn} ({u.nameEn})</option>)}
                  </select>
                </div>

                {/* Detailed Address */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">গ্রাম / বাজার / আড়তের নাম</label>
                  <textarea
                    rows={3}
                    placeholder="যেমন: মহাস্থানগড় পাইকারি বাজার, শিবগঞ্জ বাজার রোড..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-700 mb-2">নিবন্ধন সারসংক্ষেপ</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="text-slate-400">ভূমিকা:</span>
                    <span className="font-bold">{activeRole.emoji} {activeRole.label}</span>
                    <span className="text-slate-400">নাম:</span>
                    <span className="font-bold">{fullName || '—'}</span>
                    <span className="text-slate-400">মোবাইল:</span>
                    <span className="font-bold font-mono">{phone || '—'}</span>
                    <span className="text-slate-400">NID:</span>
                    <span className="font-bold font-mono">{nidNumber || '—'}</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-2">
                    <span className="text-base mt-0.5">⚠️</span>{errorMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setErrorMessage(null); }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-1.5 text-sm transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /><span>ফিরুন</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 text-white font-black py-4 rounded-2xl text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin text-white" /><span className="text-white font-black text-base">নিবন্ধন হচ্ছে...</span></>
                    ) : (
                      <><Check className="w-5 h-5 text-white" /><span className="text-white font-black text-base">রেজিস্ট্রেশন সম্পন্ন করুন</span></>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════════════════════
              STEP 4: SUCCESS & KYC NOTICE
          ════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="p-6 text-center space-y-5">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto relative">
                  <CheckCircle2 className="w-14 h-14 text-emerald-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">রেজিস্ট্রেশন সম্পন্ন!</h2>
                <p className="text-sm text-slate-500 mt-1">আপনার একাউন্ট সফলভাবে তৈরি হয়েছে</p>
              </div>

              {/* KYC Notice */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <span className="text-sm font-black text-amber-900">২৪ ঘণ্টার মধ্যে KYC যাচাই</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  আপনার NID নম্বর ({nidNumber}) ও ছবি জমা নেওয়া হয়েছে। আগামী <strong className="text-amber-900">১ কর্মদিবসের (২৪ ঘণ্টা)</strong> মধ্যে আমাদের টিম আপনার তথ্য যাচাই করবে।
                </p>
                <div className="bg-white rounded-xl border border-amber-200 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>এখনই সকল পণ্য দেখতে পারবেন (Browse)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-4 h-4 bg-slate-200 rounded-full text-[10px] flex items-center justify-center font-bold text-slate-400">!</span>
                    <span>যাচাইয়ের পর পণ্য পোস্ট করা যাবে</span>
                  </div>
                </div>
              </div>

              {/* Account info summary */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">আপনার একাউন্ট তথ্য</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-400">নাম:</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                  <span className="text-slate-400">মোবাইল:</span>
                  <span className="font-bold font-mono text-slate-900">{phone}</span>
                  <span className="text-slate-400">ভূমিকা:</span>
                  <span className="font-bold text-slate-900">{activeRole.label}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToDashboard}
                className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black py-4 px-6 rounded-2xl text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <span className="text-white font-black text-base">পণ্যের তালিকা দেখুন (Browse)</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Login link footer */}
          {step < 4 && (
            <div className="px-5 pb-5 text-center text-sm text-slate-600 border-t border-slate-100 pt-4">
              <span>ইতিমধ্যে একাউন্ট আছে? </span>
              <Link href="/login" className="font-black text-emerald-700 hover:underline">
                এখানে লগইন করুন
              </Link>
            </div>
          )}
        </div>

        {/* ─── Helpline ─── */}
        {step < 4 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">সাহায্যের জন্য কল করুন</p>
              <p className="text-sm font-black text-amber-800">01310-075529</p>
              <p className="text-[10px] text-amber-600">সকাল ৮টা - রাত ১০টা (টোল ফ্রি)</p>
            </div>
          </div>
        )}

        {/* ─── Security ─── */}
        <div className="mt-4 mb-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SSL এনক্রিপ্টেড — আপনার NID ও তথ্য সম্পূর্ণ সুরক্ষিত</span>
        </div>
      </div>
    </div>
  );
}
