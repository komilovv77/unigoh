-- =============================================================================
-- UniGoh: mandatory MFA for staff
-- Staff privileges (master or university admin) apply only to sessions
-- that passed the second factor (aal2). A stolen password alone
-- exposes no student or finance data.
-- Safe to re-run.
-- =============================================================================

create or replace function public.has_aal2()
returns boolean language sql stable set search_path = public as $$
  select coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_aal2()
     and exists (select 1 from public.staff where user_id = auth.uid() and role = 'master');
$$;

create or replace function public.my_university()
returns text language sql stable security definer set search_path = public as $$
  select university_id from public.staff
  where user_id = auth.uid() and role = 'university_admin' and public.has_aal2();
$$;

-- Staff without a second factor are treated as regular users
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select case when public.has_aal2()
              then coalesce((select role from public.staff where user_id = auth.uid()), 'student')
              else 'student' end;
$$;

-- Reset MFA for a staff member who lost their phone (master only)
create or replace function public.reset_staff_mfa(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_master() then
    raise exception 'Faqat master admin';
  end if;
  if not exists (select 1 from public.staff where user_id = p_user) then
    raise exception 'Bu foydalanuvchi xodim emas';
  end if;
  delete from auth.mfa_factors where user_id = p_user;
end;
$$;

revoke all on function public.has_aal2() from public, anon;
grant execute on function public.has_aal2() to authenticated;
revoke all on function public.reset_staff_mfa(uuid) from public, anon;
grant execute on function public.reset_staff_mfa(uuid) to authenticated;
revoke all on function public.is_master() from public, anon;
revoke all on function public.my_university() from public, anon;
revoke all on function public.my_role() from public, anon;
grant execute on function public.is_master() to authenticated;
grant execute on function public.my_university() to authenticated;
grant execute on function public.my_role() to authenticated;
