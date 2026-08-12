-- Prevent non-admin users from escalating privileged profile fields by resetting them on update.

-- Replace the row-ownership-only profile update policy with the same RLS shape, while the trigger below enforces a column-level trust boundary.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Allow admin users to change other users' rows, but still protect privileged profile columns from self-escalation.
create or replace function public.fn_protect_privileged_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and user_type = 'admin'
  ) then
    new.user_type := old.user_type;
    new.is_verified := old.is_verified;
    new.risk_score := old.risk_score;
    new.phone_verified := old.phone_verified;
    new.nid_verified := old.nid_verified;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_privileged_profile_fields on public.profiles;
create trigger trg_protect_privileged_profile_fields
  before update on public.profiles
  for each row
  execute function public.fn_protect_privileged_profile_fields();

-- Admins may update any profile row, but the trigger guards the sensitive fields even for admin edits.
drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile" on public.profiles
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  );

-- Admins must be able to see and moderate listings even when the row is not theirs.
drop policy if exists "Admins view any listing" on public.listings;
create policy "Admins view any listing" on public.listings
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  );

drop policy if exists "Admins update any listing" on public.listings;
create policy "Admins update any listing" on public.listings
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  );

-- Admin moderation reports are a dedicated admin-only write path.
drop policy if exists "Admins manage moderation reports" on public.moderation_reports;
create policy "Admins manage moderation reports" on public.moderation_reports
  for all to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and user_type = 'admin'
    )
  );
