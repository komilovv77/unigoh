-- =============================================================================
-- UniGoh: Security Advisor fixes
-- 1) All policies target authenticated users;
--    anonymous visitors only see the list of active universities.
-- 2) Anonymous users cannot call internal functions; trigger
--    functions cannot be called through the API by anyone.
-- Policy semantics match 20261030_c_performance.sql. Safe to
-- re-run.
-- =============================================================================

-- Universities: visitors see active ones; staff also see their own
drop policy if exists "uni_read" on public.universities;
drop policy if exists "uni_public_read" on public.universities;
create policy "uni_public_read" on public.universities
  for select to anon, authenticated using (is_active);
drop policy if exists "uni_staff_read" on public.universities;
create policy "uni_staff_read" on public.universities
  for select to authenticated using ((select public.is_master()) or id = (select public.my_university()));
drop policy if exists "uni_master_write" on public.universities;
create policy "uni_master_write" on public.universities
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- Staff
drop policy if exists "staff_read" on public.staff;
create policy "staff_read" on public.staff
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_master()));
drop policy if exists "staff_master_write" on public.staff;
create policy "staff_master_write" on public.staff
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- Applications
drop policy if exists "app_student_read" on public.applications;
create policy "app_student_read" on public.applications
  for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "app_student_insert" on public.applications;
create policy "app_student_insert" on public.applications
  for insert to authenticated with check (student_id = (select auth.uid()));
drop policy if exists "app_student_update" on public.applications;
create policy "app_student_update" on public.applications
  for update to authenticated using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
drop policy if exists "app_uni_read" on public.applications;
create policy "app_uni_read" on public.applications
  for select to authenticated using (university_id = (select public.my_university()));
drop policy if exists "app_uni_update" on public.applications;
create policy "app_uni_update" on public.applications
  for update to authenticated using (university_id = (select public.my_university()))
  with check (university_id = (select public.my_university()));
drop policy if exists "app_master_all" on public.applications;
create policy "app_master_all" on public.applications
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- History
drop policy if exists "events_read" on public.application_events;
create policy "events_read" on public.application_events
  for select to authenticated using (
    (kind <> 'commission' or (select public.is_master()))
    and exists (
      select 1 from public.applications a
      where a.id = application_events.application_id
        and (a.student_id = (select auth.uid()) or a.university_id = (select public.my_university()) or (select public.is_master()))
    )
  );

-- Profiles
drop policy if exists "profile_own_select" on public.profiles;
create policy "profile_own_select" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile_own_insert" on public.profiles;
create policy "profile_own_insert" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profile_own_update" on public.profiles;
create policy "profile_own_update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "profile_staff_select" on public.profiles;
create policy "profile_staff_select" on public.profiles
  for select to authenticated using (
    (select public.is_master())
    or exists (
      select 1 from public.applications a
      where a.student_id = profiles.id and a.university_id = (select public.my_university())
    )
  );

-- Finance and invites (master only)
drop policy if exists "terms_master" on public.university_terms;
create policy "terms_master" on public.university_terms
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));
drop policy if exists "commissions_master" on public.application_commissions;
create policy "commissions_master" on public.application_commissions
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));
drop policy if exists "invites_master" on public.staff_invites;
create policy "invites_master" on public.staff_invites
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- Function privileges
do $$
declare f text;
begin
  -- Trigger functions: not callable through the API
  foreach f in array array[
    'public.applications_guard()', 'public.applications_log()', 'public.commissions_touch()',
    'public.apply_staff_invite()', 'public.apply_invite_to_existing()', 'public.universities_terms_row()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;

  -- Internal and staff functions: authenticated only (each checks the role inside)
  foreach f in array array[
    'public.is_master()', 'public.my_university()', 'public.my_role()',
    'public.assign_staff(text, text, text)', 'public.remove_staff(uuid)',
    'public.list_staff()', 'public.student_directory()'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Views are closed to anonymous users
revoke all on public.application_flags from anon;
revoke all on public.commission_ledger from anon;
