-- Public-safe profile projection: the base table remains owner/admin-only, while this view exposes only the non-sensitive fields needed for public browsing.

-- Drop the public-read profile policy so the base table is no longer readable by anyone at large.
drop policy if exists "Public profiles viewable by everyone" on public.profiles;

-- Allow only the owner or an admin to read the full row from the base table.
create policy "Users can view own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Admins can view any profile" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  );

-- Public-safe projection: intentionally excludes phone / address / NID / trust state.
create or replace view public.profiles_public as
select
  id,
  full_name,
  user_type,
  is_verified,
  division_id,
  district_id,
  upazila_id
from public.profiles;

grant select on public.profiles_public to anon;
grant select on public.profiles_public to authenticated;
