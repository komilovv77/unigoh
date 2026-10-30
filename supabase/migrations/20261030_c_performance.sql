-- =============================================================================
-- UniGoh — Himoya qoidalarini tezlashtirish
-- auth.uid() va rol funksiyalari har bir qator uchun emas, so'rov boshida
-- bir marta hisoblanadi ("(select ...)" o'rami). Minglab yozuvda farq katta.
-- Qoidalarning MAZMUNI o'zgarmaydi. Qayta ishga tushirish xavfsiz.
-- =============================================================================

create index if not exists applications_student_uni_idx on public.applications (student_id, university_id);
create index if not exists applications_created_idx on public.applications (created_at desc);
create index if not exists application_commissions_uni_idx on public.application_commissions (university_id, status);
create index if not exists staff_university_idx on public.staff (university_id);

-- Universitetlar
drop policy if exists "uni_read" on public.universities;
create policy "uni_read" on public.universities
  for select using (is_active or (select public.is_master()) or id = (select public.my_university()));
drop policy if exists "uni_master_write" on public.universities;
create policy "uni_master_write" on public.universities
  for all using ((select public.is_master())) with check ((select public.is_master()));

-- Xodimlar
drop policy if exists "staff_read" on public.staff;
create policy "staff_read" on public.staff
  for select using (user_id = (select auth.uid()) or (select public.is_master()));
drop policy if exists "staff_master_write" on public.staff;
create policy "staff_master_write" on public.staff
  for all using ((select public.is_master())) with check ((select public.is_master()));

-- Arizalar
drop policy if exists "app_student_read" on public.applications;
create policy "app_student_read" on public.applications
  for select using (student_id = (select auth.uid()));
drop policy if exists "app_student_insert" on public.applications;
create policy "app_student_insert" on public.applications
  for insert with check (student_id = (select auth.uid()));
drop policy if exists "app_student_update" on public.applications;
create policy "app_student_update" on public.applications
  for update using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
drop policy if exists "app_uni_read" on public.applications;
create policy "app_uni_read" on public.applications
  for select using (university_id = (select public.my_university()));
drop policy if exists "app_uni_update" on public.applications;
create policy "app_uni_update" on public.applications
  for update using (university_id = (select public.my_university()))
  with check (university_id = (select public.my_university()));
drop policy if exists "app_master_all" on public.applications;
create policy "app_master_all" on public.applications
  for all using ((select public.is_master())) with check ((select public.is_master()));

-- Tarix
drop policy if exists "events_read" on public.application_events;
create policy "events_read" on public.application_events
  for select using (
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
  for select using (id = (select auth.uid()));
drop policy if exists "profile_own_insert" on public.profiles;
create policy "profile_own_insert" on public.profiles
  for insert with check (id = (select auth.uid()));
drop policy if exists "profile_own_update" on public.profiles;
create policy "profile_own_update" on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "profile_staff_select" on public.profiles;
create policy "profile_staff_select" on public.profiles
  for select using (
    (select public.is_master())
    or exists (
      select 1 from public.applications a
      where a.student_id = profiles.id and a.university_id = (select public.my_university())
    )
  );

-- Moliya (faqat master)
drop policy if exists "terms_master" on public.university_terms;
create policy "terms_master" on public.university_terms
  for all using ((select public.is_master())) with check ((select public.is_master()));
drop policy if exists "commissions_master" on public.application_commissions;
create policy "commissions_master" on public.application_commissions
  for all using ((select public.is_master())) with check ((select public.is_master()));
drop policy if exists "invites_master" on public.staff_invites;
create policy "invites_master" on public.staff_invites
  for all using ((select public.is_master())) with check ((select public.is_master()));
