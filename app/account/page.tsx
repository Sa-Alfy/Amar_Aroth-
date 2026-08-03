'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INITIAL_LISTINGS, SupplyListing, ListingStatus } from '@/lib/mockData';
import { User, Package, Eye, PhoneCall, CheckCircle2, PlusCircle, AlertCircle, Edit3, Trash2 } from 'lucide-react';

export default function AccountPage() {
  const [userListings, setUserListings] = useState<SupplyListing[]>(INITIAL_LISTINGS);
  const [filterRole, setFilterRole] = useState<'farmer' | 'dealer'>('farmer');

  // Status toggle handler
  const handleStatusChange = (listingId: string, newStatus: ListingStatus) => {
    setUserListings((prev) =>
      prev.map((item) => (item.id === listingId ? { ...item, status: newStatus } : item))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* User Profile Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-brand-600/30">
              HR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Hafizur Rahman (হাফিজুর রহমান)</h1>
                <CheckCircle2 className="w-5 h-5 text-brand-600 fill-brand-100" />
              </div>
              <p className="text-xs text-slate-500 font-mono">+880 1711-987654 • Shibganj, Bogra</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-brand-100 text-brand-800 font-semibold px-2.5 py-0.5 rounded-full border border-brand-200">
                  Verified Producer
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Member since Aug 2026
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/post-supply"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Supply</span>
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block uppercase font-medium">Total Supply Listings</span>
            <span className="text-2xl font-black text-slate-900">{userListings.length}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block uppercase font-medium">Total Index Views</span>
            <span className="text-2xl font-black text-slate-900">
              {userListings.reduce((sum, item) => sum + item.viewCount, 0)}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block uppercase font-medium">Dealer Phone Reveals</span>
            <span className="text-2xl font-black text-brand-700">
              {userListings.reduce((sum, item) => sum + item.contactCount, 0)}
            </span>
          </div>
        </div>

        {/* INVENTORY MANAGEMENT TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">My Inventory Stock Manager</h2>
            <span className="text-xs text-slate-500">Update status as dealers contact you</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Commodity / Title</th>
                  <th className="p-4">Quantity & Price</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Views / Calls</th>
                  <th className="p-4">Current Lifecycle Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {userListings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Title */}
                    <td className="p-4 font-semibold text-slate-900">
                      <div className="line-clamp-1">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.categoryNameBn} • Available {item.availableFrom}</div>
                    </td>

                    {/* Quantity & Price */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.quantity.toLocaleString()} {item.unitSymbolBn}</div>
                      <div className="text-brand-700 font-semibold">৳{item.expectedPricePerUnit.toLocaleString()} /{item.unitSymbolBn}</div>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-slate-600">
                      {item.upazilaNameBn}, {item.districtNameBn}
                    </td>

                    {/* Metrics */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                          {item.viewCount}
                        </span>
                        <span className="flex items-center gap-1 text-brand-700 font-bold">
                          <PhoneCall className="w-3.5 h-3.5" />
                          {item.contactCount}
                        </span>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ListingStatus)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold focus:outline-none ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'negotiating'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : item.status === 'reserved'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="active">Live (সচল)</option>
                        <option value="negotiating">Negotiating (আলোচনাধীন)</option>
                        <option value="reserved">Reserved (সংরক্ষিত)</option>
                        <option value="sold">Sold Out (বিক্রিত)</option>
                        <option value="expired">Expired (মেয়াদউত্তীর্ণ)</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this listing?')) {
                            setUserListings((prev) => prev.filter((i) => i.id !== item.id));
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
