'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchModerationData, moderationAction } from '@/lib/client/api';
import {
  ShieldCheck, UserX, Clock, FileText, Phone, CheckCircle2, XCircle,
  MapPin, Copy, Check, ImageOff, AlertTriangle, RotateCcw, Ban, Users, Calendar,
} from 'lucide-react';

type KycStatus = 'pending' | 'verified' | 'rejected';

interface KycUser {
  id: string;
  fullName: string;
  phone: string;
  userType: string;
  nidNumber: string | null;
  address: string | null;
  districtName: string | null;
  upazilaName: string | null;
  riskScore: number;
  isVerified: boolean;
  nidVerified: boolean;
  kycStatus: KycStatus;
  createdAt: string;
  nidFrontImageUrl: string | null;
  nidBackImageUrl: string | null;
  hasDocuments: boolean;
}

const USER_TYPE_LABEL: Record<string, string> = {
  farmer: '🌾 কৃষক',
  arathdar: '🏪 আড়তদার',
  dokandar: '🛒 দোকানদার',
  admin: '🛡️ অ্যাডমিন',
};

const STATUS_TABS: { key: KycStatus; label: string }[] = [
  { key: 'pending', label: 'অপেক্ষমাণ' },
  { key: 'verified', label: 'অনুমোদিত' },
  { key: 'rejected', label: 'বাতিল' },
];

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return value.slice(0, 10);
  }
}

/** Copy-to-clipboard chip. An admin reads these values out loud or pastes them into SQL. */
function CopyValue({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure origin or denied permission). The value is
      // on screen either way, so there is nothing to recover from.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label ? `${label} কপি করুন` : 'কপি করুন'}
      className="inline-flex items-center gap-1 text-slate-400 hover:text-brand-700 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/** One NID side. A missing document is shown, never hidden — an empty frame is a reason to refuse. */
function NidThumb({
  url,
  caption,
  onOpen,
}: {
  url: string | null;
  caption: string;
  onOpen: (url: string, title: string) => void;
}) {
  if (!url) {
    return (
      <div className="w-full sm:w-40">
        <div className="h-28 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400">
          <ImageOff className="w-5 h-5" />
          <span className="text-[10px] font-semibold">ছবি নেই</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 text-center">{caption}</p>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-40">
      <button
        type="button"
        onClick={() => onOpen(url, caption)}
        className="block w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-brand-500 hover:shadow-md transition-all"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={caption} className="w-full h-full object-cover" />
      </button>
      <p className="text-[11px] text-slate-500 mt-1 text-center">{caption}</p>
    </div>
  );
}

export default function AdminPage() {
  const [statusTab, setStatusTab] = useState<KycStatus>('pending');
  const [users, setUsers] = useState<KycUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  const loadQueue = useCallback(async (status: KycStatus) => {
    setIsLoading(true);
    setAccessDenied(false);

    try {
      const data = await fetchModerationData('kyc', status);

      if (data?.success === false) {
        if (data?.error === 'Authentication required.' || data?.error === 'Admin access required.') {
          setAccessDenied(true);
        }
        setUsers([]);
        return;
      }

      setUsers(Array.isArray(data?.kycUsers) ? data.kycUsers : []);
    } catch {
      setUsers([]);
      setNotice({ kind: 'error', text: 'তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue(statusTab);
  }, [statusTab, loadQueue]);

  const runAction = async (userId: string, body: Record<string, unknown>, okText: string) => {
    setBusyId(userId);
    setNotice(null);

    const result = await moderationAction({ ...body, userId });

    setBusyId(null);

    if (result && result.success !== false) {
      setNotice({ kind: 'ok', text: okText });
      await loadQueue(statusTab);
    } else {
      setNotice({ kind: 'error', text: result?.error || 'কাজটি সম্পন্ন করা যায়নি।' });
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── HEADER ─── */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight">
                  আমার আড়ত — অ্যাডমিন ভেরিফিকেশন সেন্টার
                </h1>
                <p className="text-xs text-slate-400">NID (KYC) যাচাই, ব্যবহারকারীর ধরন ও লিস্টিং নিয়ন্ত্রণ</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-2xl border border-slate-700 text-xs shrink-0">
              <Users className="w-4 h-4 text-brand-400" />
              <span className="font-bold">{users.length}</span>
              <span className="text-slate-400">জন এই তালিকায়</span>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusTab === tab.key
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── NOTICE ─── */}
        {notice && (
          <div
            className={`mb-5 px-4 py-3 rounded-2xl text-sm font-semibold border flex items-start gap-2 ${
              notice.kind === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {notice.kind === 'ok'
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* ─── QUEUE ─── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="font-black text-slate-900 text-base">NID (KYC) তালিকা</span>
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-slate-500 space-y-2">
              <Clock className="w-10 h-10 text-amber-500 animate-pulse mx-auto" />
              <p className="font-black text-slate-900 text-base">লোড হচ্ছে...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-black text-slate-900 text-base">এই তালিকায় কেউ নেই।</p>
              <p className="text-xs text-slate-400">নতুন আবেদন এলে এখানে দেখা যাবে।</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col xl:flex-row xl:items-start gap-6">

                    {/* NID documents */}
                    <div className="flex gap-3 shrink-0">
                      <NidThumb
                        url={u.nidFrontImageUrl}
                        caption="NID সামনের পিঠ"
                        onOpen={(url, title) => setSelectedPhoto({ url, title })}
                      />
                      <NidThumb
                        url={u.nidBackImageUrl}
                        caption="NID পেছনের পিঠ"
                        onOpen={(url, title) => setSelectedPhoto({ url, title })}
                      />
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {USER_TYPE_LABEL[u.userType] || u.userType}
                        </span>

                        <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                          u.kycStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.kycStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.kycStatus === 'verified' ? 'অনুমোদিত' : u.kycStatus === 'rejected' ? 'বাতিল' : 'অপেক্ষমাণ'}
                        </span>

                        {u.riskScore > 0 && (
                          <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                            u.riskScore >= 50 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            ঝুঁকি স্কোর {u.riskScore}
                          </span>
                        )}

                        {!u.hasDocuments && (
                          <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            কাগজপত্র নেই
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 text-lg truncate">{u.fullName}</h3>

                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-mono font-bold">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {u.phone}
                          <CopyValue value={u.phone} label="ফোন নম্বর" />
                        </span>

                        <span className="flex items-center gap-1.5 font-mono">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          NID: <strong className="text-slate-900">{u.nidNumber || 'প্রদান করা হয়নি'}</strong>
                          {u.nidNumber && <CopyValue value={u.nidNumber} label="NID নম্বর" />}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {[u.upazilaName, u.districtName].filter(Boolean).join(', ') || 'অবস্থান নেই'}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          যোগ দিয়েছেন {formatDate(u.createdAt)}
                        </span>

                        {u.address && (
                          <span className="sm:col-span-2 text-slate-500">{u.address}</span>
                        )}

                        <span className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          আইডি: {u.id}
                          <CopyValue value={u.id} label="ব্যবহারকারীর আইডি" />
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 w-full xl:w-56 space-y-2">
                      {u.kycStatus !== 'verified' && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => runAction(u.id, { action: 'verify_kyc' }, 'ব্যবহারকারী অনুমোদিত হয়েছে।')}
                          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-brand-600/30"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>অনুমোদন ও ভেরিফাই</span>
                        </button>
                      )}

                      {u.kycStatus !== 'rejected' && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => runAction(u.id, { action: 'reject_kyc' }, 'আবেদন বাতিল করা হয়েছে।')}
                          className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200"
                        >
                          <UserX className="w-4 h-4 text-red-500" />
                          <span>বাতিল করুন</span>
                        </button>
                      )}

                      {u.kycStatus !== 'pending' && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => runAction(u.id, { action: 'reset_kyc' }, 'আবার অপেক্ষমাণ তালিকায় নেওয়া হয়েছে।')}
                          className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200"
                        >
                          <RotateCcw className="w-4 h-4 text-slate-500" />
                          <span>পুনরায় পর্যালোচনা</span>
                        </button>
                      )}

                      {u.userType !== 'admin' && (
                        <select
                          disabled={busyId === u.id}
                          value={u.userType}
                          onChange={(e) =>
                            runAction(
                              u.id,
                              { action: 'set_user_type', userType: e.target.value },
                              'ব্যবহারকারীর ধরন পরিবর্তন হয়েছে।'
                            )
                          }
                          className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="farmer">কৃষক</option>
                          <option value="arathdar">আড়তদার</option>
                          <option value="dokandar">দোকানদার</option>
                        </select>
                      )}

                      <button
                        disabled={busyId === u.id}
                        onClick={() => {
                          if (!window.confirm(`${u.fullName} এর সব লিস্টিং স্থগিত করবেন? এটি সব ফিড থেকে সরিয়ে দেবে।`)) return;
                          runAction(u.id, { action: 'suspend_listings' }, 'ব্যবহারকারীর লিস্টিং স্থগিত করা হয়েছে।');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:opacity-50 text-slate-600 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        <span>সব লিস্টিং স্থগিত</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── PHOTO LIGHTBOX ─── */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="relative bg-white rounded-3xl max-w-3xl w-full p-4 overflow-hidden shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <p className="text-sm font-bold text-slate-900">{selectedPhoto.title}</p>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  aria-label="বন্ধ করুন"
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[70vh] rounded-2xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPhoto.url} alt={selectedPhoto.title} className="w-full h-full object-contain" />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                লিংকটি ১০ মিনিট পর কাজ করবে না। ছবি ব্যক্তিগত সংরক্ষণাগারে আছে।
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
