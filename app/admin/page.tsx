'use client';

import React, { useState, useEffect } from 'react';
import { INITIAL_LISTINGS, SupplyListing } from '@/lib/mockData';
import { getPendingKycUsers, approveUserKyc, rejectUserKyc, UserProfile } from '@/lib/api/auth';
import {
  ShieldCheck, AlertTriangle, CheckCircle, Eye, Trash2, Filter,
  UserCheck, UserX, Clock, FileText, Phone, Camera, CheckCircle2, XCircle
} from 'lucide-react';

interface ReportedItem {
  id: string;
  listing: SupplyListing;
  reporterName: string;
  reason: string;
  notes: string;
  reportedAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'kyc' | 'reports'>('kyc');
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ReportedItem[]>([
    {
      id: 'rep-1',
      listing: INITIAL_LISTINGS[5], // Munshiganj Potato
      reporterName: 'Karwan Bazar Dealer (Motin Miah)',
      reason: 'Wrong Price / Unrealistic Rate',
      notes: 'Market rate is 22 BDT, seller asked 26 BDT and refused to negotiate bulk discount.',
      reportedAt: '2026-08-03 16:40'
    },
    {
      id: 'rep-2',
      listing: INITIAL_LISTINGS[3], // Naogaon Rice
      reporterName: 'Jatrabari Rice Trader',
      reason: 'Already Sold Out',
      notes: 'Called seller on phone, he said stock was sold yesterday but status is still active.',
      reportedAt: '2026-08-03 15:10'
    }
  ]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const loadKycQueue = () => {
    const list = getPendingKycUsers();
    // Default demo items if empty
    if (list.length === 0) {
      setPendingUsers([
        {
          id: 'usr-demo-1',
          phone: '01711998877',
          fullName: 'মোঃ শফিকুল ইসলাম (কৃষক)',
          userType: 'farmer',
          nidNumber: '19922694123000145',
          nidFrontUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
          nidBackUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
          address: 'মহাস্থান বাজার রোড, শিবগঞ্জ, বগুড়া',
          isVerified: false,
          kycStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr-demo-2',
          phone: '01822334455',
          fullName: 'হাজী জহিরুল হক (আড়তদার)',
          userType: 'arathdar',
          nidNumber: '19852694123000888',
          nidFrontUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          nidBackUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
          address: 'যাত্রাবাড়ী পাইকারি আড়ত, ঢাকা',
          isVerified: false,
          kycStatus: 'pending',
          createdAt: new Date().toISOString(),
        }
      ]);
    } else {
      setPendingUsers(list);
    }
  };

  useEffect(() => {
    loadKycQueue();
  }, []);

  const handleApproveKyc = (userId: string) => {
    approveUserKyc(userId);
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRejectKyc = (userId: string) => {
    rejectUserKyc(userId);
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleDismiss = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const handleHideListing = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    alert('Listing has been hidden and unpublished from the directory.');
  };

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

          {/* Tab buttons */}
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
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'reports'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>রিপোর্ট queue ({reports.length})</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: NID KYC VERIFICATION QUEUE ─── */}
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

            {pendingUsers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors">
                    
                    {/* User Specs */}
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
                        {u.address && (
                          <p className="text-xs text-slate-500 mt-1">📍 {u.address}</p>
                        )}
                      </div>

                      {/* NID Photos Preview Thumbnails */}
                      <div className="pt-1 flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">NID ছবি:</span>
                        {u.nidFrontUrl ? (
                          <button
                            onClick={() => setSelectedPhoto({ url: u.nidFrontUrl!, title: `${u.fullName} — NID Front` })}
                            className="group relative w-20 h-12 rounded-xl overflow-hidden border border-slate-200 hover:border-brand-500 transition-all shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u.nidFrontUrl} alt="Front" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">সামনে</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">সামনের ছবি নেই</span>
                        )}

                        {u.nidBackUrl ? (
                          <button
                            onClick={() => setSelectedPhoto({ url: u.nidBackUrl!, title: `${u.fullName} — NID Back` })}
                            className="group relative w-20 h-12 rounded-xl overflow-hidden border border-slate-200 hover:border-brand-500 transition-all shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u.nidBackUrl} alt="Back" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5">পেছনে</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">পেছনের ছবি নেই</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
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
                <p className="font-black text-slate-900 text-base">সকল NID ভেরিফিকেশন সম্পন্ন!</p>
                <p className="text-xs text-slate-400">এই মুহূর্তে কোনো নতুন NID অনুমোদনের অপেক্ষায় নেই।</p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: REPORTED LISTINGS QUEUE ─── */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>রিপোর্ট করা পণ্যের তালিকা</span>
              </div>
              <span className="text-xs text-slate-500">ব্যবসায়ীদের রিপোর্ট করা ভুয়া বা ভুল দামের পণ্য</span>
            </div>

            {reports.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                          কারণ: {rep.reason}
                        </span>
                        <span className="text-slate-400">{rep.reporterName} দ্বারা রিপোর্ট করা • {rep.reportedAt}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{rep.listing.title}</h3>

                      <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                        <strong>ডিলারের মন্তব্য:</strong> "{rep.notes}"
                      </p>

                      <div className="text-xs text-slate-500 flex items-center gap-4">
                        <span>বিক্রেতা: {rep.listing.sellerName} ({rep.listing.sellerPhone})</span>
                        <span>জেলা: {rep.listing.districtNameBn}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleDismiss(rep.id)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>রিপোর্ট বাতিল</span>
                      </button>

                      <button
                        onClick={() => handleHideListing(rep.id)}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>পণ্য মুছে ফেলুন</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-900 text-sm">কোনো পেন্ডিং রিপোর্ট নেই</p>
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
