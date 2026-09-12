-- ═══════════════════════════════════════════════════════════
-- 0003 — storage paths for the NID photos collected at signup
--
-- Signup has always required a front and back photo of the NID, sent them in
-- the body, and thrown them away: public.profiles had nowhere to put them, so
-- KYC review had no evidence to review.
--
-- These hold an object PATH inside the private `kyc-documents` storage bucket,
-- not a public URL and not base64. Reading one means asking the server for a
-- signed URL, which is why the bucket stays private and no grant is widened
-- here. The columns are written by the service role client during signup.
-- ═══════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists nid_front_url text,
  add column if not exists nid_back_url  text;

comment on column public.profiles.nid_front_url is
  'Object path in the private kyc-documents bucket, e.g. <user_id>/nid-front.jpg. Never a public URL.';
comment on column public.profiles.nid_back_url is
  'Object path in the private kyc-documents bucket, e.g. <user_id>/nid-back.jpg. Never a public URL.';
