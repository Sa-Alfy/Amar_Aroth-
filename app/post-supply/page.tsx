'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, MEASUREMENT_UNITS, BANGLADESH_LOCATIONS, INITIAL_LISTINGS, SupplyListing } from '@/lib/mockData';
import { PlusCircle, Sparkles, CheckCircle2, ArrowRight, Upload, Image as ImageIcon, MapPin, Tag, Package, Info } from 'lucide-react';

export default function PostSupplyPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number | ''>(5);
  const [unitId, setUnitId] = useState<number>(2); // Default Ton
  const [expectedPrice, setExpectedPrice] = useState<number | ''>(24000);
  const [divisionId, setDivisionId] = useState<number>(1); // Rajshahi
  const [districtId, setDistrictId] = useState<number>(101); // Bogra
  const [upazilaId, setUpazilaId] = useState<number>(1001); // Shibganj
  const [unionName, setUnionName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerType, setSellerType] = useState<'farmer' | 'aggregator' | 'cooperative'>('farmer');
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
  ]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Available districts
  const selectedDivObj = BANGLADESH_LOCATIONS.find((d) => d.id === divisionId);
  const availableDistricts = selectedDivObj ? selectedDivObj.districts : [];
  
  // Available upazilas
  const selectedDistObj = availableDistricts.find((d) => d.id === districtId);
  const availableUpazilas = selectedDistObj ? selectedDistObj.upazilas : [];

  const handleInstantPublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !quantity || !expectedPrice || !sellerName || !sellerPhone) {
      alert('Please fill in all required fields.');
      return;
    }

    const catObj = CATEGORIES.find((c) => c.id === categoryId);
    const unitObj = MEASUREMENT_UNITS.find((u) => u.id === unitId);

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
      status: 'active', // INSTANT LIVE FEATURE!
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80'],
      availableFrom: new Date().toISOString().split('T')[0],
      viewCount: 1,
      contactCount: 0,
      createdAt: new Date().toISOString()
    };

    // Prepend to mock state for instant validation
    INITIAL_LISTINGS.unshift(newListing);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Instant Live Publishing (সরাসরি সচল)</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Post Agricultural Supply Listing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            পণ্য নিবন্ধনের সাথে সাথে আপনার পোস্ট লাইভ হয়ে যাবে। ঢাকার বড় পাইকারি আড়তদাররা সরাসরি আপনাকে ফোন দিতে পারবে।
          </p>
        </div>

        {/* FORM CONTAINER */}
        <form onSubmit={handleInstantPublish} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
          
          {/* SECTION 1: PRODUCER & SELLER IDENTITIES */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2 border-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">1</span>
              <span>Seller Contact Details (বিক্রেতার তথ্য)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Seller Name (আপনার নাম) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hafizur Rahman"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone (মোবাইল নম্বর) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01711987654"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Seller Category (আপনার পরিচয়)</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'farmer', label: 'Farmer (কৃষক)' },
                  { value: 'aggregator', label: 'Local Aggregator' },
                  { value: 'cooperative', label: 'Cooperative' }
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
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">2</span>
              <span>Crop Category & Specifications (পণ্যের বিবরণ)</span>
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Select Category (ক্যাটাগরি) *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => (
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Listing Headline / Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. 5 Tons Premium Bogra Diamond Potato (৫ টন আলু)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity (পরিমাণ) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Measurement Unit (একক) *</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
                >
                  {MEASUREMENT_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.nameBn} ({u.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Expected Price (আকাঙ্ক্ষিত দর BDT) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 24000"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Description (বিস্তারিত বিবরণ)</label>
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
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs">3</span>
              <span>Crop Location & Photos (অবস্থান ও ছবি)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Division (বিভাগ) *</label>
                <select
                  value={divisionId}
                  onChange={(e) => {
                    const dId = Number(e.target.value);
                    setDivisionId(dId);
                    const div = BANGLADESH_LOCATIONS.find((d) => d.id === dId);
                    if (div && div.districts.length > 0) {
                      setDistrictId(div.districts[0].id);
                      if (div.districts[0].upazilas.length > 0) {
                        setUpazilaId(div.districts[0].upazilas[0].id);
                      }
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {BANGLADESH_LOCATIONS.map((div) => (
                    <option key={div.id} value={div.id}>{div.nameBn} ({div.nameEn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">District (জেলা) *</label>
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Upazila (উপজিলা) *</label>
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

            {/* Photo Uploader Simulation */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Crop Image Preview (ছবির লিঙ্ক)</label>
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
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-6 rounded-xl text-base shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <Sparkles className="w-5 h-5" />
              <span>Publish Listing Instantly (সরাসরি পোস্ট করুন)</span>
            </button>
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
            <h3 className="text-xl font-bold text-slate-900">Listing Published Live!</h3>
            <p className="text-xs text-slate-600">
              আপনার পণ্যটি সফলভাবে সচল করা হয়েছে। ঢাকার আড়তদার ও পাইকারগণ সরাসরি আপনার নম্বরে যোগাযোগ করতে পারবে।
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push('/browse')}
                className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl font-semibold text-xs"
              >
                View on Index
              </button>
              <button
                onClick={() => router.push('/account')}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold text-xs"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
