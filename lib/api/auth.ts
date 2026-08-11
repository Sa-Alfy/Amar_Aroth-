import { createClient } from '@/lib/supabase/client';

export type UserRole = 'farmer' | 'agent' | 'arathdar';

export interface UserProfile {
  id: string;
  phone: string;
  fullName: string;
  userType: UserRole;
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  avatarUrl?: string;
  address?: string;
  divisionId?: number;
  districtId?: number;
  upazilaId?: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
}

const CURRENT_USER_KEY = 'aaroth_active_user';
const PENDING_KYC_KEY = 'aaroth_pending_kyc_users';

// ─── SESSION HELPERS ──────────────────────────────────────────────────────────

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUserSession(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    document.cookie = `aaroth_user_role=${user.userType}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `aaroth_user_phone=${user.phone}; path=/; max-age=2592000; SameSite=Lax`;
  } catch (e) {
    console.error('Error storing user session:', e);
  }
}

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

// ─── KYC QUEUE HELPERS (client-side mock store) ───────────────────────────────

function getPendingKycList(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_KYC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingKycList(list: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_KYC_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving KYC list:', e);
  }
}

function addToPendingKycQueue(user: UserProfile): void {
  const existing = getPendingKycList();
  const filtered = existing.filter((u) => u.id !== user.id);
  savePendingKycList([user, ...filtered]);
}

// ─── LOGIN API ────────────────────────────────────────────────────────────────

export async function loginWithPhoneAndPassword(
  phone: string,
  password: string,
  role: UserRole
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' };
  }
  if (!password || password.length < 4) {
    return { success: false, error: 'পাসওয়ার্ড বা পিন কমপক্ষে ৪ অক্ষরের হতে হবে' };
  }

  // Try to match registered user in pending KYC store
  try {
    const allUsers = getPendingKycList();
    const existingUser = allUsers.find(
      (u) => u.phone === cleanPhone && u.userType === role
    );
    if (existingUser) {
      storeUserSession(existingUser);
      return { success: true, user: existingUser };
    }
  } catch (_) {}

  // Demo fallback profile
  try {
    const profile: UserProfile = {
      id: `usr-${role}-${cleanPhone}`,
      phone: cleanPhone,
      fullName:
        role === 'farmer'
          ? 'মোঃ হাফিজুর রহমান'
          : role === 'agent'
          ? 'আতাউর রহমান'
          : 'আলহাজ্ব আব্দুর রহিম',
      userType: role,
      isVerified: true,
      kycStatus: 'verified',
      createdAt: new Date().toISOString(),
    };
    storeUserSession(profile);
    return { success: true, user: profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'লগইন ব্যর্থ হয়েছে' };
  }
}

// ─── OTP PASSWORD RESET (MOCK) ────────────────────────────────────────────────

// In production this would call an SMS provider (e.g., Twilio, SSL Commerz SMS)
export async function requestPasswordResetOtp(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const cleanPhone = phone.trim();
  if (!cleanPhone || cleanPhone.length < 11) {
    return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' };
  }
  // Simulate SMS send delay
  await new Promise((r) => setTimeout(r, 1000));
  // Store mock OTP in session storage (dev only)
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

  await new Promise((r) => setTimeout(r, 800));

  if (typeof window !== 'undefined') {
    const storedOtp = sessionStorage.getItem(`otp_${phone.trim()}`);
    // In mock mode accept '1234' or whatever was stored
    if (storedOtp && otp !== storedOtp) {
      return { success: false, error: 'OTP কোড সঠিক নয়। আবার চেষ্টা করুন।' };
    }
    sessionStorage.removeItem(`otp_${phone.trim()}`);
  }
  return { success: true };
}

// ─── REGISTRATION API ─────────────────────────────────────────────────────────

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

export async function registerUser(
  payload: RegisterPayload
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  if (!payload.phone || payload.phone.trim().length < 11) {
    return { success: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' };
  }
  if (!payload.fullName || payload.fullName.trim().length < 3) {
    return { success: false, error: 'আপনার পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)' };
  }
  if (!payload.nidNumber || payload.nidNumber.trim().length < 10) {
    return { success: false, error: 'সঠিক ১০ বা ১৭ ডিজিটের এনআইডি নম্বর দিন' };
  }
  if (!payload.password || payload.password.length < 4) {
    return { success: false, error: 'পাসওয়ার্ড বা পিন কমপক্ষে ৪ অক্ষরের হতে হবে' };
  }

  // Simulate API round-trip
  await new Promise((r) => setTimeout(r, 1200));

  try {
    const profile: UserProfile = {
      id: `usr-${payload.role}-${Date.now()}`,
      phone: payload.phone.trim(),
      fullName: payload.fullName.trim(),
      userType: payload.role,
      nidNumber: payload.nidNumber.trim(),
      nidFrontUrl: payload.nidFrontUrl || '',
      nidBackUrl: payload.nidBackUrl || '',
      avatarUrl: payload.avatarUrl || '',
      divisionId: payload.divisionId,
      districtId: payload.districtId,
      upazilaId: payload.upazilaId,
      address: payload.address,
      isVerified: false,
      kycStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    storeUserSession(profile);
    addToPendingKycQueue(profile);
    return { success: true, user: profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'নিবন্ধন ব্যর্থ হয়েছে' };
  }
}

// ─── ADMIN: KYC QUEUE ─────────────────────────────────────────────────────────

export function getPendingKycUsers(): UserProfile[] {
  return getPendingKycList().filter((u) => u.kycStatus === 'pending');
}

export function approveUserKyc(userId: string): void {
  const list = getPendingKycList();
  const updated = list.map((u) =>
    u.id === userId ? { ...u, kycStatus: 'verified' as const, isVerified: true } : u
  );
  savePendingKycList(updated);

  // Also update the active session if it's this user
  const current = getStoredUser();
  if (current && current.id === userId) {
    storeUserSession({ ...current, kycStatus: 'verified', isVerified: true });
  }
}

export function rejectUserKyc(userId: string): void {
  const list = getPendingKycList();
  const updated = list.map((u) =>
    u.id === userId ? { ...u, kycStatus: 'rejected' as const, isVerified: false } : u
  );
  savePendingKycList(updated);
}
