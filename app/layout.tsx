import type { Metadata } from 'next';
import { Hind_Siliguri, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import KycNoticeBanner from '@/components/KycNoticeBanner';
import BottomNav from '@/components/BottomNav';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'আমার আড়ত (Amar Aroth) - Agricultural Supply Index Bangladesh',
  description: 'বাংলাদেশের ৬৪ জেলায় তাজা কৃষি পণ্যের সরাসরি সরবরাহ সূচক। সরাসরি কৃষকের সাথে যোগাযোগ করুন। Find fresh agricultural supply across Bangladesh — connect directly with farmers, egg producers, potato growers, and fish farmers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" data-scroll-behavior="smooth" className={`h-full ${hindSiliguri.variable} ${inter.variable}`}>
      <body className="h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <KycNoticeBanner />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </body>
    </html>
  );
}
