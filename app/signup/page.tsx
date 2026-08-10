'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole, registerUser } from '@/lib/api/auth';
import { getLocations } from '@/lib/api/listings';
import { BANGLADESH_LOCATIONS, LocationDivision } from '@/lib/mockData';
import { Store, Phone, Lock, Eye, EyeOff, Sparkles, CheckCircle2, ShieldCheck, User, Store as StoreIcon, Briefcase, Camera, FileText, MapPin, ArrowRight, Clock } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  // Wizard Step State (1, 2, 3, 4)
  const [step, setStep] = useState<number>(1);
  const [locations, setLocations] = useState<LocationDivision[]>(BANGLADESH_LOCATIONS);

  // Form Fields
  const [role, setRole] = useState<UserRole>('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: NID & Photo
  const [nidName, setNidName] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isExtractingNid, setIsExtractingNid] = useState(false);

  // Step 3: Location & Address
  const [divisionId, setDivisionId] = useState<number>(1);
  const [districtId, setDistrictId] = useState<number>(101);
  const [upazilaId, setUpazilaId] = useState<number>(1001);
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load locations on mount
  useEffect(() => {
    getLocations().then((data) => {
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

  const selectedDivObj = locations.find((d) => d.id === divisionId);
  const availableDistricts = selectedDivObj ? selectedDivObj.districts : [];
  const selectedDistObj = availableDistricts.find((d) => d.id === districtId);
  const availableUpazilas = selectedDistObj ? selectedDistObj.upazilas : [];

  // NID Auto-fill Simulation
  const handleNidExtract = () => {
    if (!nidNumber || nidNumber.length < 10) {
      alert('সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন');
      return;
    }
    setIsExtractingNid(true);
    setTimeout(() => {
      setIsExtractingNid(false);
      if (!nidName) {
        setNidName(role === 'farmer' ? 'মোঃ কাশেম আলী' : role === 'agent' ? 'আতাউর রহমান' : 'আলহাজ্ব আব্দুর রহিম');
      }
    }, 1000);
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) {
      setErrorMessage('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidName || nidName.trim().length < 3) {
      setErrorMessage('এনআইডি অনুযায়ী আপনার পুরো নাম লিখুন');
      return;
    }
    if (!nidNumber || nidNumber.trim().length < 10) {
      setErrorMessage('সঠিক এনআইডি নম্বর দিন');
      return;
    }
    setErrorMessage(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await registerUser({
      role,
      phone,
      password,
      nidName,
      nidNumber,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      divisionId,
      districtId,
      upazilaId,
      address,
    });

    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      return;
    }

    setStep(4);
  };

  const handleProceedToDashboard = () => {
    if (role === 'farmer') router.push('/account');
    else if (role === 'arathdar') router.push('/browse');
    else if (role === 'agent') router.push('/admin');
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-3">
        
        {/* Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform mx-auto">
            <Store className="w-7 h-7" />
          </div>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          নতুন একাউন্ট নিবন্ধন (রেজিস্ট্রেশন)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          কৃষক, এজেন্ট ও আড়তদারদের জন্য সরাসরি জাতীয় পরিচয়পত্র (NID) ভিত্তিক সহজ রেজিস্ট্রেশন
        </p>

        {/* STEP PROGRESS BAR */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? 'w-10 bg-brand-600'
                  : s < step
                  ? 'w-6 bg-emerald-500'
                  : 'w-6 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80 space-y-6">
          
          {/* STEP 1: ROLE & ACCOUNT CREDENTIALS */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-6">
              <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black">১</span>
                  <span>ভূমিকা ও মোবাইল নম্বর</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">ধাপ ১ / ৩</span>
              </div>

              {/* Role Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">আপনার ভূমিকা নির্বাচন করুন *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'farmer', title: 'কৃষক', desc: 'উৎপাদক', icon: User },
                    { id: 'agent', title: 'এজেন্ট', desc: 'সংগ্রাহক', icon: Briefcase },
                    { id: 'arathdar', title: 'আড়তদার', desc: 'ডিলার/পাইকার', icon: StoreIcon },
                  ].map((r) => {
                    const isSelected = role === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id as UserRole)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-50 border-brand-600 text-brand-700 font-bold shadow-sm ring-2 ring-brand-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold">{r.title}</span>
                        <span className="text-[10px] text-slate-400">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  পাসওয়ার্ড তৈরি করুন *
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন"
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

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-4 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>পরবর্তী ধাপ (এনআইডি তথ্য)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 2: NID & SELFIE PHOTO VERIFICATION */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-6">
              <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black">২</span>
                  <span>এনআইডি (NID) ও ছবি ভেরিফিকেশন</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">ধাপ ২ / ৩</span>
              </div>

              {/* NID Number */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  জাতীয় পরিচয়পত্র (NID) নম্বর *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FileText className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="১০ বা ১৭ ডিজিটের NID নম্বর"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleNidExtract}
                    disabled={isExtractingNid}
                    className="px-3.5 py-3 bg-brand-50 hover:bg-brand-100 border border-brand-300 text-brand-800 text-xs font-bold rounded-xl transition-all whitespace-nowrap"
                  >
                    {isExtractingNid ? 'যাচাই হচ্ছে...' : 'স্বয়ংক্রিয় তথ্য আনুন'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  আপনার এনআইডি কার্ডের ১৭ বা ১০ ডিজিটের স্মার্ট কার্ড নম্বর লিখুন
                </p>
              </div>

              {/* NID Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  এনআইডি অনুযায়ী আপনার পুরো নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ কাশেম আলী"
                  value={nidName}
                  onChange={(e) => setNidName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              {/* Photo / Avatar Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  নিজের ছবি / সেলফি (Own Image Photo)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="ছবি লিঙ্ক (https://...)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 px-4 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>পরবর্তী (ঠিকানা)</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: LOCATION & ADDRESS */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-black">৩</span>
                  <span>অবস্থান ও বিস্তারিত ঠিকানা</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">ধাপ ৩ / ৩</span>
              </div>

              {/* Location Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">বিভাগ *</label>
                  <select
                    value={divisionId}
                    onChange={(e) => {
                      const dId = Number(e.target.value);
                      setDivisionId(dId);
                      const div = locations.find((d) => d.id === dId);
                      if (div && div.districts.length > 0) {
                        setDistrictId(div.districts[0].id);
                        if (div.districts[0].upazilas.length > 0) {
                          setUpazilaId(div.districts[0].upazilas[0].id);
                        }
                      }
                    }}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {locations.map((div) => (
                      <option key={div.id} value={div.id}>{div.nameBn} ({div.nameEn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">জেলা *</label>
                  <select
                    value={districtId}
                    onChange={(e) => {
                      const distId = Number(e.target.value);
                      setDistrictId(distId);
                      const dist = availableDistricts.find((d) => d.id === distId);
                      if (dist && dist.upazilas.length > 0) {
                        setUpazilaId(dist.upazilas[0].id);
                      }
                    }}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {availableDistricts.map((dist) => (
                      <option key={dist.id} value={dist.id}>{dist.nameBn} ({dist.nameEn})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">উপজেলা *</label>
                  <select
                    value={upazilaId}
                    onChange={(e) => setUpazilaId(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {availableUpazilas.map((up) => (
                      <option key={up.id} value={up.id}>{up.nameBn} ({up.nameEn})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed Address */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  গ্রাম/বাজার/আড়তের স্থান (বিস্তারিত ঠিকানা)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: মহাস্থানগড় পাইকারি বাজার রোড, শিবগঞ্জ..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-slate-100 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><span className="animate-spin">⏳</span><span>নিবন্ধন হচ্ছে...</span></>
                  ) : (
                    <><Sparkles className="w-5 h-5" /><span>সম্পূর্ণ করুন</span></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: REGISTRATION SUCCESS & 1-DAY KYC NOTICE */}
          {step === 4 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                একাউন্ট সফলভাবে তৈরি হয়েছে!
              </h2>

              {/* 1-DAY KYC NOTICE BANNER */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>১ দিনে কেওয়াইসি (KYC) যাচাই নোটিশ</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  আপনার এনআইডি ({nidNumber}) এবং তথ্য জমা নেওয়া হয়েছে। আগামী <strong>১ কর্মদিবসের (24 Hours)</strong> মধ্যে আমাদের ভেরিফিকেশন টিম আপনার তথ্য যাচাই করে ড্যাশবোর্ডে সবুজ টিক চিহ্নের ব্লু-ব্যাজ সচল করবে।
                </p>
              </div>

              <button
                onClick={handleProceedToDashboard}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-6 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <span>আপনার ড্যাশবোর্ডে প্রবেশ করুন</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Link back to login */}
          {step < 4 && (
            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              <span>ইতিমধ্যে একাউন্ট আছে? </span>
              <Link href="/login" className="text-brand-700 font-bold hover:underline">
                এখানে লগইন করুন
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
