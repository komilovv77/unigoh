-- =============================================================================
-- UniGoh — Xavfsizlik maslahatchisi (Security Advisor) ogohlantirishlari
-- 1) Barcha qoidalar faqat tizimga kirganlar (authenticated) uchun;
--    tizimga kirmagan mehmon faqat faol universitetlar ro'yxatini ko'radi.
-- 2) Ichki funksiyalarni mehmonlar umuman chaqira olmaydi; trigger
--    funksiyalarini hech kim API orqali chaqira olmaydi.
-- Qoidalar mazmuni 20261030_c_performance.sql bilan bir xil. Qayta ishga
-- tushirish xavfsiz.
-- =============================================================================

-- Universitetlar: mehmonlar faqat faollarini; xodimlar o'zinikini ham
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

-- Xodimlar
drop policy if exists "staff_read" on public.staff;
create policy "staff_read" on public.staff
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_master()));
drop policy if exists "staff_master_write" on public.staff;
create policy "staff_master_write" on public.staff
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- Arizalar
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

-- Tarix
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

-- Profillar
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

-- Moliya va takliflar (faqat master)
drop policy if exists "terms_master" on public.university_terms;
create policy "terms_master" on public.university_terms
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));
drop policy if exists "commissions_master" on public.application_commissions;
create policy "commissions_master" on public.application_commissions
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));
drop policy if exists "invites_master" on public.staff_invites;
create policy "invites_master" on public.staff_invites
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- Funksiyalarga kirish huquqlari
do $$
declare f text;
begin
  -- Trigger funksiyalari: API orqali hech kim chaqira olmaydi
  foreach f in array array[
    'public.applications_guard()', 'public.applications_log()', 'public.commissions_touch()',
    'public.apply_staff_invite()', 'public.apply_invite_to_existing()', 'public.universities_terms_row()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;

  -- Ichki va xodim funksiyalari: faqat tizimga kirganlar (har biri ichida rol tekshiriladi)
  foreach f in array array[
    'public.is_master()', 'public.my_university()', 'public.my_role()',
    'public.assign_staff(text, text, text)', 'public.remove_staff(uuid)',
    'public.list_staff()', 'public.student_directory()'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- Ko'rinishlar mehmonlarga yopiq
revoke all on public.application_flags from anon;
revoke all on public.commission_ledger from anon;
