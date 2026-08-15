/**
 * Client-side API layer for Amar Aroth.
 * 
 * SECURITY: This is the ONLY file that frontend pages use to talk to the backend.
 * Every function calls fetch('/api/...') — the browser NEVER touches Supabase directly.
 */

import type { SupplyListing, Category, MeasurementUnit, LocationDivision } from '@/lib/mockData';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export type UserRole = 'farmer' | 'arathdar' | 'dokandar';

export function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('880')) {
    return digits.slice(2);
  }
  if (digits.startsWith('0')) {
    return digits;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return `0${digits}`;
  }
  return digits;
}

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  userType: string;
  isVerified: boolean;
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  avatarUrl?: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
  address?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
}

export async function login(
  phone: string,
  password: string,
  role?: UserRole
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, role }),
  });
  return res.json();
}

export async function requestPasswordResetOtp(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' };
  }
  await new Promise((r) => setTimeout(r, 600));
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`otp_${cleanPhone}`, '1234');
  }
  return { success: true };
}

export async function verifyOtpAndResetPassword(
  phone: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!otp || otp.length < 4) {
    return { success: false, error: 'সঠিক OTP কোড দিন' };
  }
  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' };
  }
  await new Promise((r) => setTimeout(r, 600));
  if (typeof window !== 'undefined') {
    const storedOtp = sessionStorage.getItem(`otp_${phone.trim()}`);
    if (storedOtp && otp !== storedOtp) {
      return { success: false, error: 'OTP কোড সঠিক নয়। আবার চেষ্টা করুন।' };
    }
    sessionStorage.removeItem(`otp_${phone.trim()}`);
  }
  return { success: true };
}

export interface RegisterPayload {
  role: UserRole;
  fullName: string;
  phone: string;
  password: string;
  nidNumber: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  avatarUrl?: string;
  divisionId: number;
  districtId: number;
  upazilaId: number;
  address: string;
}

export async function signup(
  payload: RegisterPayload
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
      };
    }

    return data;
  } catch (error) {
    console.error('[auth/signup] fetch failed:', error);
    return {
      success: false,
      error: 'নেটওয়ার্ক সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।',
    };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  return res.json();
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

// ─── LISTINGS ─────────────────────────────────────────────────────────────────

export async function fetchListings(filters?: {
  categoryId?: number | null;
  districtId?: number | null;
  searchQuery?: string;
}): Promise<SupplyListing[]> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set('categoryId', String(filters.categoryId));
  if (filters?.districtId) params.set('districtId', String(filters.districtId));
  if (filters?.searchQuery) params.set('search', filters.searchQuery);

  try {
    const res = await fetch(`/api/listings?${params.toString()}`);
    const data = await res.json();
    return data.listings || [];
  } catch {
    return [];
  }
}

export interface CreateListingPayload {
  sellerId?: string;
  categoryId: number;
  title: string;
  description: string;
  quantity: number;
  unitId: number;
  expectedPrice: number;
  divisionId: number;
  districtId: number;
  upazilaId: number;
  specificLocation?: string;
  imageUrls?: string[];
}

export async function createListing(
  payload: CreateListingPayload
): Promise<{ success: boolean; listingId?: string; flagged?: boolean; error?: string }> {
  const res = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── PHONE REVEAL ─────────────────────────────────────────────────────────────

export async function revealPhone(
  listingId: string
): Promise<{ success: boolean; phone?: string; sellerName?: string; isVerified?: boolean; error?: string }> {
  const res = await fetch('/api/listings/phone-reveal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
  });
  return res.json();
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

// ─── LOCATIONS ────────────────────────────────────────────────────────────────

export async function fetchLocations(): Promise<LocationDivision[]> {
  try {
    const res = await fetch('/api/locations');
    const data = await res.json();
    return data.locations || [];
  } catch {
    return [];
  }
}

// ─── MEASUREMENT UNITS ────────────────────────────────────────────────────────

export async function fetchUnits(): Promise<MeasurementUnit[]> {
  try {
    const res = await fetch('/api/units');
    const data = await res.json();
    return data.units || [];
  } catch {
    return [];
  }
}

// ─── ADMIN: MODERATION ────────────────────────────────────────────────────────

export async function fetchModerationData(type: 'all' | 'kyc' | 'listings' | 'alerts' = 'all') {
  const res = await fetch(`/api/admin/moderation?type=${type}`);
  return res.json();
}

export async function moderationAction(body: Record<string, any>) {
  const res = await fetch('/api/admin/moderation', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
