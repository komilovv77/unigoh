-- =============================================================================
-- UniGoh — Hujjatlarni fayl qilib yuklash (yopiq ombor)
-- Fayllar "documents" omborida: <talaba_id>/<fayl>. Ombor ochiq EMAS:
-- fayl faqat qisqa muddatli imzolangan havola orqali ochiladi.
-- Ko'radi: talabaning o'zi; u ariza bergan universitet xodimi; bosh administrator.
-- Qayta ishga tushirish xavfsiz.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Profilda yuklangan hujjatlar ro'yxati: [{kind, name, path, size, type, uploaded_at}]
alter table public.profiles add column if not exists documents jsonb not null default '[]'::jsonb;

drop policy if exists "docs_student_insert" on storage.objects;
create policy "docs_student_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "docs_student_select" on storage.objects;
create policy "docs_student_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "docs_student_delete" on storage.objects;
create policy "docs_student_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "docs_staff_select" on storage.objects;
create policy "docs_staff_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      (select public.is_master())
      or exists (
        select 1 from public.applications a
        where a.student_id::text = (storage.foldername(name))[1]
          and a.university_id = (select public.my_university())
      )
    )
  );
