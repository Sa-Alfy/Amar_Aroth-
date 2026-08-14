'use client';

import React, { useState, useEffect } from 'react';
import { fetchModerationData, moderationAction } from '@/lib/client/api';
import {
  ShieldCheck, UserCheck, UserX, Clock, FileText, Phone, CheckCircle2, XCircle
} from 'lucide-react';

interface KycUser {
  id: string;
  fullName: string;
  phone: string;
  userType: string;
  nidNumber: string | null;
  districtId: number | null;
  upazilaId: number | null;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'kyc'>('kyc');
  const [pendingUsers, setPendingUsers] = useState<KycUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const loadKycQueue = async () => {
    setIsLoading(true);
    setAccessDenied(false);

    try {
      const data = await fetchModerationData('kyc');

      if (data?.success === false && (data?.error === 'Authentication required.' || data?.error === 'Admin access required.')) {
        setAccessDenied(true);
        setPendingUsers([]);
        return;
      }

      if (data?.success === false) {
        setPendingUsers([]);
        return;
      }

      setPendingUsers(Array.isArray(data?.kycUsers) ? data.kycUsers : []);
    } catch {
      setPendingUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKycQueue();
  }, []);

  const handleApproveKyc = async (userId: string) => {
    const result = await moderationAction({ action: 'verify_kyc', userId });
    if (result && result.success !== false) {
      await loadKycQueue();
    }
  };

  const handleRejectKyc = async (userId: string) => {
    const result = await moderationAction({ action: 'reject_kyc', userId });
    if (result && result.success !== false) {
      await loadKycQueue();
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
            <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-slate-900 mb-2">অ্যাক্সেস সীমাবদ্ধ</h1>
            <p className="text-sm text-slate-600">আপনি এই পেজটি দেখতে বা পরিচালনা করতে পারছেন না।</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">আমার আড়ত — অ্যাডমিন ভেরিফিকেশন সেন্টার</h1>
              <p className="text-xs text-slate-400">NID (KYC) অনুমোদন ও পণ্য রিপোর্ট পর্যবেক্ষণ</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('kyc')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'kyc'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>NID ভেরিফিকেশন ({pendingUsers.length})</span>
            </button>
          </div>
        </div>

        {/* ─── KYC VERIFICATION QUEUE ─── */}
        {activeTab === 'kyc' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-base">
                <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                <span>২৪ ঘণ্টার NID (KYC) অনুমোদন তালিকা</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {pendingUsers.length} জন ব্যবহারকারী অনুমোদনের অপেক্ষায়
              </span>
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <Clock className="w-10 h-10 text-amber-500 animate-pulse mx-auto" />
                <p className="font-black text-slate-900 text-base">লোড হচ্ছে...</p>
              </div>
            ) : pendingUsers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-3 max-w-xl">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                          u.userType === 'farmer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.userType === 'agent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.userType === 'farmer' ? '🌾 কৃষক' : u.userType === 'agent' ? '💼 এজেন্ট' : '🏪 আড়তদার'}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">আইডি: {u.id}</span>
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 text-lg">{u.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1 font-mono font-bold">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />{u.phone}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />NID: <strong>{u.nidNumber || 'প্রদান করা হয়নি'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                      <button
                        onClick={() => handleRejectKyc(u.id)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 px-4 py-3 rounded-2xl text-xs font-bold transition-all border border-slate-200"
                      >
                        <UserX className="w-4 h-4 text-red-500" />
                        <span>বাতিল করুন</span>
                      </button>

                      <button
                        onClick={() => handleApproveKyc(u.id)}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-brand-600/30 hover:scale-[1.02]"
                      >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>অনুমোদন ও ভেরিফাই (Approve)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-black text-slate-900 text-base">এই মুহূর্তে কোনো নতুন KYC অনুরোধ নেই।</p>
                <p className="text-xs text-slate-400">নতুন ব্যবহারকারীদের NID যাচাইকরণ সম্পন্ন হলে এখানে দেখা যাবে।</p>
              </div>
            )}
          </div>
        )}

        {/* PHOTO LIGHTBOX MODAL */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <div className="relative bg-white rounded-3xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-2">
                <p className="text-sm font-bold text-slate-900">{selectedPhoto.title}</p>
                <button onClick={() => setSelectedPhoto(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="h-96 rounded-2xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPhoto.url} alt="NID Preview" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
