-- =============================================================================
-- UniGoh — Moliya ma'lumotlarini faqat bosh administratorga yopish
-- Ulush foizi, komissiya summasi va to'lov holati alohida jadvallarga ko'chadi.
-- Universitet xodimlari va talabalar bu jadvallarni umuman o'qiy olmaydi.
-- Qayta ishga tushirish xavfsiz.
-- =============================================================================

-- 1. Universitet bilan kelishuv shartlari (faqat master)
create table if not exists public.university_terms (
  university_id    text primary key references public.universities(id) on delete cascade,
  commission_rate  numeric(4,2) not null default 4.00 check (commission_rate >= 0 and commission_rate <= 100),
  contact_name     text,
  contact_phone    text,
  notes            text,
  updated_at       timestamptz not null default now()
);

-- Eski ustunlardan ko'chirish (bo'lsa)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'universities' and column_name = 'commission_rate') then
    insert into public.university_terms (university_id, commission_rate, contact_name, contact_phone)
    select id, commission_rate, contact_name, contact_phone from public.universities
    on conflict (university_id) do nothing;
  end if;
end $$;

insert into public.university_terms (university_id)
select id from public.universities on conflict do nothing;

-- Yangi universitet qo'shilganda shartlar yozuvi avtomatik yaratiladi
create or replace function public.universities_terms_row()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.university_terms (university_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists universities_terms_row on public.universities;
create trigger universities_terms_row after insert on public.universities
  for each row execute function public.universities_terms_row();

-- 2. Har bir o'qishga kirgan talaba uchun komissiya (faqat master)
create table if not exists public.application_commissions (
  application_id  uuid primary key references public.applications(id) on delete cascade,
  university_id   text not null references public.universities(id),
  rate            numeric(4,2) not null,
  status          text not null default 'pending' check (status in ('pending', 'invoiced', 'paid')),
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'applications' and column_name = 'commission_rate') then
    insert into public.application_commissions (application_id, university_id, rate, status, paid_at)
    select id, university_id, commission_rate, commission_status, commission_paid_at
    from public.applications
    where status = 'ENROLLED' and commission_rate is not null and commission_status <> 'none'
    on conflict (application_id) do nothing;
  end if;
end $$;

-- 3. Eski ochiq ustunlarni olib tashlash (endi boshqa jadvallarda)
drop view if exists public.application_flags;
alter table public.applications drop column if exists commission_amount;
alter table public.applications drop column if exists commission_rate;
alter table public.applications drop column if exists commission_status;
alter table public.applications drop column if exists commission_paid_at;
alter table public.universities drop column if exists commission_rate;
alter table public.universities drop column if exists contact_name;
alter table public.universities drop column if exists contact_phone;

-- 4. Moliya ko'rinishi: kontrakt summasi × foiz (faqat master ko'radi)
create or replace view public.commission_ledger
with (security_invoker = true) as
select
  c.application_id,
  a.code,
  a.student_id,
  c.university_id,
  a.program_name,
  a.contract_amount,
  c.rate,
  round(coalesce(a.contract_amount, 0) * c.rate / 100.0)::bigint as amount,
  c.status,
  c.paid_at,
  c.created_at
from public.application_commissions c
join public.applications a on a.id = c.application_id;

-- Nazorat ko'rinishi (qayta yaratish)
create or replace view public.application_flags
with (security_invoker = true) as
select
  a.id,
  a.code,
  a.university_id,
  a.status,
  a.student_enrolled_claim,
  case
    when a.student_enrolled_claim = true and a.status in ('REJECTED', 'WITHDRAWN', 'NEW', 'DOCS_REVIEW', 'EXAM')
      then 'Talaba o''qishga kirganini aytmoqda, OTM esa boshqa holat ko''rsatgan'
    when a.student_enrolled_claim = true and a.status in ('ADMITTED', 'CONTRACT')
         and a.student_claimed_at < now() - interval '14 days'
      then 'Talaba 2 haftadan beri o''qishda, OTM to''lovni belgilamagan'
    when a.status in ('ADMITTED', 'CONTRACT') and a.updated_at < now() - interval '30 days'
      then '30 kundan beri holat o''zgarmagan'
  end as flag
from public.applications a;
grant select on public.application_flags to authenticated;
grant select on public.commission_ledger to authenticated;

-- 5. Triggerlarni yangilash
create or replace function public.applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := public.my_role();
begin
  if tg_op = 'INSERT' then
    if r = 'student' then
      new.student_id := auth.uid();
      new.status := 'NEW';
      new.contract_amount := null;
      new.student_enrolled_claim := null;
      new.exam_date := null;
      new.note := null;
    end if;
    return new;
  end if;

  if r = 'student' then
    if new.student_enrolled_claim is distinct from old.student_enrolled_claim then
      new.student_claimed_at := now();
    end if;
    if new.status is distinct from old.status and not (new.status = 'WITHDRAWN' and old.status in ('NEW','DOCS_REVIEW','EXAM')) then
      raise exception 'Talaba ariza holatini o''zgartira olmaydi';
    end if;
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.program_id := old.program_id;
    new.program_name := old.program_name;
    new.exam_date := old.exam_date;
    new.note := old.note;
    new.contract_amount := old.contract_amount;
  elsif r = 'university_admin' then
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.student_enrolled_claim := old.student_enrolled_claim;
    new.student_claimed_at := old.student_claimed_at;
  end if;

  if new.status = 'ENROLLED' and (new.contract_amount is null or new.contract_amount = 0) then
    raise exception 'O''qishga kirdi holati uchun 1-yil kontrakt summasini kiriting';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.applications_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := public.my_role();
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, actor_id, actor_role, kind, to_value)
    values (new.id, auth.uid(), r, 'created', new.status);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value, note)
    values (new.id, auth.uid(), r, 'status', old.status, new.status, new.note);

    -- O'qishga kirdi → komissiya yozuvi (foiz shu paytda muzlatiladi)
    if new.status = 'ENROLLED' then
      insert into public.application_commissions (application_id, university_id, rate)
      select new.id, new.university_id, coalesce(t.commission_rate, 4.00)
      from (select 1) x left join public.university_terms t on t.university_id = new.university_id
      on conflict (application_id) do nothing;
    elsif old.status = 'ENROLLED' then
      -- Xato bilan qo'yilgan bo'lsa: hali to'lanmagan komissiya bekor qilinadi
      delete from public.application_commissions where application_id = new.id and status = 'pending';
    end if;
  end if;
  if new.contract_amount is distinct from old.contract_amount then
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value)
    values (new.id, auth.uid(), r, 'contract', old.contract_amount::text, new.contract_amount::text);
  end if;
  if new.student_enrolled_claim is distinct from old.student_enrolled_claim then
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value)
    values (new.id, auth.uid(), r, 'student_claim', old.student_enrolled_claim::text, new.student_enrolled_claim::text);
  end if;
  return new;
end;
$$;

create or replace function public.commissions_touch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'paid' then new.paid_at := now(); end if;
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value)
    values (new.application_id, auth.uid(), public.my_role(), 'commission', old.status, new.status);
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists commissions_touch on public.application_commissions;
create trigger commissions_touch before update on public.application_commissions
  for each row execute function public.commissions_touch();

-- 6. RLS: moliya jadvallari faqat master uchun
alter table public.university_terms enable row level security;
alter table public.application_commissions enable row level security;

drop policy if exists "terms_master" on public.university_terms;
create policy "terms_master" on public.university_terms
  for all using (public.is_master()) with check (public.is_master());

drop policy if exists "commissions_master" on public.application_commissions;
create policy "commissions_master" on public.application_commissions
  for all using (public.is_master()) with check (public.is_master());

-- Tarix: komissiya yozuvlarini faqat master ko'radi
drop policy if exists "events_read" on public.application_events;
create policy "events_read" on public.application_events
  for select using (
    (kind <> 'commission' or public.is_master())
    and exists (
      select 1 from public.applications a
      where a.id = application_events.application_id
        and (a.student_id = auth.uid() or a.university_id = public.my_university() or public.is_master())
    )
  );

-- Universitet xodimi o'z universiteti ma'lumotlarini (tavsif, yo'nalishlar) ko'radi;
-- tahrirlash faqat master (uni_master_write).

-- 7. Talabalar ro'yxati email bilan (master: hammasi; OTM: faqat o'ziga ariza berganlar)
create or replace function public.student_directory()
returns table (id uuid, email text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, u.created_at
  from auth.users u
  where not exists (select 1 from public.staff s where s.user_id = u.id)
    and (public.is_master()
     or exists (select 1 from public.applications a where a.student_id = u.id and a.university_id = public.my_university()));
$$;
grant execute on function public.student_directory() to authenticated;
