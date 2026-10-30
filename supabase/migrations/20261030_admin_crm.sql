-- =============================================================================
-- UniGoh — Admin CRM, ariza jarayoni va komissiya tizimi
-- Supabase → SQL Editor ga to'liq tashlab, "Run" bosing.
-- Qayta ishga tushirish xavfsiz (idempotent): mavjud ma'lumotlar o'chmaydi.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. UNIVERSITETLAR
-- -----------------------------------------------------------------------------
create table if not exists public.universities (
  id               text primary key,                 -- masalan: 'isft-andijan'
  code             text not null,                    -- masalan: 'ISFT'
  name             text not null,
  region           text,
  commission_rate  numeric(4,2) not null default 4.00
                   check (commission_rate >= 0 and commission_rate <= 100),  -- UniGoh ulushi, %
  is_active        boolean not null default true,
  programs         jsonb not null default '[]'::jsonb,  -- [{id,name,degree,duration,tuition}]
  details          jsonb not null default '{}'::jsonb,  -- katalog uchun qo'shimcha ma'lumotlar
  contact_name     text,
  contact_phone    text,
  created_at       timestamptz not null default now()
);

-- Eski sxemadan qolgan jadval bo'lsa, yetishmayotgan ustunlarni qo'shamiz
alter table public.universities add column if not exists commission_rate numeric(4,2) not null default 4.00;
alter table public.universities add column if not exists is_active boolean not null default true;
alter table public.universities add column if not exists programs jsonb not null default '[]'::jsonb;
alter table public.universities add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.universities add column if not exists contact_name text;
alter table public.universities add column if not exists contact_phone text;

-- -----------------------------------------------------------------------------
-- 2. XODIMLAR (admin panelga kira oladiganlar)
--    role = 'master'           → siz: hamma narsani ko'radi va boshqaradi
--    role = 'university_admin' → faqat o'z universiteti arizalarini ko'radi
-- -----------------------------------------------------------------------------
create table if not exists public.staff (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  role           text not null check (role in ('master', 'university_admin')),
  university_id  text references public.universities(id) on delete set null,
  full_name      text,
  created_at     timestamptz not null default now(),
  check (role = 'master' or university_id is not null)
);

-- -----------------------------------------------------------------------------
-- 3. ARIZALAR
-- -----------------------------------------------------------------------------
create sequence if not exists public.application_code_seq start 1001;

create table if not exists public.applications (
  id                     uuid primary key default gen_random_uuid(),
  code                   text unique not null
                         default ('UG-' || to_char(now(), 'YY') || '-' || nextval('public.application_code_seq')),
  student_id             uuid not null references auth.users(id) on delete cascade,
  university_id          text not null references public.universities(id),
  program_id             text,
  program_name           text,
  status                 text not null default 'NEW' check (status in (
                           'NEW',          -- Yangi
                           'DOCS_REVIEW',  -- Hujjatlar tekshiruvda
                           'EXAM',         -- Imtihonga chaqirildi
                           'ADMITTED',     -- Qabul qilindi
                           'CONTRACT',     -- Shartnoma tuzildi
                           'ENROLLED',     -- To'lov qildi, o'qishga kirdi → komissiya
                           'REJECTED',     -- Rad etildi
                           'WITHDRAWN'     -- Talaba voz kechdi
                         )),
  exam_date              timestamptz,
  note                   text,                     -- OTM / admin izohi
  contract_amount        bigint check (contract_amount is null or contract_amount >= 0),  -- 1-yil kontrakt, so'm
  commission_rate        numeric(4,2),             -- ENROLLED paytidagi foiz (keyin o'zgarmaydi)
  commission_amount      bigint generated always as
                           (round(coalesce(contract_amount, 0) * coalesce(commission_rate, 0) / 100.0)::bigint) stored,
  commission_status      text not null default 'none'
                         check (commission_status in ('none', 'pending', 'invoiced', 'paid')),
  commission_paid_at     timestamptz,
  student_enrolled_claim boolean,                  -- talabaning o'zi "o'qishga kirdim" dedi
  student_claimed_at     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (student_id, university_id, program_id)
);

create index if not exists applications_university_idx on public.applications (university_id, status);
create index if not exists applications_student_idx on public.applications (student_id);

-- -----------------------------------------------------------------------------
-- 4. ARIZA TARIXI (har bir o'zgarish: kim, qachon, nima)
-- -----------------------------------------------------------------------------
create table if not exists public.application_events (
  id              bigint generated always as identity primary key,
  application_id  uuid not null references public.applications(id) on delete cascade,
  actor_id        uuid references auth.users(id) on delete set null,
  actor_role      text,                -- 'student' | 'university_admin' | 'master'
  kind            text not null,       -- 'created' | 'status' | 'contract' | 'commission' | 'student_claim' | 'note'
  from_value      text,
  to_value        text,
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists application_events_app_idx on public.application_events (application_id, created_at);

-- -----------------------------------------------------------------------------
-- 5. YORDAMCHI FUNKSIYALAR (RLS uchun)
-- -----------------------------------------------------------------------------
create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'master');
$$;

create or replace function public.my_university()
returns text language sql stable security definer set search_path = public as $$
  select university_id from public.staff where user_id = auth.uid() and role = 'university_admin';
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.staff where user_id = auth.uid()), 'student');
$$;

-- -----------------------------------------------------------------------------
-- 6. TRIGGERLAR: kim nimani o'zgartira olishini nazorat qilish + tarix
-- -----------------------------------------------------------------------------
create or replace function public.applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := public.my_role();
begin
  if tg_op = 'INSERT' then
    -- Talaba faqat o'zi uchun, faqat "Yangi" holatda ariza ochadi
    if r = 'student' then
      new.student_id := auth.uid();
      new.status := 'NEW';
      new.contract_amount := null;
      new.commission_rate := null;
      new.commission_status := 'none';
      new.student_enrolled_claim := null;
    end if;
    return new;
  end if;

  -- UPDATE
  if r = 'student' then
    -- Talaba faqat "o'qishga kirdim" tasdig'ini o'zgartira oladi yoki arizadan voz kechadi
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
    new.commission_rate := old.commission_rate;
    new.commission_status := old.commission_status;
    new.commission_paid_at := old.commission_paid_at;
  elsif r = 'university_admin' then
    -- OTM: holat, imtihon sanasi, izoh, kontrakt summasi. Komissiya va talaba tasdig'i — yo'q
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.commission_rate := old.commission_rate;
    new.commission_status := old.commission_status;
    new.commission_paid_at := old.commission_paid_at;
    new.student_enrolled_claim := old.student_enrolled_claim;
    new.student_claimed_at := old.student_claimed_at;
  end if;

  -- ENROLLED bo'lganda: kontrakt summasi majburiy, foiz muzlatiladi, komissiya "kutilmoqda"
  if new.status = 'ENROLLED' then
    if new.contract_amount is null or new.contract_amount = 0 then
      raise exception 'O''qishga kirdi holati uchun 1-yil kontrakt summasini kiriting';
    end if;
    if new.commission_rate is null then
      select commission_rate into new.commission_rate from public.universities where id = new.university_id;
    end if;
    if new.commission_status = 'none' then
      new.commission_status := 'pending';
    end if;
  end if;

  if new.commission_status = 'paid' and old.commission_status is distinct from 'paid' then
    new.commission_paid_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists applications_guard on public.applications;
create trigger applications_guard
  before insert or update on public.applications
  for each row execute function public.applications_guard();

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
  end if;
  if new.contract_amount is distinct from old.contract_amount then
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value)
    values (new.id, auth.uid(), r, 'contract', old.contract_amount::text, new.contract_amount::text);
  end if;
  if new.commission_status is distinct from old.commission_status then
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value)
    values (new.id, auth.uid(), r, 'commission', old.commission_status, new.commission_status);
  end if;
  if new.student_enrolled_claim is distinct from old.student_enrolled_claim then
    insert into public.application_events (application_id, actor_id, actor_role, kind, from_value, to_value)
    values (new.id, auth.uid(), r, 'student_claim', old.student_enrolled_claim::text, new.student_enrolled_claim::text);
  end if;
  return new;
end;
$$;

drop trigger if exists applications_log on public.applications;
create trigger applications_log
  after insert or update on public.applications
  for each row execute function public.applications_log();

-- -----------------------------------------------------------------------------
-- 7. NAZORAT KO'RINISHI: talaba va OTM ma'lumotlari mos kelmasa
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 8. XODIM TAYINLASH (faqat master). Odam avval admin panelda ro'yxatdan o'tadi,
--    keyin siz uni email orqali OTM'ga biriktirasiz.
-- -----------------------------------------------------------------------------
create or replace function public.assign_staff(p_email text, p_role text, p_university text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
begin
  if not public.is_master() then
    raise exception 'Faqat master admin xodim tayinlay oladi';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then
    -- Hali ro'yxatdan o'tmagan: taklif saqlanadi, ro'yxatdan o'tishi bilan rol beriladi
    insert into public.staff_invites (email, role, university_id)
    values (lower(trim(p_email)), p_role, case when p_role = 'master' then null else p_university end)
    on conflict (email) do update set role = excluded.role, university_id = excluded.university_id;
    return;
  end if;
  insert into public.staff (user_id, role, university_id, full_name)
  values (uid, p_role, case when p_role = 'master' then null else p_university end,
          (select raw_user_meta_data->>'full_name' from auth.users where id = uid))
  on conflict (user_id) do update
    set role = excluded.role, university_id = excluded.university_id;
end;
$$;

create or replace function public.remove_staff(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_master() then
    raise exception 'Faqat master admin';
  end if;
  if p_user = auth.uid() then
    raise exception 'O''zingizni o''chira olmaysiz';
  end if;
  delete from public.staff where user_id = p_user;
end;
$$;

-- Xodimlar ro'yxati email bilan (faqat master ko'radi)
create or replace function public.list_staff()
returns table (user_id uuid, email text, role text, university_id text, full_name text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.user_id, u.email::text, s.role, s.university_id, s.full_name, s.created_at
  from public.staff s join auth.users u on u.id = s.user_id
  where public.is_master()
  order by s.created_at;
$$;

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.universities       enable row level security;
alter table public.staff              enable row level security;
alter table public.applications       enable row level security;
alter table public.application_events enable row level security;
alter table public.profiles           enable row level security;

-- Universitetlar: hamma faollarini ko'radi, faqat master o'zgartiradi
drop policy if exists "uni_read" on public.universities;
create policy "uni_read" on public.universities
  for select using (is_active or public.is_master() or id = public.my_university());
drop policy if exists "uni_master_write" on public.universities;
create policy "uni_master_write" on public.universities
  for all using (public.is_master()) with check (public.is_master());

-- Xodimlar: o'z yozuvini ko'radi; master hammasini
drop policy if exists "staff_read" on public.staff;
create policy "staff_read" on public.staff
  for select using (user_id = auth.uid() or public.is_master());
drop policy if exists "staff_master_write" on public.staff;
create policy "staff_master_write" on public.staff
  for all using (public.is_master()) with check (public.is_master());

-- Arizalar
drop policy if exists "app_student_read" on public.applications;
create policy "app_student_read" on public.applications
  for select using (student_id = auth.uid());
drop policy if exists "app_student_insert" on public.applications;
create policy "app_student_insert" on public.applications
  for insert with check (student_id = auth.uid());
drop policy if exists "app_student_update" on public.applications;
create policy "app_student_update" on public.applications
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "app_uni_read" on public.applications;
create policy "app_uni_read" on public.applications
  for select using (university_id = public.my_university());
drop policy if exists "app_uni_update" on public.applications;
create policy "app_uni_update" on public.applications
  for update using (university_id = public.my_university())
  with check (university_id = public.my_university());

drop policy if exists "app_master_all" on public.applications;
create policy "app_master_all" on public.applications
  for all using (public.is_master()) with check (public.is_master());

-- Tarix: ko'ra oladigan arizasining tarixini ko'radi. Yozish faqat trigger orqali.
drop policy if exists "events_read" on public.application_events;
create policy "events_read" on public.application_events
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_events.application_id
        and (a.student_id = auth.uid() or a.university_id = public.my_university() or public.is_master())
    )
  );

-- Profillar: talaba o'zinikini; OTM faqat o'ziga ariza bergan talabanikini; master hammasini
drop policy if exists "profile_own_select" on public.profiles;
create policy "profile_own_select" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profile_own_insert" on public.profiles;
create policy "profile_own_insert" on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists "profile_own_update" on public.profiles;
create policy "profile_own_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profile_staff_select" on public.profiles;
create policy "profile_staff_select" on public.profiles
  for select using (
    public.is_master()
    or exists (
      select 1 from public.applications a
      where a.student_id = profiles.id and a.university_id = public.my_university()
    )
  );

grant select on public.application_flags to authenticated;
grant execute on function public.assign_staff(text, text, text) to authenticated;
grant execute on function public.remove_staff(uuid) to authenticated;
grant execute on function public.list_staff() to authenticated;

-- -----------------------------------------------------------------------------
-- 10. XODIM TAKLIFLARI: email oldindan yoziladi. Odam ro'yxatdan o'tishi bilan
--     (yoki allaqachon ro'yxatdan o'tgan bo'lsa — darhol) rol avtomatik beriladi.
-- -----------------------------------------------------------------------------
create table if not exists public.staff_invites (
  email          text primary key,
  role           text not null check (role in ('master', 'university_admin')),
  university_id  text references public.universities(id) on delete cascade,
  created_at     timestamptz not null default now(),
  check (role = 'master' or university_id is not null)
);
alter table public.staff_invites enable row level security;
drop policy if exists "invites_master" on public.staff_invites;
create policy "invites_master" on public.staff_invites
  for all using (public.is_master()) with check (public.is_master());

create or replace function public.apply_staff_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.staff_invites;
begin
  select * into inv from public.staff_invites where email = lower(new.email);
  if found then
    insert into public.staff (user_id, role, university_id, full_name)
    values (new.id, inv.role, inv.university_id, new.raw_user_meta_data->>'full_name')
    on conflict (user_id) do update set role = excluded.role, university_id = excluded.university_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_staff_invite on auth.users;
create trigger on_auth_user_staff_invite
  after insert on auth.users
  for each row execute function public.apply_staff_invite();

-- Taklif qo'shilganda, odam allaqachon ro'yxatdan o'tgan bo'lsa — darhol biriktirish
create or replace function public.apply_invite_to_existing()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email));
  insert into public.staff (user_id, role, university_id, full_name)
  select u.id, new.role, new.university_id, u.raw_user_meta_data->>'full_name'
  from auth.users u where lower(u.email) = new.email
  on conflict (user_id) do update set role = excluded.role, university_id = excluded.university_id;
  return new;
end;
$$;

drop trigger if exists staff_invites_apply on public.staff_invites;
create trigger staff_invites_apply
  before insert or update on public.staff_invites
  for each row execute function public.apply_invite_to_existing();
