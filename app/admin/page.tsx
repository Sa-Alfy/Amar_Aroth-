'use client';

import React, { useState } from 'react';
import { INITIAL_LISTINGS, SupplyListing } from '@/lib/mockData';
import { ShieldCheck, AlertTriangle, CheckCircle, Eye, Trash2, Filter } from 'lucide-react';

interface ReportedItem {
  id: string;
  listing: SupplyListing;
  reporterName: string;
  reason: string;
  notes: string;
  reportedAt: string;
}

export default function AdminPage() {
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
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Reactive Moderation Workspace</h1>
              <p className="text-xs text-slate-400">Post-publishing flagging queue to clean up bad listings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
              {reports.length} Active Flagged Reports
            </span>
          </div>
        </div>

        {/* REACTIVE MODERATION QUEUE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Reported Listings Queue</span>
            </div>
            <span className="text-xs text-slate-500">Dealers report stale or incorrect supply listings</span>
          </div>

          {reports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reports.map((rep) => (
                <div key={rep.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50">
                  
                  {/* Left Specs */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">
                        Reason: {rep.reason}
                      </span>
                      <span className="text-slate-400">Reported by {rep.reporterName} • {rep.reportedAt}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {rep.listing.title}
                    </h3>

                    <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                      <strong>Dealer Note:</strong> "{rep.notes}"
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span>Seller: {rep.listing.sellerName} ({rep.listing.sellerPhone})</span>
                      <span>Location: {rep.listing.districtNameBn}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDismiss(rep.id)}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Dismiss Report</span>
                    </button>

                    <button
                      onClick={() => handleHideListing(rep.id)}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hide & Unpublish</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-900 text-sm">No Pending Reports</p>
              <p className="text-xs">All supply listings on the index are verified and active.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
