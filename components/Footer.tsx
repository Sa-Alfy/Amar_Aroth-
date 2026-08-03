import React from 'react';
import Link from 'next/link';
import { Store, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Store className="w-6 h-6 text-brand-500" />
              <span>Aaroth</span>
              <span className="text-xs bg-slate-800 text-brand-400 px-2 py-0.5 rounded border border-slate-700">আমার আড়ত</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              The Digital Agricultural Supply Index for Bangladesh. Empowering farmers and dealers with transparent supply discovery and direct voice connectivity.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">Marketplace Index</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/browse?category=potato" className="hover:text-white transition-colors">Bogra Potato Stock</Link></li>
              <li><Link href="/browse?category=egg-poultry" className="hover:text-white transition-colors">Gazipur Layer Egg Lots</Link></li>
              <li><Link href="/browse?category=fish" className="hover:text-white transition-colors">Shatkhira Shrimp & Fish</Link></li>
              <li><Link href="/browse?category=rice-paddy" className="hover:text-white transition-colors">Naogaon Miniket Rice</Link></li>
            </ul>
          </div>

          {/* User Guides */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">For Producers & Buyers</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/post-supply" className="hover:text-white transition-colors">Post Supply (Instant Live)</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">Manage Stock Status</Link></li>
              <li><Link href="/browse" className="hover:text-white transition-colors">Search Supply by District</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Report Fake Listing</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">Helpline & Operating Regions</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <span>+880 1700-000000 (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                <span>support@aaroth.com.bd</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>Dhaka Wholesale Hub / Bogra Regional Desk, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Aaroth Inc. All rights reserved. Built for Bangladesh Agriculture.</p>
          <p className="text-[11px] text-slate-500">
            Aaroth is a digital supply discovery index. Transactions are settled directly between buyers and sellers offline.
          </p>
        </div>
      </div>
    </footer>
  );
}
