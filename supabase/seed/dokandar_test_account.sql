-- supabase/seed/dokandar_test_account.sql
-- DEV / TEST ONLY. Creates one verified dokandar so the tier rule can be
-- exercised. NOT a migration -- never run this against a real deployment.
--
-- This writes directly into auth.users and auth.identities, which Supabase
-- does not officially support: the shape of those tables can change between
-- GoTrue versions. It is done here because the app's own signup is the only
-- other way to get an auth row, and this database is not published. If login
-- misbehaves afterwards, delete the account (bottom of this file) and register
-- through the app instead.
--
-- The columns mirror exactly what /api/auth/signup produces:
--   email    = <normalized phone>@amararoth.com   (see signup/route.ts:31)
--   password = bcrypt, provider 'email'
--   profile  = phone without the domain, user_type from the signup choice
--
-- Edit the four values below before running.

do $$
declare
  v_phone    text := '01711000001';                        -- 11 digits, leading 0
  v_password text := 'dokan1234';                          -- min 6 chars
  v_name     text := 'মোঃ সেলিম দোকানদার (Test Dokandar)';
  v_nid      text := '1990123456789';

  v_email    text;
  v_uid      uuid := gen_random_uuid();
begin
  v_email := v_phone || '@amararoth.com';

  if exists (select 1 from auth.users where email = v_email) then
    raise notice 'skipped: % already exists', v_email;
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_uid, 'authenticated', 'authenticated',
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '', '', '', ''
  );

  -- Newer GoTrue requires a matching identity row or password login fails.
  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    v_uid::text, v_uid,
    jsonb_build_object(
      'sub', v_uid::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  -- Verified on purpose: reveal_seller_phone_number returns 'unverified'
  -- and blocks the contact path otherwise, so an unverified test account
  -- cannot exercise the rule we are trying to prove.
  insert into public.profiles (
    id, phone, full_name, user_type, nid_number,
    division_id, district_id, upazila_id,
    is_verified, kyc_status
  ) values (
    v_uid, v_phone, v_name, 'dokandar', v_nid,
    1, 102, 1002,          -- Dhaka / Gazipur / Sreepur, known-good ids
    true, 'verified'
  );

  raise notice 'created dokandar % (login: % / %)', v_uid, v_email, v_password;
end $$;

-- Confirm it landed and is wired to a tier that has permission rows.
select
  p.user_type,
  p.full_name,
  p.phone,
  p.is_verified,
  p.kyc_status,
  u.email,
  (u.encrypted_password is not null) as has_password,
  exists (select 1 from auth.identities i where i.user_id = p.id) as has_identity
from public.profiles p
join auth.users u on u.id = p.id
where p.user_type = 'dokandar';

-- ── Undo, if you need it ───────────────────────────────────────────────
-- Deleting the auth user cascades to profiles, and profiles cascades to
-- that user's listings. This account owns none, so it is clean.
--
-- delete from auth.users where email = '01711000001@amararoth.com';
