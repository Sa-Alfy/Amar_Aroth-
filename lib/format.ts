/**
 * Bangla number, currency and date formatting.
 *
 * Every user-facing number in the product goes through this module. Nothing
 * calls toLocaleString directly — `toLocaleString('bn-BD')` silently falls back
 * to Latin digits on runtimes built without full ICU, which is how the same
 * price ended up rendering as ৳২৪,০০০ on a card and ৳24,000 in the modal.
 * The digit mapping and grouping here are explicit, so they cannot drift.
 */

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

/** Maps ASCII digits to Bangla. Leaves every other character untouched. */
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)]);
}

/**
 * Bangladeshi (lakh/crore) grouping: 2,40,000 — not 240,000.
 * Done by hand rather than via Intl so the result is identical everywhere.
 */
function groupBengaliStyle(digits: string): string {
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
}

function formatNumberParts(value: number, maximumFractionDigits: number): string {
  if (!Number.isFinite(value)) return '০';

  const negative = value < 0;
  const absolute = Math.abs(value);
  const rounded = maximumFractionDigits > 0
    ? absolute.toFixed(maximumFractionDigits).replace(/\.?0+$/, '')
    : Math.round(absolute).toString();

  const [integerPart, fractionPart] = rounded.split('.');
  const grouped = groupBengaliStyle(integerPart);
  const joined = fractionPart ? `${grouped}.${fractionPart}` : grouped;

  return `${negative ? '-' : ''}${toBanglaDigits(joined)}`;
}

/** A plain number in Bangla digits: ১,২৩,৪৫৬ */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return formatNumberParts(value, maximumFractionDigits);
}

/** Currency: ৳২,৪০০ */
export function formatTaka(amount: number, maximumFractionDigits = 0): string {
  return `৳${formatNumberParts(amount, maximumFractionDigits)}`;
}

/** Rate with its unit: ৳২,৪০০/মণ */
export function formatRate(amount: number, unitBn: string): string {
  return `${formatTaka(amount)}/${unitBn}`;
}

/** Quantity with its unit: ৪০ মণ. Fractional quantities keep up to 2 places. */
export function formatQty(quantity: number, unitBn: string): string {
  return `${formatNumberParts(quantity, 2)} ${unitBn}`;
}

/** Bare counts — views, calls: ১২ */
export function formatCount(value: number): string {
  return formatNumberParts(value, 0);
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDate(value: string | number | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // 'YYYY-MM-DD' parses as UTC midnight, which renders a day early anywhere
  // behind UTC. available_from is a calendar date, so read it as local.
  if (typeof value === 'string') {
    const parts = DATE_ONLY.exec(value.trim());
    if (parts) {
      const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Absolute date: ১৬ আগস্ট ২০২৬ */
export function formatDate(value: string | number | Date): string {
  const date = toDate(value);
  if (!date) return '';
  return `${toBanglaDigits(date.getDate())} ${BANGLA_MONTHS[date.getMonth()]} ${toBanglaDigits(date.getFullYear())}`;
}

/**
 * Freshness: ৩ ঘণ্টা আগে. Falls back to an absolute date past a month, where
 * "৫ সপ্তাহ আগে" stops being useful.
 *
 * `now` is injectable so a server-rendered page can pass its own timestamp and
 * avoid a hydration mismatch against the client clock.
 */
export function formatRelativeTime(value: string | number | Date, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return '';

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return formatDate(date);
  if (seconds < 60) return 'এইমাত্র';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${toBanglaDigits(minutes)} মিনিট আগে`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toBanglaDigits(hours)} ঘণ্টা আগে`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${toBanglaDigits(days)} দিন আগে`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${toBanglaDigits(weeks)} সপ্তাহ আগে`;

  return formatDate(date);
}
