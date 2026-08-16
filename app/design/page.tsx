import type { Metadata } from 'next';
import { formatTaka, formatQty, formatRelativeTime, formatCount, formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'ডিজাইন টোকেন — আমার আড়ত',
  robots: { index: false, follow: false },
};

/** Fixed so the page renders identically at build time and on every request. */
const NOW = new Date('2026-08-16T18:00:00+06:00');
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3600_000);

const PALETTE = [
  { group: 'ভিত্তি', items: [
    { token: 'paper', hex: '#EEF0EA', note: 'পাতার জমিন', on: 'ink', ratio: '15.37:1' },
    { token: 'paper-raised', hex: '#F7F8F4', note: 'কার্ডের জমিন', on: 'ink', ratio: '16.4:1' },
    { token: 'rule', hex: '#D8DCD3', note: 'বিভাজক', on: null, ratio: null },
    { token: 'ink', hex: '#141A17', note: 'মূল লেখা', on: null, ratio: null },
    { token: 'ink-muted', hex: '#5A635C', note: 'গৌণ লেখা', on: 'paper', ratio: '5.42:1' },
  ]},
  { group: 'বোর্ড', items: [
    { token: 'board', hex: '#1D2C24', note: 'দর বোর্ড', on: null, ratio: null },
    { token: 'board-soft', hex: '#2A3B32', note: 'বোর্ডের সারি', on: null, ratio: null },
    { token: 'chalk', hex: '#F2EFE4', note: 'চকের অঙ্ক', on: 'board', ratio: '12.69:1' },
    { token: 'chalk-dim', hex: '#A8B0A2', note: 'বোর্ডের গৌণ লেখা', on: 'board', ratio: '6.53:1' },
  ]},
  { group: 'বেচছি — প্রধান', items: [
    { token: 'becha', hex: '#17458C', note: 'বিক্রয়, শহরমুখী', on: 'white', ratio: '9.27:1' },
    { token: 'becha-ink', hex: '#0F2F63', note: 'চাপা অবস্থা', on: 'white', ratio: '13.1:1' },
    { token: 'becha-wash', hex: '#E7EDF7', note: 'হালকা জমিন', on: null, ratio: null },
  ]},
  { group: 'কিনছি — গৌণ', items: [
    { token: 'kena', hex: '#215C42', note: 'ক্রয়, মাঠমুখী', on: 'white', ratio: '7.85:1' },
    { token: 'kena-ink', hex: '#17402E', note: 'চাপা অবস্থা', on: 'white', ratio: '10.6:1' },
    { token: 'kena-wash', hex: '#E6EFEA', note: 'হালকা জমিন', on: null, ratio: null },
  ]},
  { group: 'চাহিদা ও বাধা', items: [
    { token: 'chahida', hex: '#B4241C', note: 'চাহিদা পোস্ট, বাধা', on: 'white', ratio: '6.54:1' },
    { token: 'chahida-wash', hex: '#FBEAE8', note: 'হালকা জমিন', on: null, ratio: null },
  ]},
];

const BOARD_ROWS = [
  { name: 'আলু',    price: 2400, unit: 'মণ', place: 'মুন্সীগঞ্জ', delta: 80,   at: hoursAgo(2) },
  { name: 'পেঁয়াজ', price: 3100, unit: 'মণ', place: 'পাবনা',      delta: -50,  at: hoursAgo(4) },
  { name: 'ধান',    price: 1350, unit: 'মণ', place: 'নওগাঁ',      delta: 0,    at: hoursAgo(1) },
  { name: 'ডিম',    price: 1180, unit: 'শ',  place: 'কিশোরগঞ্জ',  delta: 25,   at: hoursAgo(6) },
  { name: 'রসুন',   price: 9500, unit: 'মণ', place: 'নাটোর',      delta: -220, at: hoursAgo(9) },
];

/**
 * The arrow is drawn with borders, not the ▲ / ▼ glyphs. U+25B2 and U+25BC sit
 * outside both loaded unicode-ranges, so a glyph would fall back to whatever
 * the device happens to have — unacceptable for the one mark that says whether
 * a rate went up or down.
 */
function Delta({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-chalk-dim">—</span>;
  }
  const up = value > 0;
  const tone = up ? '#7FC79B' : '#E88A80';

  return (
    <span className="inline-flex items-center justify-end gap-1" style={{ color: tone }}>
      <span
        aria-hidden
        className="inline-block w-0 h-0"
        style={{
          borderLeft: '0.28em solid transparent',
          borderRight: '0.28em solid transparent',
          ...(up
            ? { borderBottom: `0.36em solid ${tone}` }
            : { borderTop: `0.36em solid ${tone}` }),
        }}
      />
      <span className="figure">{formatCount(Math.abs(value))}</span>
      <span className="sr-only">{up ? ' টাকা বেড়েছে' : ' টাকা কমেছে'}</span>
    </span>
  );
}

function Section({ n, title, blurb, children }: {
  n: string; title: string; blurb: string; children: React.ReactNode;
}) {
  return (
    <section className="py-10 border-t border-rule first:border-t-0">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="figure text-ink-muted text-sm">{n}</span>
        <h2 className="text-2xl">{title}</h2>
      </div>
      <p className="text-ink-muted text-sm mb-6 max-w-2xl">{blurb}</p>
      {children}
    </section>
  );
}

export default function DesignTokensPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="max-w-4xl mx-auto px-5 py-10">

        <header className="mb-4">
          <h1 className="text-4xl mb-2">ডিজাইন টোকেন</h1>
          <p className="text-ink-muted max-w-2xl">
            কম্পোনেন্ট বানানোর আগে রঙ, অক্ষর ও দর বোর্ড এক পাতায়। সব সংখ্যা{' '}
            <code className="text-becha">lib/format.ts</code> দিয়ে, সব রঙ{' '}
            <code className="text-becha">globals.css</code> থেকে।
          </p>
        </header>

        {/* ── 1. PALETTE ─────────────────────────────────────────────── */}
        <Section
          n="০১"
          title="রঙ"
          blurb="নীল প্রধান, সবুজ গৌণ। লগ-আউট অবস্থায় সব পোস্টই আড়তদারের সরবরাহ, তাই বেচছি-নীল সবচেয়ে বেশি দেখা যায়। সবুজ মাঠমুখী (কিনছি), নীল শহরমুখী (বেচছি) — রঙ মোড বোঝায়, সাজসজ্জা নয়।"
        >
          <div className="space-y-6">
            {PALETTE.map((group) => (
              <div key={group.group}>
                <h3 className="text-sm text-ink-muted mb-2">{group.group}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.items.map((c) => (
                    <div
                      key={c.token}
                      className="flex items-center gap-3 bg-paper-raised border border-rule rounded-lg p-2"
                    >
                      <div
                        className="w-14 h-14 rounded-md shrink-0 border border-rule"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{c.token}</div>
                        <div className="text-ink-muted text-xs">{c.note}</div>
                        <div className="text-ink-muted text-xs figure">{c.hex}</div>
                      </div>
                      {c.ratio && (
                        <div className="text-right shrink-0">
                          <div className="figure text-sm">{c.ratio}</div>
                          <div className="text-[10px] text-ink-muted">{c.on}-এ</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-4">
            সব জোড়া WCAG AA পার করে, বেশিরভাগ AAA। রোদে পড়ার জন্য মাপা।
          </p>
        </Section>

        {/* ── 2. TYPE ────────────────────────────────────────────────── */}
        <Section
          n="০২"
          title="অক্ষর"
          blurb="Anek Bangla, নিজের সার্ভারে রাখা — তিনটি স্ট্যাটিক কাট (৪০০/১০০%, ৬০০/১০০%, ৭০০/৮৫%), মোট ৩৭৩ কিলোবাইট। ভেরিয়েবল ফাইলটি একাই ৪৪৮ কিলোবাইট, তাই কাট বেছে নেওয়া হয়েছে। বিল্ডের সময় কোনো নেটওয়ার্ক ডাকা হয় না।"
        >
          <div className="bg-paper-raised border border-rule rounded-lg divide-y divide-rule">
            {[
              { label: 'display / ৭০০ / ৮৫%', cls: 'display text-4xl', text: 'আজকের পাইকারি দর' },
              { label: 'h2 / ৭০০ / ৮৫%',      cls: 'text-2xl',         text: 'কৃষকের সরবরাহ' },
              { label: 'body / ৪০০ / ১০০%',   cls: 'text-base',        text: 'শিবগঞ্জ, বগুড়া থেকে ৪০ মণ আলু। দর প্রতি মণ ২,৪০০ টাকা।' },
              { label: 'emphasis / ৬০০',      cls: 'text-base font-semibold', text: 'যাচাইকৃত আড়তদার' },
              { label: 'small / ৪০০',         cls: 'text-xs text-ink-muted',  text: '৩ ঘণ্টা আগে হালনাগাদ' },
            ].map((r) => (
              <div key={r.label} className="p-4">
                <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5">{r.label}</div>
                <div className={r.cls}>{r.text}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-becha-wash border border-becha/20 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-1">কেন কোনো হেয়ারলাইন রুল নেই</p>
            <p className="text-ink-muted">
              বাংলা লেখার প্রতিটি শব্দেই মাত্রা আছে — একটা আনুভূমিক রেখা। তার উপরে
              আরেকটা পাতলা রেখা বসালে লিপির সাথে লড়াই হয়। তাই ব্লক আলাদা হয় ফাঁকা
              জায়গা আর জমিনের রঙ দিয়ে, রেখা দিয়ে নয়।
            </p>
          </div>
        </Section>

        {/* ── 3. THE BOARD ───────────────────────────────────────────── */}
        <Section
          n="০৩"
          title="দর বোর্ড"
          blurb="পুরো পণ্যের স্বাক্ষর। একই জিনিস তিন মাপে — সম্পূর্ণ বোর্ড (হোম), একটি সারি (কার্ডের ভেতর দর), আর স্ট্রিপ (কৃষকের আশেপাশের দর)। পণ্যে এটাই একমাত্র গাঢ় জমিন।"
        >
          {/* Full board */}
          <div className="board rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex items-baseline justify-between">
              <h3 className="text-chalk text-xl">আজকের পাইকারি দর</h3>
              <span className="text-chalk-dim text-xs">{formatDate(NOW)}</span>
            </div>

            <div>
              {BOARD_ROWS.map((row, i) => (
                <div
                  key={row.name}
                  className="board-row board-row-in px-4 py-3 grid grid-cols-[1fr_auto_4.5rem] gap-3 items-baseline"
                  style={{ ['--row-index' as string]: i }}
                >
                  <div className="min-w-0">
                    <div className="text-chalk text-lg display">{row.name}</div>
                    <div className="text-chalk-dim text-xs">
                      {row.place} · {formatRelativeTime(row.at, NOW)}
                    </div>
                  </div>
                  {/* Right-aligned fixed column is what guarantees the figures
                      line up, independent of whether the face ships tnum. */}
                  <div className="text-chalk figure text-lg text-right tabular-nums">
                    {formatTaka(row.price)}
                    <span className="text-chalk-dim text-xs font-normal">/{row.unit}</span>
                  </div>
                  <div className="text-right text-sm figure">
                    <Delta value={row.delta} />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 text-chalk-dim text-xs border-t border-chalk/10">
              ৬৪ জেলার আড়ত থেকে, প্রতি ঘণ্টায় হালনাগাদ
            </div>
          </div>

          {/* Board row inside a card */}
          <h3 className="text-sm text-ink-muted mt-8 mb-2">কার্ডের ভেতর — একই সারি, ছোট মাপে</h3>
          <div className="bg-paper-raised border border-rule rounded-xl p-4 max-w-sm">
            <div className="text-lg display mb-0.5">আলু · {formatQty(40, 'মণ')}</div>
            <div className="text-ink-muted text-xs mb-3">শিবগঞ্জ, বগুড়া · {formatRelativeTime(hoursAgo(3), NOW)}</div>
            <div className="board rounded-lg px-3 py-2.5 flex items-baseline justify-between">
              <span className="text-chalk-dim text-xs">প্রতি মণ</span>
              <span className="text-chalk figure text-xl">{formatTaka(2400)}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="bg-becha-wash text-becha-ink px-2 py-0.5 rounded font-semibold">আড়তদার</span>
              <span className="text-ink-muted">যাচাইকৃত</span>
            </div>
          </div>

          {/* Anonymised strip */}
          <h3 className="text-sm text-ink-muted mt-8 mb-2">কৃষকের আশেপাশের দর — নাম নেই, ফোন নেই</h3>
          <div className="bg-paper-raised border border-rule rounded-xl divide-y divide-rule max-w-sm">
            {[
              { c: 'আলু', q: 30, p: 2300, u: 'মণ', place: 'শিবগঞ্জ', at: hoursAgo(5) },
              { c: 'আলু', q: 55, p: 2380, u: 'মণ', place: 'কাহালু',  at: hoursAgo(11) },
            ].map((r, i) => (
              <div key={i} className="p-3 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{r.c} · {formatQty(r.q, r.u)}</div>
                  <div className="text-ink-muted text-xs">{r.place} · {formatRelativeTime(r.at, NOW)}</div>
                </div>
                <div className="figure text-right shrink-0">{formatTaka(r.p)}</div>
              </div>
            ))}
            <p className="p-3 text-center text-xs text-ink-muted bg-paper">শুধু দরের তথ্য</p>
          </div>
        </Section>

        {/* ── 4. MODE SWITCH ─────────────────────────────────────────── */}
        <Section
          n="০৪"
          title="কিনছি | বেচছি"
          blurb="আড়তদারের সবচেয়ে জরুরি নিয়ন্ত্রণ। দুই অবস্থায় আলাদা রঙ, আলাদা ফিড, আলাদা বাটন — এক নজরে ফোন দেখলেই বোঝা যায় কোন মোডে আছেন। নিচে দুটোই পাশাপাশি।"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { mode: 'কিনছি', other: 'বেচছি', tone: 'kena', feed: 'কৃষকের সরবরাহ · ৩৪টি', cta: 'ক্রয়ের চাহিদা দিন' },
              { mode: 'বেচছি', other: 'কিনছি', tone: 'becha', feed: 'দোকানের চাহিদা · ১২টি', cta: 'সরবরাহ পোস্ট করুন' },
            ] as const).map((m) => (
              <div key={m.mode} className="border border-rule rounded-xl overflow-hidden bg-paper-raised">
                <div className={`h-1 ${m.tone === 'kena' ? 'bg-kena' : 'bg-becha'}`} />
                <div className="p-3">
                  <div className="flex rounded-lg overflow-hidden border border-rule">
                    <span className={`flex-1 text-center py-2.5 text-sm font-semibold text-white ${m.tone === 'kena' ? 'bg-kena' : 'bg-becha'}`}>
                      {m.mode}
                    </span>
                    <span className="flex-1 text-center py-2.5 text-sm text-ink-muted bg-paper">
                      {m.other}
                    </span>
                  </div>
                  <div className={`mt-3 pl-2.5 border-l-4 ${m.tone === 'kena' ? 'border-kena' : 'border-becha'}`}>
                    <div className="text-sm font-semibold">{m.feed}</div>
                  </div>
                  <div className={`mt-3 text-center text-sm font-semibold text-white py-2.5 rounded-lg ${m.tone === 'kena' ? 'bg-kena' : 'bg-becha'}`}>
                    + {m.cta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. NUMERALS ────────────────────────────────────────────── */}
        <Section
          n="০৫"
          title="সংখ্যা"
          blurb="পুরো পণ্যটাই বাংলা সংখ্যার একটা কলাম চোখ বুলিয়ে পড়া। হাজার-লাখ-কোটি ভাগ, ICU bn-BD-এর সাথে ১৮টি মানে হুবহু মিলিয়ে যাচাই করা। ২,৪০,০০০ — ২৪০,০০০ নয়।"
        >
          <div className="bg-board rounded-xl p-4">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 max-w-sm">
              {[24000, 240000, 1234567, 9500, 2400, 100].map((v) => (
                <div key={v} className="contents">
                  <span className="text-chalk-dim text-sm self-baseline">{v}</span>
                  <span className="figure text-chalk text-xl text-right tabular-nums self-baseline">
                    {formatTaka(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 bg-chahida-wash border border-chahida/25 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-1">মেপে দেখা হয়েছে: বাংলা অঙ্কে tnum কাজ করে না</p>
            <p className="text-ink-muted">
              Anek Bangla-তে <code>tnum</code> শুধু ল্যাটিন অঙ্কে কাজ করে। বাংলা ০-৯
              এর প্রস্থ আলাদাই থাকে — ৪০px-এ ১১১১১ আর ০০০০০ এর মধ্যে ৫px তফাত, ফিচার
              চালু থাকুক বা না থাকুক। তাই মিলটা ফন্ট থেকে আসে না, আসে ডান দিকে মেলানো
              নির্দিষ্ট-প্রস্থের গ্রিড কলাম থেকে — যা যেকোনো ফন্টে কাজ করে। উপরের
              বোর্ডের প্রতিটি দর একই ডান-প্রান্তে শেষ হয়।
            </p>
          </div>
        </Section>

        {/* ── 6. MOTION ──────────────────────────────────────────────── */}
        <Section
          n="০৬"
          title="নড়াচড়া"
          blurb="একটিই সাজানো মুহূর্ত — পাতা খুললে বোর্ডের সারিগুলো ৬০ মিলিসেকেন্ড পর পর উঠে আসে, যেন দর লেখা হচ্ছে। উপরের বোর্ডে সেটাই চলছে। বাকি সব স্থির।"
        >
          <div className="bg-paper-raised border border-rule rounded-lg p-4 text-sm space-y-2">
            <p>
              <span className="font-semibold">আগে ছিল না:</span>{' '}
              <code>animate-in</code>, <code>fade-in</code>,{' '}
              <code>slide-in-from-bottom</code>, <code>zoom-in-95</code>,{' '}
              <code>animate-fade-in</code> — পাঁচটি ক্লাস পাঁচটি ফাইলে ব্যবহার হচ্ছিল,
              কোনো প্লাগইন ইনস্টল করা ছিল না, তাই প্রতিটি নিঃশব্দে কিছুই করত না।
            </p>
            <p>
              এখন হাতে লেখা keyframes দিয়ে সেগুলো সত্যি কাজ করে — নতুন কোনো
              ডিপেনডেন্সি ছাড়াই। <code>prefers-reduced-motion</code> মানা হয়।
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
}
