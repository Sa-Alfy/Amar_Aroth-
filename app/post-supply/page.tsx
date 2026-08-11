'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, MEASUREMENT_UNITS, BANGLADESH_LOCATIONS, INITIAL_LISTINGS, SupplyListing, Category, MeasurementUnit, LocationDivision } from '@/lib/mockData';
import { getCategories, getMeasurementUnits, getLocations, createSupplyListing, isSupabaseConfigured } from '@/lib/api/listings';
import { getStoredUser, UserProfile } from '@/lib/api/auth';
import { PlusCircle, Sparkles, CheckCircle2, ArrowRight, Upload, Image as ImageIcon, MapPin, Tag, Package, Info, Lock, Clock, ShieldAlert } from 'lucide-react';

export default function PostSupplyPage() {
  const router = useRouter();

  // Dynamic form options (loaded from Supabase, fall back to mock)
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>(MEASUREMENT_UNITS);
  const [locations, setLocations] = useState<LocationDivision[]>(BANGLADESH_LOCATIONS);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number | ''>(5);
  const [unitId, setUnitId] = useState<number>(2);
  const [expectedPrice, setExpectedPrice] = useState<number | ''>(24000);
  const [divisionId, setDivisionId] = useState<number>(1);
  const [districtId, setDistrictId] = useState<number>(101);
  const [upazilaId, setUpazilaId] = useState<number>(1001);
  const [unionName, setUnionName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerType, setSellerType] = useState<'farmer' | 'aggregator' | 'cooperative'>('farmer');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Load dynamic form options from Supabase on mount & load user
  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    if (user) {
      if (user.fullName) setSellerName(user.fullName);
      if (user.phone) setSellerPhone(user.phone);
    }

    getCategories().then((data) => {
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    });
    getMeasurementUnits().then((data) => {
      setMeasurementUnits(data);
      if (data.length > 0) setUnitId(data[0].id);
    });
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

  // Available districts based on selected division
  const selectedDivObj = locations.find((d) => d.id === divisionId);
  const availableDistricts = selectedDivObj ? selectedDivObj.districts : [];
  
  // Available upazilas
  const selectedDistObj = availableDistricts.find((d) => d.id === districtId);
  const availableUpazilas = selectedDistObj ? selectedDistObj.upazilas : [];

  const handleInstantPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !quantity || !expectedPrice || !sellerName || !sellerPhone) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    if (isSupabaseConfigured()) {
      // Save to Supabase — use sellerPhone as the temporary user ID for demo
      // In production this would be the authenticated user's UUID
      const DEMO_SELLER_ID = '11111111-1111-1111-1111-111111111111';
      const result = await createSupplyListing({
        sellerId: DEMO_SELLER_ID,
        createdByUserId: DEMO_SELLER_ID,
        categoryId,
        title,
        description,
        quantity: Number(quantity),
        unitId,
        expectedPrice: Number(expectedPrice),
        divisionId,
        districtId,
        upazilaId,
        specificLocation: unionName || undefined,
        imageUrls: imageUrls.filter((u) => u.trim().length > 0),
      });

      if (!result.success) {
        setSubmitError(result.error || 'Failed to publish listing. Please try again.');
        setIsSubmitting(false);
        return;
      }
    } else {
      // Demo fallback: prepend to in-memory mock list
      const catObj = categories.find((c) => c.id === categoryId);
      const unitObj = measurementUnits.find((u) => u.id === unitId);
      const newListing: SupplyListing = {
        id: `lst-${Date.now()}`,
        createdByUserId: 'usr-farmer-current',
        ownerUserId: 'usr-farmer-current',
        sellerName,
        sellerPhone,
        isSellerVerified: true,
        sellerType,
        categoryId,
        categoryNameEn: catObj?.nameEn || 'Commodity',
        categoryNameBn: catObj?.nameBn || 'পণ্য',
        title,
        description,
        quantity: Number(quantity),
        unitId,
        unitSymbol: unitObj?.symbol || 'kg',
        unitSymbolBn: unitObj?.nameBn || 'কেজি',
        expectedPricePerUnit: Number(expectedPrice),
        currency: 'BDT',
        divisionId,
        divisionNameEn: selectedDivObj?.nameEn || 'Division',
        districtId,
        districtNameEn: selectedDistObj?.nameEn || 'District',
        districtNameBn: selectedDistObj?.nameBn || 'জেলা',
        upazilaId,
        upazilaNameEn: availableUpazilas.find((u) => u.id === upazilaId)?.nameEn || 'Upazila',
        upazilaNameBn: availableUpazilas.find((u) => u.id === upazilaId)?.nameBn || 'উপজিলা',
        unionName,
        status: 'active',
        images: imageUrls.filter((u) => u.trim()).length > 0
          ? imageUrls.filter((u) => u.trim())
          : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'],
        availableFrom: new Date().toISOString().split('T')[0],
        viewCount: 1,
        contactCount: 0,
        createdAt: new Date().toISOString(),
      };
      INITIAL_LISTINGS.unshift(newListing);
    }

    setIsSubmitting(false);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 relative">
      {/* ─── KYC GATE LOCK OVERLAY FOR UNVERIFIED USERS ─── */}
      {currentUser && currentUser.kycStatus !== 'verified' && (
        <div className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full mb-2">
                ⏳ এনআইডি (KYC) যাচাই প্রক্রিয়াধীন
              </span>
              <h2 className="text-xl font-black text-slate-900">পণ্য পোস্ট বন্ধ রয়েছে</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                আপনার এনআইডি ({currentUser.nidNumber || 'NID'}) অনুমোদন প্রক্রিয়াধীন রয়েছে। আগামী <strong>২৪ ঘণ্টার মধ্যে</strong> ভেরিফিকেশন সম্পন্ন হলে আপনি সরাসরি পণ্য পোস্ট করতে পারবেন।
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>আপনি সমস্ত পণ্যের পোস্ট ও বাজার দর দেখতে পারবেন</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-bold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>অনুমোদনের পর আনলিমিটেড পোস্ট করার সুবিধা পাবেন</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => router.push('/browse')}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>🌾 পণ্যের বাজারে ফিরে যান (Browse)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2"
              >
                অন্য একাউন্টে লগইন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>তাৎক্ষণিক সরাসরি পোস্ট</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            কৃষি পণ্যের পোস্ট যুক্ত করুন
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            পণ্য নিবন্ধনের সাথে সাথে আপনার পোস্ট সচল হয়ে যাবে। দেশের বড় পাইকারি ব্যবসায়ীরা সরাসরি আপনাকে ফোন দিতে পারবে।
          </p>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={handleInstantPublish} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
          
          {/* SECTION 1: PRODUCER & SELLER IDENTITIES */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">১</span>
              <span>বিক্রেতার তথ্য</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">আপনার নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ হাফিজুর রহমান"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: ০১৭১১-৯ODEC"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">আপনার পরিচয়</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'farmer', label: 'কৃষক' },
                  { value: 'aggregator', label: 'স্থানীয় সংগ্রাহক' },
                  { value: 'cooperative', label: 'সমবায়' }
                ].map((st) => (
                  <button
                    type="button"
                    key={st.value}
                    onClick={() => setSellerType(st.value as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium ${
                      sellerType === st.value
                        ? 'bg-brand-50 border-brand-600 text-brand-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: COMMODITY & DETAILS */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">২</span>
              <span>পণ্যের বিবরণ ও তথ্য</span>
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">ক্যাটাগরি নির্বাচন করুন *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      categoryId === cat.id
                        ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs">{cat.nameBn}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">পোস্টের শিরোনাম / নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: ৫ টন প্রিমিয়াম বগুড়া আলুর লট"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">পরিমাণ *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: ৫০০০"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">পরিমাপের একক *</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                >
                  {measurementUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.nameBn} ({u.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">আকাঙ্ক্ষিত দর (টাকা) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: ২৪০০০"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">বিস্তারিত বিবরণ</label>
              <textarea
                rows={3}
                placeholder="গাড়িতে লোড সুবিধা, কোল্ড স্টোরেজ লট নাকি সরাসরি ক্ষেতের ফসল বিস্তারিত লিখুন..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* SECTION 3: LOCATION & PHOTOS */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">৩</span>
              <span>পণ্যের অবস্থান ও ছবি</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {availableUpazilas.map((up) => (
                    <option key={up.id} value={up.id}>{up.nameBn} ({up.nameEn})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">পণ্যের ছবি (ছবি লিঙ্ক)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrls[0] || ''}
                  onChange={(e) => setImageUrls([e.target.value])}
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold py-4 px-6 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <><span className="animate-spin">⏳</span><span>Publishing...</span></>
              ) : (
                <><Sparkles className="w-5 h-5" /><span>Publish Listing Instantly (সরাসরি পোস্ট করুন)</span></>
              )}
            </button>
            {submitError && (
              <p className="text-xs text-red-600 text-center mt-2 font-medium">{submitError}</p>
            )}
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Your listing will go live immediately on the Aaroth Supply Index directory.
            </p>
          </div>

        </form>

      </div>

      {/* SUCCESS MODAL */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-brand-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">পোস্ট সফলভাবে সচল হয়েছে!</h3>
            <p className="text-xs text-slate-600">
              আপনার পণ্যটি সফলভাবে তালিকাভুক্ত করা হয়েছে। দেশের আড়তদার ও পাইকারগণ সরাসরি আপনার নম্বরে যোগাযোগ করতে পারবে।
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push('/browse')}
                className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl font-semibold text-xs"
              >
                সব পণ্য দেখুন
              </button>
              <button
                onClick={() => router.push('/account')}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold text-xs"
              >
                আমার ড্যাশবোর্ড
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
