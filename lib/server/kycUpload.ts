import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side handling of the NID photos collected at signup.
 *
 * The client sends them as data URLs. They are decoded here and written to the
 * private `kyc-documents` bucket with the service role client; only the object
 * path is stored on the profile. Nothing about a NID photo is ever public.
 */

export const KYC_BUCKET = 'kyc-documents';

/** A phone camera shot is ~2-5MB. Anything past this is not a photo of a card. */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface DecodedImage {
  bytes: Buffer;
  mime: string;
  extension: string;
}

/** Returns null when the string is not a data URL this app accepts. */
export function decodeImageDataUrl(value: unknown): DecodedImage | null {
  if (typeof value !== 'string') return null;

  const match = /^data:([a-z/+-]+);base64,(.+)$/i.exec(value.trim());
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const extension = ALLOWED_MIME[mime];
  if (!extension) return null;

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;

  return { bytes, mime, extension };
}

/**
 * Uploads one NID side and returns its object path.
 * Throws on failure so the caller can roll the whole signup back.
 */
export async function uploadNidImage(
  admin: SupabaseClient,
  userId: string,
  side: 'front' | 'back',
  image: DecodedImage
): Promise<string> {
  const path = `${userId}/nid-${side}.${image.extension}`;

  const { error } = await admin.storage.from(KYC_BUCKET).upload(path, image.bytes, {
    contentType: image.mime,
    upsert: true,
  });

  if (error) throw error;
  return path;
}

/** Best-effort cleanup when signup is rolled back. */
export async function removeNidImages(admin: SupabaseClient, paths: string[]): Promise<void> {
  const present = paths.filter(Boolean);
  if (present.length === 0) return;
  try {
    await admin.storage.from(KYC_BUCKET).remove(present);
  } catch {
    // The auth user is already gone; an orphaned object is not worth failing over.
  }
}
