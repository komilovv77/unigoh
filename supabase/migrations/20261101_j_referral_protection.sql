-- =============================================================================
-- j. UniGoh yuborgan talabani universitet "chetlab o'tishi"dan himoya
--   1) Pasport (shaxsni aniqlaydigan hujjat) talaba rozilik bergunga qadar
--      universitetga ko'rinmaydi — fayl ham, ro'yxatdagi yozuv ham.
--   2) Talaba istalgan holatda "shu universitetga o'qishga kirdim" deya oladi
--      (hatto universitet UniGoh'da rad etgan bo'lsa ham) va dalil yuklaydi.
--   3) Shubhali holatlar ogohlantirishlarda ko'rinadi.
-- =============================================================================

-- 1a. Profil: rozilikdan oldin pasport yozuvlari yashiriladi
create or replace function public.applicant_profiles(p_ids uuid[])
returns table (
  id uuid, full_name text, phone text, region text, bio text, school_name text,
  test_score numeric, certificates jsonb, documents jsonb, diploma_url text, portfolio_url text,
  updated_at timestamptz, contact_visible boolean
)
language sql stable security definer set search_path = public as $$
  with me as (select public.is_master() as master, public.my_university() as uni)
  select
    p.id, p.full_name::text,
    case when v.visible then p.phone::text end,
    p.region::text, p.bio::text, p.school_name::text,
    p.test_score::numeric, to_jsonb(p.certificates),
    case when v.visible then p.documents
         else coalesce((select jsonb_agg(d) from jsonb_array_elements(coalesce(p.documents, '[]'::jsonb)) d
                         where coalesce(d->>'kind', '') not in ('passport', 'enrollment')), '[]'::jsonb) end,
    p.diploma_url::text, p.portfolio_url::text,
    p.updated_at, v.visible
  from public.profiles p
  cross join me
  cross join lateral (
    select me.master or exists (
      select 1 from public.applications a
      where a.student_id = p.id and a.university_id = me.uni and a.forwarded_at is not null
    ) as visible
  ) v
  where p.id = any(p_ids)
    and (me.master or exists (select 1 from public.applications a where a.student_id = p.id and a.university_id = me.uni));
$$;
revoke all on function public.applicant_profiles(uuid[]) from public, anon;
grant execute on function public.applicant_profiles(uuid[]) to authenticated;

-- 1b. Ombor: pasport faylini universitet faqat rozilikdan keyin ocha oladi
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
          and (
            a.forwarded_at is not null
            or not (storage.filename(name) like 'passport-%' or storage.filename(name) like 'enrollment-%')
          )
      )
    )
  );

-- 2. Talaba "o'qishga kirdim"ni istalgan holatda bildira oladi
create or replace function public.applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := public.my_role();
  offer boolean := coalesce(current_setting('unigoh.offer', true), '') = '1';
begin
  if tg_op = 'INSERT' then
    if r = 'student' then
      new.student_id := auth.uid();
      new.status := 'NEW';
      new.contract_amount := null;
      new.student_enrolled_claim := null;
      new.exam_date := null;
      new.note := null;
      new.forwarded_at := null;
      new.forwarded_by := null;
    end if;
    return new;
  end if;

  if r = 'student' then
    if new.student_enrolled_claim is distinct from old.student_enrolled_claim then
      new.student_claimed_at := now();
    end if;
    if new.status is distinct from old.status then
      if offer and old.status = 'ADMITTED' and new.status = 'SENT' then
        new.forwarded_at := now();
        new.forwarded_by := auth.uid();
      elsif new.status = 'WITHDRAWN' and old.status in ('NEW', 'DOCS_REVIEW', 'EXAM', 'ADMITTED', 'SENT') then
        null;
      else
        raise exception 'Talaba ariza holatini o''zgartira olmaydi';
      end if;
    end if;
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.program_id := old.program_id;
    new.program_name := old.program_name;
    new.exam_date := old.exam_date;
    new.note := old.note;
    new.contract_amount := old.contract_amount;
    if not (offer and new.status = 'SENT') then
      new.forwarded_at := old.forwarded_at;
      new.forwarded_by := old.forwarded_by;
    end if;
  elsif r = 'university_admin' then
    if new.status is distinct from old.status then
      if old.forwarded_at is null and new.status not in ('DOCS_REVIEW', 'EXAM', 'ADMITTED', 'REJECTED') then
        raise exception 'Talaba rozilik bermaguncha bu holatni qo''yib bo''lmaydi';
      end if;
      if old.forwarded_at is not null and new.status not in ('SENT', 'CONTRACT', 'ENROLLED', 'REJECTED') then
        raise exception 'Bu holatni qo''yib bo''lmaydi';
      end if;
      if old.status in ('WITHDRAWN') then
        raise exception 'Talaba arizani bekor qilgan';
      end if;
    end if;
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.student_enrolled_claim := old.student_enrolled_claim;
    new.student_claimed_at := old.student_claimed_at;
    new.forwarded_at := old.forwarded_at;
    new.forwarded_by := old.forwarded_by;
  elsif r = 'master' then
    if new.status in ('SENT', 'CONTRACT', 'ENROLLED') and old.forwarded_at is null then
      new.forwarded_at := now();
      new.forwarded_by := auth.uid();
    end if;
  end if;

  if new.status = 'ENROLLED' and (new.contract_amount is null or new.contract_amount = 0) then
    raise exception 'O''qishga kirdi holati uchun 1-yil kontrakt summasini kiriting';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.applications_guard() from public, anon, authenticated;

-- 3. Ogohlantirishlar: chetlab o'tish belgilari birinchi o'rinda
create or replace view public.application_flags
with (security_invoker = true) as
select
  a.id, a.code, a.university_id, a.status, a.student_enrolled_claim,
  case
    when a.student_enrolled_claim = true and a.status not in ('CONTRACT', 'ENROLLED')
      then 'DIQQAT: talaba shu universitetga o''qishga kirganini aytmoqda, universitet esa buni belgilamagan'
    when a.status = 'REJECTED' and a.forwarded_at is not null
      then 'Shubhali: talaba rozilik berib yuborilgandan keyin rad etilgan — tekshiring'
    when a.status = 'SENT' and a.forwarded_at < now() - interval '14 days'
      then 'Talaba 2 haftadan beri yuborilgan, universitet natijani belgilamagan'
    when a.status in ('NEW', 'DOCS_REVIEW') and a.created_at < now() - interval '14 days'
      then 'Universitet 2 haftadan beri javob bermagan'
    when a.status = 'ADMITTED' and a.updated_at < now() - interval '7 days'
      then 'Talaba 7 kundan beri rozilik bermagan'
  end as flag
from public.applications a;
grant select on public.application_flags to authenticated;
revoke all on public.application_flags from anon;

select 'referral protection ready' as result;
