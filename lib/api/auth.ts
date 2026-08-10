import { createClient } from '@/lib/supabase/client';

export type UserRole = 'farmer' | 'agent' | 'arathdar';

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  userType: UserRole;
  nidNumber?: string;
  avatarUrl?: string;
  address?: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
}

const CURRENT_USER_KEY = 'aaroth_active_user';

// Get logged-in user from localStorage/cookie fallback
export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Save active user session
export function storeUserSession(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    // Set cookie for Next.js SSR / persistent mobile session
    document.cookie = `aaroth_user_role=${user.userType}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `aaroth_user_phone=${user.phone}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (e) {
    console.error('Error storing user session:', e);
  }
}

// Clear user session
export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    document.cookie = 'aaroth_user_role=; path=/; max-age=0';
    document.cookie = 'aaroth_user_phone=; path=/; max-age=0';
  } catch (e) {
    console.error('Error clearing user session:', e);
  }
}

// Login API
export async function loginWithPhoneAndPassword(
  phone: string,
  password: string,
  role: UserRole
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  // Normalize phone
  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' };
  }

  try {
    // Create demo profile representing logged in user
    const profile: UserProfile = {
      id: `usr-${role}-${Date.now()}`,
      phone: cleanPhone,
      fullName: role === 'farmer' ? 'মোঃ হাফিজুর রহমান (কৃষক)' : role === 'agent' ? 'আতাউর রহমান (এজেন্ট)' : 'আলহাজ্ব আব্দুর রহিম (আড়তদার)',
      userType: role,
      isVerified: true,
      kycStatus: 'verified',
    };

    storeUserSession(profile);
    return { success: true, user: profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'লগইন ব্যর্থ হয়েছে' };
  }
}

// Signup API
export interface RegisterPayload {
  role: UserRole;
  phone: string;
  password: string;
  nidName: string;
  nidNumber: string;
  avatarUrl?: string;
  divisionId: number;
  districtId: number;
  upazilaId: number;
  address: string;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (!payload.phone || payload.phone.trim().length < 11) {
    return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' };
  }
  if (!payload.nidName || payload.nidName.trim().length < 3) {
    return { success: false, error: 'এনআইডি অনুযায়ী আপনার পুরো নাম লিখুন' };
  }
  if (!payload.nidNumber || payload.nidNumber.trim().length < 10) {
    return { success: false, error: 'সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন' };
  }

  try {
    const profile: UserProfile = {
      id: `usr-${payload.role}-${Date.now()}`,
      phone: payload.phone.trim(),
      fullName: payload.nidName.trim(),
      userType: payload.role,
      nidNumber: payload.nidNumber.trim(),
      avatarUrl: payload.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      divisionId: payload.divisionId,
      districtId: payload.districtId,
      upazilaId: payload.upazilaId,
      address: payload.address,
      isVerified: false,
      kycStatus: 'pending',
    };

    storeUserSession(profile);
    return { success: true, user: profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'নিবন্ধন ব্যর্থ হয়েছে' };
  }
}
