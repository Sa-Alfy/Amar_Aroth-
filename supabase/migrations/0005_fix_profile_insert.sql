drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile" on public.profiles
  for insert to authenticated
  with check (
    (select auth.uid()) = id
    and (select auth.uid()) is not null
    and user_type <> 'admin'
    and coalesce(is_verified, false) = false
    and coalesce(nid_verified, false) = false
    and coalesce(risk_score, 0) = 0
  );
