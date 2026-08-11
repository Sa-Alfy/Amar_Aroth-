import React from 'react';
import Link from 'next/link';
import { Store, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* ব্র্যান্ড পরিচিতি */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Store className="w-6 h-6 text-brand-500" />
              <span>আমার আড়ত</span>
              <span className="text-xs bg-slate-800 text-brand-400 px-2 py-0.5 rounded border border-slate-700">Aaroth</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              বাংলাদেশের কৃষি সরবরাহের ডিজিটাল সূচক। কৃষক ও পাইকারদের সরাসরি সংযুক্ত করি স্বচ্ছ মূল্যে।
            </p>
          </div>

          {/* দ্রুত লিংক */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">পণ্য সূচক</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/browse?category=potato" className="hover:text-white transition-colors">বগুড়ার আলু স্টক</Link></li>
              <li><Link href="/browse?category=egg-poultry" className="hover:text-white transition-colors">গাজীপুরের ডিম লট</Link></li>
              <li><Link href="/browse?category=fish" className="hover:text-white transition-colors">সাতক্ষীরার চিংড়ি ও মাছ</Link></li>
              <li><Link href="/browse?category=rice-paddy" className="hover:text-white transition-colors">নওগাঁর মিনিকেট চাল</Link></li>
            </ul>
          </div>

          {/* ব্যবহারকারী গাইড */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">কৃষক ও ক্রেতার জন্য</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/post-supply" className="hover:text-white transition-colors">পণ্য পোস্ট করুন (তাৎক্ষণিক লাইভ)</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">স্টক স্ট্যাটাস পরিচালনা করুন</Link></li>
              <li><Link href="/browse" className="hover:text-white transition-colors">জেলা অনুযায়ী সরবরাহ খুঁজুন</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">ভুয়া পোস্ট রিপোর্ট করুন</Link></li>
            </ul>
          </div>

          {/* যোগাযোগ */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs tracking-wider uppercase">হেল্পলাইন ও কার্যক্ষেত্র</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <span>+৮৮০ ১৭০০-০০০০০০ (টোল ফ্রি)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                <span>support@aaroth.com.bd</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>ঢাকা পাইকারি হাব / বগুড়া আঞ্চলিক ডেস্ক, বাংলাদেশ</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} আমার আড়ত (Aaroth)। সর্বস্বত্ব সংরক্ষিত। বাংলাদেশ কৃষির জন্য নির্মিত।</p>
          <p className="text-[11px] text-slate-500">
            আমার আড়ত একটি ডিজিটাল সরবরাহ সূচক। লেনদেন ক্রেতা ও বিক্রেতার মধ্যে সরাসরি সম্পন্ন হয়।
          </p>
        </div>
      </div>
    </footer>
  );
}
