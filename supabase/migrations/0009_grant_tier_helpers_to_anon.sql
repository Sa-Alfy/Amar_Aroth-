-- Migration: 0009_grant_tier_helpers_to_anon.sql
-- Description: Fixes a defect in 0008. public.profiles_public calls
--   my_user_type() and is_admin() in its WHERE clause, but 0007 granted
--   EXECUTE on both to `authenticated` only. A view without security_invoker
--   resolves TABLE permissions as the view owner, but FUNCTION execute
--   privileges are still checked against the CALLING role -- so every anon
--   read of profiles_public failed with:
--     42501 permission denied for function my_user_type
--   which silently emptied seller name and verified state on the public feed.
--
-- Both functions are SECURITY DEFINER and read only the caller's own identity:
--   my_user_type()  -> select user_type from profiles where id = auth.uid()
--   is_admin(uuid)  -> whether that id is an admin
-- For anon, auth.uid() is null, so they return null and false respectively.
-- Granting execute to anon discloses nothing.

grant execute on function public.my_user_type() to anon;
grant execute on function public.is_admin(uuid) to anon;

-- Verify: should return the 2 arathdar sellers of the public listings
-- and nothing else. Farmers must NOT appear.
select id, full_name, user_type, is_verified from public.profiles_public;
