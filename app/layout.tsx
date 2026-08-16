import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import KycNoticeBanner from '@/components/KycNoticeBanner';
import BottomNav from '@/components/BottomNav';

/**
 * Type is self-hosted from /public/fonts and declared in globals.css.
 * There is deliberately no next/font/google here — the build must never
 * reach the network for type. next/font/local is also unused because it
 * cannot split one family across per-subset unicode-ranges, which is what
 * keeps a Bangla-only screen from downloading the Latin files.
 */
export const metadata: Metadata = {
  title: 'আমার আড়ত — বাংলাদেশের পাইকারি কৃষি দর',
  description:
    'বাংলাদেশের ৬৪ জেলার আড়ত থেকে আজকের পাইকারি দর। আলু, পেঁয়াজ, ধান, ডিম ও মাছের সরবরাহ ও চাহিদা এক জায়গায়।',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" data-scroll-behavior="smooth" className="h-full">
      <head>
        {/* Only the two faces used above the fold. The Latin cuts and the
            semibold load on demand via unicode-range. */}
        <link
          rel="preload"
          href="/fonts/anek-board-bengali.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/anek-body-bengali.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="h-full flex flex-col bg-paper text-ink antialiased">
        <Navbar />
        <KycNoticeBanner />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer className="hidden md:block" />
        <BottomNav />
      </body>
    </html>
  );
}
