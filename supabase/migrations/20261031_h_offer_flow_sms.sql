-- =============================================================================
-- UniGoh — Yangi jarayon: universitet qaror chiqaradi → talaba rozilik beradi →
-- UniGoh talabani universitetga yuboradi. Xabarlar: saytda + SMS (Telegram o'rniga).
--
--   NEW         → talaba ariza topshirdi (universitet ko'radi, lekin telefon/email yashirin)
--   DOCS_REVIEW → universitet ko'rib chiqmoqda
--   EXAM        → suhbat yoki imtihon (ixtiyoriy)
--   ADMITTED    → universitet qabul qildi → talabaga SMS → talaba saytda rozilik beradi
--   REJECTED    → universitet rad etdi → talabaga SMS
--   SENT        → talaba rozi bo'ldi (va shartnoma e'lon qilingan bo'lsa — imzoladi);
--                 universitetga SMS, telefon va email ochiladi
--   CONTRACT    → universitet talaba bilan shartnoma tuzdi
--   ENROLLED    → to'lov qildi (komissiya)
--
-- Qayta ishga tushirish xavfsiz.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Universitet barcha arizalarini ko'radi (qaror chiqarishi uchun)
-- -----------------------------------------------------------------------------
drop policy if exists "app_uni_read" on public.applications;
create policy "app_uni_read" on public.applications
  for select to authenticated using (university_id = (select public.my_university()));
drop policy if exists "app_uni_update" on public.applications;
create policy "app_uni_update" on public.applications
  for update to authenticated
  using (university_id = (select public.my_university()))
  with check (university_id = (select public.my_university()));

-- -----------------------------------------------------------------------------
-- 2. Profillar: universitet faqat maxsus funksiya orqali, kontaktlar yashirin holda
-- -----------------------------------------------------------------------------
drop policy if exists "profile_staff_select" on public.profiles;
create policy "profile_staff_select" on public.profiles
  for select to authenticated using ((select public.is_master()));

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
    p.test_score::numeric, to_jsonb(p.certificates), p.documents, p.diploma_url::text, p.portfolio_url::text,
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

-- Talabalar ro'yxati: email ham rozilikdan keyin ochiladi
drop function if exists public.student_directory();
create or replace function public.student_directory()
returns table (id uuid, email text, created_at timestamptz, contact_visible boolean)
language sql stable security definer set search_path = public as $$
  with me as (select public.is_master() as master, public.my_university() as uni)
  select u.id,
         case when v.visible then u.email::text end,
         u.created_at,
         v.visible
  from auth.users u
  cross join me
  cross join lateral (
    select me.master or exists (
      select 1 from public.applications a
      where a.student_id = u.id and a.university_id = me.uni and a.forwarded_at is not null
    ) as visible
  ) v
  where not exists (select 1 from public.staff s where s.user_id = u.id)
    and (me.master or exists (select 1 from public.applications a where a.student_id = u.id and a.university_id = me.uni));
$$;
revoke all on function public.student_directory() from public, anon;
grant execute on function public.student_directory() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Holat o'tishlari
-- -----------------------------------------------------------------------------
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
      if old.status not in ('SENT', 'CONTRACT', 'ENROLLED') then
        raise exception 'Hali universitetga yuborilmagan';
      end if;
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

-- Talaba qabul taklifiga rozilik beradi (shartnoma e'lon qilingan bo'lsa — imzo shart)
create or replace function public.accept_offer(p_application uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.applications;
begin
  select * into a from public.applications where id = p_application and student_id = auth.uid();
  if not found then raise exception 'Ariza topilmadi'; end if;
  if a.status <> 'ADMITTED' then raise exception 'Bu ariza hali qabul qilinmagan'; end if;
  if exists (select 1 from public.contract_templates where is_active)
     and not exists (
       select 1 from public.student_agreements sa
       join public.contract_templates t on t.version = sa.template_version and t.is_active
       where sa.student_id = auth.uid()) then
    raise exception 'AGREEMENT_REQUIRED';
  end if;
  perform set_config('unigoh.offer', '1', true);
  update public.applications set status = 'SENT' where id = p_application;
  perform set_config('unigoh.offer', '', true);
end;
$$;
revoke all on function public.accept_offer(uuid) from public, anon;
grant execute on function public.accept_offer(uuid) to authenticated;

-- Nazorat ko'rinishi
create or replace view public.application_flags
with (security_invoker = true) as
select
  a.id, a.code, a.university_id, a.status, a.student_enrolled_claim,
  case
    when a.student_enrolled_claim = true and a.status in ('REJECTED', 'WITHDRAWN', 'SENT')
         and a.student_claimed_at < now() - interval '3 days'
      then 'Talaba o''qishga kirganini aytmoqda, universitet esa buni belgilamagan'
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

-- -----------------------------------------------------------------------------
-- 4. Saytdagi xabar matnlari (yangi jarayonga moslab)
-- -----------------------------------------------------------------------------
create or replace function public.notification_text(p_kind text, p_data jsonb, p_lang text)
returns text language plpgsql immutable set search_path = public as $$
declare
  uni text := coalesce(p_data->>'university', '');
  prog text := coalesce(p_data->>'program', '');
  st text := p_data->>'status';
  dt text := p_data->>'date_local';
  ru boolean := p_lang = 'ru';
begin
  if p_kind = 'submitted' then
    return case when ru then 'Заявка подана: ' || uni || ' — ' || prog || '. Университет рассмотрит её, ответ придёт по SMS.'
      else 'Ariza topshirildi: ' || uni || ' — ' || prog || '. Universitet ko''rib chiqadi, javob SMS orqali keladi.' end;
  elsif p_kind = 'exam' then
    return case when ru then uni || ': дата собеседования или экзамена — ' || coalesce(dt, '') || '.'
      else uni || ': suhbat yoki imtihon sanasi — ' || coalesce(dt, '') || '.' end;
  elsif p_kind = 'note' then
    return case when ru then 'Сообщение от университета ' || uni || ': ' || coalesce(p_data->>'note', '')
      else uni || ' universitetidan xabar: ' || coalesce(p_data->>'note', '') end;
  end if;
  return '';
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. SMS navbati (Eskiz orqali, unigoh.study/api/sms funksiyasi yuboradi)
-- -----------------------------------------------------------------------------
create table if not exists public.sms_outbox (
  id              bigint generated always as identity primary key,
  recipient       text not null,             -- 'student' | 'university'
  phone           text,
  body            text not null,
  application_id  uuid references public.applications(id) on delete set null,
  status          text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'invalid', 'skipped')),
  provider_id     text,
  error           text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);
alter table public.sms_outbox enable row level security;
drop policy if exists "sms_master_read" on public.sms_outbox;
create policy "sms_master_read" on public.sms_outbox
  for select to authenticated using ((select public.is_master()));
revoke insert, update, delete on public.sms_outbox from authenticated, anon;

create table if not exists private.sms_config (
  id        boolean primary key default true check (id),
  endpoint  text not null,
  secret    text not null
);
alter table private.sms_config enable row level security;

-- O'zbekiston raqamini 998XXXXXXXXX ko'rinishiga keltirish
create or replace function public.normalize_uz_phone(p text)
returns text language sql immutable as $$
  select case
    when d ~ '^998[0-9]{9}$' then d
    when d ~ '^[0-9]{9}$' then '998' || d
    else null end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x;
$$;

create or replace function public.sms_enqueue(p_recipient text, p_phone text, p_body text, p_app uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  ph text := public.normalize_uz_phone(p_phone);
begin
  insert into public.sms_outbox (recipient, phone, body, application_id, status, error)
  values (p_recipient, coalesce(ph, p_phone), p_body, p_app,
          case when ph is null then 'invalid' else 'queued' end,
          case when ph is null then 'Telefon raqami noto''g''ri yoki kiritilmagan' end);
end;
$$;
revoke all on function public.sms_enqueue(text, text, text, uuid) from public, anon, authenticated;

create or replace function public.sms_deliver()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cfg private.sms_config;
begin
  if new.status <> 'queued' then return new; end if;
  select * into cfg from private.sms_config where id;
  if not found then return new; end if;   -- sozlanmagan: navbatda qoladi
  begin
    perform net.http_post(
      url := cfg.endpoint,
      body := jsonb_build_object('id', new.id, 'phone', new.phone, 'message', new.body),
      headers := jsonb_build_object('Content-Type', 'application/json', 'X-UniGoh-Secret', cfg.secret)
    );
  exception when others then
    raise warning 'sms_deliver failed: %', sqlerrm;
  end;
  return new;
end;
$$;
revoke all on function public.sms_deliver() from public, anon, authenticated;
drop trigger if exists sms_deliver on public.sms_outbox;
create trigger sms_deliver after insert on public.sms_outbox
  for each row execute function public.sms_deliver();

-- /api/sms natijani shu yerga qaytaradi
create or replace function public.sms_report(p_secret text, p_id bigint, p_status text, p_provider_id text, p_error text)
returns void language plpgsql security definer set search_path = public as $$
declare
  cfg private.sms_config;
begin
  select * into cfg from private.sms_config where id;
  if not found or p_secret is null or p_secret <> cfg.secret then return; end if;
  update public.sms_outbox
     set status = case when p_status in ('sent', 'failed') then p_status else status end,
         provider_id = p_provider_id, error = left(p_error, 500),
         sent_at = case when p_status = 'sent' then now() else sent_at end
   where id = p_id;
end;
$$;
revoke all on function public.sms_report(text, bigint, text, text, text) from public;
grant execute on function public.sms_report(text, bigint, text, text, text) to anon, authenticated;

-- Navbatda qolganlarni qayta yuborish (sozlangandan keyin yoki xatodan so'ng) — faqat master
create or replace function public.sms_retry(p_id bigint default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  cfg private.sms_config;
  m record;
  n integer := 0;
begin
  if not public.is_master() and current_user not in ('postgres', 'supabase_admin') then raise exception 'Faqat master admin'; end if;
  select * into cfg from private.sms_config where id;
  if not found then raise exception 'SMS hali sozlanmagan'; end if;
  for m in select * from public.sms_outbox where status in ('queued', 'failed') and (p_id is null or id = p_id) order by id limit 200 loop
    update public.sms_outbox set status = 'queued', error = null where id = m.id;
    perform net.http_post(
      url := cfg.endpoint,
      body := jsonb_build_object('id', m.id, 'phone', m.phone, 'message', m.body),
      headers := jsonb_build_object('Content-Type', 'application/json', 'X-UniGoh-Secret', cfg.secret)
    );
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.sms_retry(bigint) from public, anon;
grant execute on function public.sms_retry(bigint) to authenticated;

-- Sozlash: Supabase SQL Editor'dan bir marta (sir so'z Vercel'dagi SMS_SECRET bilan bir xil bo'lsin)
create or replace function private.sms_setup(p_secret text, p_endpoint text default 'https://unigoh.study/api/sms')
returns text language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p_secret, '')) < 24 then raise exception 'Sir so''z kamida 24 belgi bo''lsin'; end if;
  insert into private.sms_config (id, endpoint, secret) values (true, p_endpoint, p_secret)
  on conflict (id) do update set endpoint = excluded.endpoint, secret = excluded.secret;
  return 'SMS sozlandi: ' || p_endpoint;
end;
$$;
revoke all on function private.sms_setup(text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Ariza o'zgarishlari → saytdagi xabar + SMS
-- -----------------------------------------------------------------------------
create or replace function public.applications_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base jsonb;
  p record;
  uni record;
  t record;
  ru boolean;
begin
  select name, code into uni from public.universities where id = new.university_id;
  base := jsonb_build_object('university', coalesce(uni.name, new.university_id), 'program', coalesce(new.program_name, ''), 'code', new.code);

  if tg_op = 'INSERT' then
    insert into public.notifications (student_id, application_id, kind, data) values (new.student_id, new.id, 'submitted', base);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.notifications (student_id, application_id, kind, data)
    values (new.student_id, new.id, 'status', base || jsonb_build_object('status', new.status));

    -- Talabaga SMS: universitet javob berdi
    if new.status in ('ADMITTED', 'REJECTED') then
      select phone, lang into p from public.profiles where id = new.student_id;
      ru := coalesce(p.lang, 'uz') = 'ru';
      perform public.sms_enqueue('student', p.phone,
        case when ru
          then 'UniGoh: по вашей заявке ' || new.code || ' (' || coalesce(uni.code, '') || ') есть ответ. Результат на сайте unigoh.study'
          else 'UniGoh: ' || new.code || ' (' || coalesce(uni.code, '') || ') arizangiz bo''yicha javob chiqdi. Natijani unigoh.study saytida ko''ring.' end,
        new.id);
    end if;

    -- Universitetga SMS: talaba rozilik berdi va yuborildi
    if new.status = 'SENT' and old.status is distinct from 'SENT' then
      select contact_phone into t from public.university_terms where university_id = new.university_id;
      if t.contact_phone is not null then
        perform public.sms_enqueue('university', t.contact_phone,
          'UniGoh: sizga yangi talaba yuborildi (' || new.code || '). Ma''lumotlar admin panelda. Iltimos, talaba bilan bog''laning.',
          new.id);
      end if;
    end if;
  end if;

  if new.exam_date is not null and new.exam_date is distinct from old.exam_date then
    insert into public.notifications (student_id, application_id, kind, data)
    values (new.student_id, new.id, 'exam', base || jsonb_build_object('date', new.exam_date,
      'date_local', to_char(new.exam_date at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI')));
  end if;
  if coalesce(new.note, '') <> '' and new.note is distinct from old.note then
    insert into public.notifications (student_id, application_id, kind, data)
    values (new.student_id, new.id, 'note', base || jsonb_build_object('note', new.note));
  end if;
  return new;
end;
$$;
revoke all on function public.applications_notify() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Telegram o'chiriladi (SMS ishlatiladi)
-- -----------------------------------------------------------------------------
drop trigger if exists notifications_deliver on public.notifications;
revoke all on function public.telegram_webhook(text, jsonb) from public, anon, authenticated;
revoke all on function public.telegram_link_code() from public, anon, authenticated;
revoke all on function public.telegram_unlink() from public, anon, authenticated;
