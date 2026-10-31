-- =============================================================================
-- UniGoh — Talaba shartnomasi, universitetga yuborish, xabarlar, Telegram bot
--
-- Jarayon:
--   1. Talaba UniGoh–talaba shartnomasini elektron imzolaydi va ariza beradi (NEW)
--   2. UniGoh (bosh administrator) tekshiradi va universitetga yuboradi (SENT).
--      Universitet arizani faqat shundan keyin ko'radi.
--   3. Universitet talabani chaqiradi, o'z shartnomasini tuzadi (EXAM → ADMITTED → CONTRACT → ENROLLED)
--   4. Har bir o'zgarishda talabaga saytda xabar, Telegram ulangan bo'lsa — botdan xabar.
--
-- Qayta ishga tushirish xavfsiz.
-- =============================================================================

create extension if not exists pg_net;

-- -----------------------------------------------------------------------------
-- 1. Yangi holat: SENT (universitetga yuborildi)
-- -----------------------------------------------------------------------------
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check check (status in (
  'NEW', 'SENT', 'DOCS_REVIEW', 'EXAM', 'ADMITTED', 'CONTRACT', 'ENROLLED', 'REJECTED', 'WITHDRAWN'
));
alter table public.applications add column if not exists forwarded_at timestamptz;
alter table public.applications add column if not exists forwarded_by uuid references auth.users(id) on delete set null;

-- Universitet faqat yuborilgan arizalarni ko'radi va o'zgartiradi
drop policy if exists "app_uni_read" on public.applications;
create policy "app_uni_read" on public.applications
  for select to authenticated
  using (university_id = (select public.my_university()) and status <> 'NEW');
drop policy if exists "app_uni_update" on public.applications;
create policy "app_uni_update" on public.applications
  for update to authenticated
  using (university_id = (select public.my_university()) and status <> 'NEW')
  with check (university_id = (select public.my_university()) and status <> 'NEW');

-- -----------------------------------------------------------------------------
-- 2. Profil: til va Telegram
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists lang text not null default 'uz';
alter table public.profiles drop constraint if exists profiles_lang_check;
alter table public.profiles add constraint profiles_lang_check check (lang in ('uz', 'ru'));
alter table public.profiles add column if not exists telegram_chat_id bigint;

-- telegram_chat_id ni faqat bot orqali ulash funksiyasi o'zgartira oladi
create or replace function public.profiles_protect()
returns trigger language plpgsql set search_path = public as $$
begin
  if coalesce(current_setting('unigoh.tg', true), '') <> '1' then
    if tg_op = 'INSERT' then
      new.telegram_chat_id := null;
    else
      new.telegram_chat_id := old.telegram_chat_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before insert or update on public.profiles
  for each row execute function public.profiles_protect();

-- -----------------------------------------------------------------------------
-- 3. Shartnoma shablonlari (UniGoh–talaba) va imzolar
-- -----------------------------------------------------------------------------
create table if not exists public.contract_templates (
  version     integer primary key,
  title_uz    text not null,
  body_uz     text not null,
  title_ru    text not null,
  body_ru     text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null
);
create unique index if not exists contract_templates_one_active on public.contract_templates (is_active) where is_active;

create table if not exists public.student_agreements (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references auth.users(id) on delete cascade,
  template_version  integer not null references public.contract_templates(version),
  lang              text not null default 'uz' check (lang in ('uz', 'ru')),
  full_name         text not null check (length(trim(full_name)) >= 3),
  signature_path    text not null,
  text_hash         text,
  user_agent        text,
  signed_at         timestamptz not null default now(),
  unique (student_id, template_version)
);

create or replace function public.agreements_stamp()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  t public.contract_templates;
begin
  select * into t from public.contract_templates where version = new.template_version;
  if not found or not t.is_active then
    raise exception 'Bu shartnoma versiyasi amalda emas';
  end if;
  new.student_id := auth.uid();
  new.signed_at := now();
  new.text_hash := encode(digest(case when new.lang = 'ru' then t.body_ru else t.body_uz end, 'sha256'), 'hex');
  if new.signature_path not like auth.uid()::text || '/%' then
    raise exception 'Imzo fayli noto''g''ri';
  end if;
  return new;
end;
$$;
drop trigger if exists agreements_stamp on public.student_agreements;
create trigger agreements_stamp before insert on public.student_agreements
  for each row execute function public.agreements_stamp();

alter table public.contract_templates enable row level security;
alter table public.student_agreements enable row level security;

drop policy if exists "templates_read" on public.contract_templates;
create policy "templates_read" on public.contract_templates
  for select to authenticated using (is_active or (select public.is_master()));
drop policy if exists "templates_master" on public.contract_templates;
create policy "templates_master" on public.contract_templates
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

drop policy if exists "agreements_own_read" on public.student_agreements;
create policy "agreements_own_read" on public.student_agreements
  for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "agreements_own_insert" on public.student_agreements;
create policy "agreements_own_insert" on public.student_agreements
  for insert to authenticated with check (student_id = (select auth.uid()));
drop policy if exists "agreements_staff_read" on public.student_agreements;
create policy "agreements_staff_read" on public.student_agreements
  for select to authenticated using (
    (select public.is_master())
    or exists (select 1 from public.applications a where a.student_id = student_agreements.student_id)
  );
-- Imzo o'zgartirilmaydi va o'chirilmaydi
revoke update, delete on public.student_agreements from authenticated, anon;

-- Yangi versiyani e'lon qilish (faqat master)
create or replace function public.publish_contract_template(p_version integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_master() then raise exception 'Faqat master admin'; end if;
  if not exists (select 1 from public.contract_templates where version = p_version) then
    raise exception 'Bunday versiya yo''q';
  end if;
  update public.contract_templates set is_active = false where is_active and version <> p_version;
  update public.contract_templates set is_active = true where version = p_version;
end;
$$;
revoke all on function public.publish_contract_template(integer) from public, anon;
grant execute on function public.publish_contract_template(integer) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Arizalar triggeri: imzo talabi, universitetga yuborish, rollar
-- -----------------------------------------------------------------------------
create or replace function public.applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := public.my_role();
begin
  if tg_op = 'INSERT' then
    if r = 'student' then
      if exists (select 1 from public.contract_templates where is_active)
         and not exists (
           select 1 from public.student_agreements sa
           join public.contract_templates t on t.version = sa.template_version and t.is_active
           where sa.student_id = auth.uid()) then
        raise exception 'AGREEMENT_REQUIRED';
      end if;
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
    if new.status is distinct from old.status
       and not (new.status = 'WITHDRAWN' and old.status in ('NEW', 'SENT', 'DOCS_REVIEW', 'EXAM')) then
      raise exception 'Talaba ariza holatini o''zgartira olmaydi';
    end if;
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.program_id := old.program_id;
    new.program_name := old.program_name;
    new.exam_date := old.exam_date;
    new.note := old.note;
    new.contract_amount := old.contract_amount;
    new.forwarded_at := old.forwarded_at;
    new.forwarded_by := old.forwarded_by;
  elsif r = 'university_admin' then
    if new.status = 'NEW' then
      raise exception 'Universitet arizani UniGoh tekshiruviga qaytara olmaydi';
    end if;
    new.student_id := old.student_id;
    new.university_id := old.university_id;
    new.student_enrolled_claim := old.student_enrolled_claim;
    new.student_claimed_at := old.student_claimed_at;
    new.forwarded_at := old.forwarded_at;
    new.forwarded_by := old.forwarded_by;
  elsif r = 'master' then
    if old.status = 'NEW' and new.status not in ('NEW', 'REJECTED', 'WITHDRAWN') and old.forwarded_at is null then
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

-- Nazorat ko'rinishi: yangi holat bilan
create or replace view public.application_flags
with (security_invoker = true) as
select
  a.id, a.code, a.university_id, a.status, a.student_enrolled_claim,
  case
    when a.student_enrolled_claim = true and a.status in ('REJECTED', 'WITHDRAWN', 'NEW', 'SENT', 'DOCS_REVIEW', 'EXAM')
      then 'Talaba o''qishga kirganini aytmoqda, universitet esa boshqa holat ko''rsatgan'
    when a.student_enrolled_claim = true and a.status in ('ADMITTED', 'CONTRACT')
         and a.student_claimed_at < now() - interval '14 days'
      then 'Talaba 2 haftadan beri o''qishda, universitet to''lovni belgilamagan'
    when a.status = 'NEW' and a.created_at < now() - interval '3 days'
      then '3 kundan beri universitetga yuborilmagan'
    when a.status in ('SENT', 'ADMITTED', 'CONTRACT') and a.updated_at < now() - interval '30 days'
      then '30 kundan beri holat o''zgarmagan'
  end as flag
from public.applications a;
grant select on public.application_flags to authenticated;
revoke all on public.application_flags from anon;

-- -----------------------------------------------------------------------------
-- 5. Xabarlar (saytda) va Telegram
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id              bigint generated always as identity primary key,
  student_id      uuid not null references auth.users(id) on delete cascade,
  application_id  uuid references public.applications(id) on delete cascade,
  kind            text not null,         -- submitted | status | exam | note
  data            jsonb not null default '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists notifications_student_idx on public.notifications (student_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "notifications_own_read" on public.notifications;
create policy "notifications_own_read" on public.notifications
  for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update" on public.notifications
  for update to authenticated using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
revoke insert, delete, update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- Telegram sozlamalari API'ga ochiq bo'lmagan alohida sxemada
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.telegram_config (
  id              boolean primary key default true check (id),
  token           text not null,
  bot_username    text not null,
  webhook_secret  text not null
);

create table if not exists private.telegram_link_codes (
  code        text primary key,
  student_id  uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null
);

-- Xabar matni (Telegram uchun; sayt xuddi shu matnlarni o'zi chiqaradi)
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
    return case when ru
      then 'Ваша заявка принята: ' || uni || ' — ' || prog || '. UniGoh проверит документы и отправит заявку в университет.'
      else 'Arizangiz qabul qilindi: ' || uni || ' — ' || prog || '. UniGoh hujjatlaringizni tekshirib, universitetga yuboradi.' end;
  elsif p_kind = 'exam' then
    return case when ru
      then uni || ': дата собеседования или экзамена — ' || coalesce(dt, '') || '.'
      else uni || ': suhbat yoki imtihon sanasi — ' || coalesce(dt, '') || '.' end;
  elsif p_kind = 'note' then
    return case when ru
      then 'Сообщение от университета ' || uni || ': ' || coalesce(p_data->>'note', '')
      else uni || ' universitetidan xabar: ' || coalesce(p_data->>'note', '') end;
  elsif p_kind = 'status' then
    return case st
      when 'SENT' then case when ru then 'Ваша заявка отправлена в университет: ' || uni || '.' else 'Arizangiz universitetga yuborildi: ' || uni || '.' end
      when 'DOCS_REVIEW' then case when ru then uni || ' рассматривает ваши документы.' else uni || ' hujjatlaringizni ko''rib chiqmoqda.' end
      when 'EXAM' then case when ru then uni || ' приглашает вас на собеседование или экзамен.' else uni || ' sizni suhbat yoki imtihonga chaqirdi.' end
      when 'ADMITTED' then case when ru then 'Поздравляем! ' || uni || ' принял вашу заявку. Университет свяжется с вами для заключения договора.' else 'Tabriklaymiz! ' || uni || ' arizangizni qabul qildi. Universitet shartnoma uchun siz bilan bog''lanadi.' end
      when 'CONTRACT' then case when ru then 'Договор с университетом оформлен: ' || uni || '.' else 'Universitet bilan shartnoma tuzildi: ' || uni || '.' end
      when 'ENROLLED' then case when ru then 'Вы зачислены: ' || uni || '. Желаем успехов в учёбе!' else 'Siz endi talabasiz: ' || uni || '. O''qishingizda omad!' end
      when 'REJECTED' then case when ru then 'К сожалению, заявка в ' || uni || ' отклонена. Вы можете подать заявку в другие университеты.' else 'Afsuski, ' || uni || ' arizangizni rad etdi. Boshqa universitetlarga ham topshirishingiz mumkin.' end
      when 'WITHDRAWN' then case when ru then 'Заявка отозвана: ' || uni || '.' else 'Ariza bekor qilindi: ' || uni || '.' end
      else case when ru then 'Статус заявки изменён: ' || uni || '.' else 'Ariza holati o''zgardi: ' || uni || '.' end
    end;
  end if;
  return '';
end;
$$;

-- Telegram'ga xabar yuborish (xatolik bo'lsa ham asosiy amal to'xtamaydi)
create or replace function public.telegram_send(p_chat bigint, p_text text)
returns void language plpgsql security definer set search_path = public as $$
declare
  cfg private.telegram_config;
begin
  select * into cfg from private.telegram_config where id;
  if not found or p_chat is null or coalesce(p_text, '') = '' then return; end if;
  begin
    perform net.http_post(
      url := 'https://api.telegram.org/bot' || cfg.token || '/sendMessage',
      body := jsonb_build_object('chat_id', p_chat, 'text', p_text, 'disable_web_page_preview', true),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    raise warning 'telegram_send failed: %', sqlerrm;
  end;
end;
$$;
revoke all on function public.telegram_send(bigint, text) from public, anon, authenticated;

create or replace function public.notifications_deliver()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p record;
begin
  select telegram_chat_id, lang into p from public.profiles where id = new.student_id;
  if p.telegram_chat_id is not null then
    perform public.telegram_send(p.telegram_chat_id,
      public.notification_text(new.kind, new.data, coalesce(p.lang, 'uz')) || E'\n\nunigoh.study');
  end if;
  return new;
end;
$$;
revoke all on function public.notifications_deliver() from public, anon, authenticated;
drop trigger if exists notifications_deliver on public.notifications;
create trigger notifications_deliver after insert on public.notifications
  for each row execute function public.notifications_deliver();

-- Ariza o'zgarishlari → talabaga xabar
create or replace function public.applications_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base jsonb;
begin
  base := jsonb_build_object(
    'university', coalesce((select name from public.universities where id = new.university_id), new.university_id),
    'program', coalesce(new.program_name, ''),
    'code', new.code
  );
  if tg_op = 'INSERT' then
    insert into public.notifications (student_id, application_id, kind, data)
    values (new.student_id, new.id, 'submitted', base);
    return new;
  end if;

  if new.status is distinct from old.status and new.status <> 'NEW' then
    insert into public.notifications (student_id, application_id, kind, data)
    values (new.student_id, new.id, 'status', base || jsonb_build_object('status', new.status));
  end if;
  if new.exam_date is not null and new.exam_date is distinct from old.exam_date then
    insert into public.notifications (student_id, application_id, kind, data)
    values (new.student_id, new.id, 'exam', base || jsonb_build_object(
      'date', new.exam_date,
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
drop trigger if exists applications_notify on public.applications;
create trigger applications_notify after insert or update on public.applications
  for each row execute function public.applications_notify();

-- Talaba: Telegram'ni ulash kodi
create or replace function public.telegram_link_code()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  cfg private.telegram_config;
  c text;
begin
  if auth.uid() is null then raise exception 'Tizimga kiring'; end if;
  select * into cfg from private.telegram_config where id;
  if not found then return jsonb_build_object('configured', false); end if;
  delete from private.telegram_link_codes where student_id = auth.uid() or expires_at < now();
  c := encode(gen_random_bytes(9), 'hex');
  insert into private.telegram_link_codes (code, student_id, expires_at) values (c, auth.uid(), now() + interval '30 minutes');
  return jsonb_build_object('configured', true, 'bot', cfg.bot_username, 'code', c);
end;
$$;
revoke all on function public.telegram_link_code() from public, anon;
grant execute on function public.telegram_link_code() to authenticated;

create or replace function public.telegram_unlink()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('unigoh.tg', '1', true);
  update public.profiles set telegram_chat_id = null where id = auth.uid();
end;
$$;
revoke all on function public.telegram_unlink() from public, anon;
grant execute on function public.telegram_unlink() to authenticated;

-- Bot webhook: Telegram → unigoh.study/api/telegram → shu funksiya
create or replace function public.telegram_webhook(p_secret text, p_update jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cfg private.telegram_config;
  chat bigint := (p_update #>> '{message,chat,id}')::bigint;
  txt text := coalesce(p_update #>> '{message,text}', '');
  lc text := coalesce(p_update #>> '{message,from,language_code}', 'uz');
  v_code text;
  sid uuid;
  plang text;
begin
  select * into cfg from private.telegram_config where id;
  if not found or p_secret is null or p_secret <> cfg.webhook_secret then
    return jsonb_build_object('ok', false);
  end if;
  if chat is null then return jsonb_build_object('ok', true); end if;

  if txt like '/start %' then
    v_code := trim(substr(txt, 8));
    select l.student_id into sid from private.telegram_link_codes l where l.code = v_code and l.expires_at > now();
    if sid is null then
      perform public.telegram_send(chat, case when lc = 'ru'
        then 'Ссылка устарела. Откройте свой кабинет на unigoh.study и нажмите «Подключить Telegram» ещё раз.'
        else 'Havola eskirgan. unigoh.study saytida kabinetingizni ochib, «Telegram''ni ulash» tugmasini qayta bosing.' end);
      return jsonb_build_object('ok', true);
    end if;
    delete from private.telegram_link_codes where student_id = sid;
    perform set_config('unigoh.tg', '1', true);
    update public.profiles set telegram_chat_id = chat where id = sid returning lang into plang;
    perform public.telegram_send(chat, case when coalesce(plang, 'uz') = 'ru'
      then 'Готово! Теперь сюда будут приходить уведомления о ваших заявках в UniGoh. Отключить: /stop'
      else 'Tayyor! Endi UniGoh''dagi arizalaringiz haqidagi xabarlar shu yerga keladi. O''chirish uchun: /stop' end);
  elsif txt = '/stop' then
    perform set_config('unigoh.tg', '1', true);
    update public.profiles set telegram_chat_id = null where telegram_chat_id = chat;
    perform public.telegram_send(chat, case when lc = 'ru'
      then 'Уведомления отключены. Включить снова можно в кабинете на unigoh.study.'
      else 'Xabarlar o''chirildi. Qayta yoqish uchun unigoh.study kabinetingizga kiring.' end);
  else
    perform public.telegram_send(chat, case when lc = 'ru'
      then 'Это бот уведомлений UniGoh. Чтобы подключить уведомления, откройте кабинет на unigoh.study и нажмите «Подключить Telegram».'
      else 'Bu UniGoh xabarlar boti. Xabarlarni ulash uchun unigoh.study saytida kabinetingizni ochib, «Telegram''ni ulash» tugmasini bosing.' end);
  end if;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.telegram_webhook(text, jsonb) from public;
grant execute on function public.telegram_webhook(text, jsonb) to anon, authenticated;

-- Botni sozlash: faqat Supabase SQL Editor'dan (egasi) ishga tushiriladi
create or replace function private.telegram_setup(p_token text, p_bot_username text, p_webhook_url text default 'https://unigoh.study/api/telegram')
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  s text := encode(gen_random_bytes(24), 'hex');
begin
  insert into private.telegram_config (id, token, bot_username, webhook_secret)
  values (true, trim(p_token), trim(both '@' from trim(p_bot_username)), s)
  on conflict (id) do update set token = excluded.token, bot_username = excluded.bot_username, webhook_secret = excluded.webhook_secret;
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || trim(p_token) || '/setWebhook',
    body := jsonb_build_object('url', p_webhook_url, 'secret_token', s, 'allowed_updates', jsonb_build_array('message')),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return 'Bot sozlandi: @' || trim(both '@' from trim(p_bot_username));
end;
$$;
revoke all on function private.telegram_setup(text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Shartnoma loyihasi (1-versiya, faol EMAS: admin panelda ko'rib, e'lon qilinadi)
-- -----------------------------------------------------------------------------
insert into public.contract_templates (version, title_uz, body_uz, title_ru, body_ru, is_active)
values (1,
'UniGoh xizmatlaridan foydalanish to''g''risida shartnoma',
$uz$[KOMPANIYA NOMI] (keyingi o'rinlarda — «UniGoh»), STIR [_____], bir tomondan, va ushbu shartnomani elektron imzolagan shaxs (keyingi o'rinlarda — «Talaba»), ikkinchi tomondan, quyidagilar haqida kelishdilar.

1. Shartnoma predmeti
1.1. UniGoh Talabaga unigoh.study platformasi orqali nodavlat oliy ta'lim muassasalariga (keyingi o'rinlarda — «Universitet») ariza topshirishda yordam beradi: Talabaning profili va hujjatlarini qabul qiladi, tekshiradi va Talaba tanlagan Universitetga yuboradi.
1.2. Universitetga qabul qilish to'g'risidagi qarorni Universitet mustaqil qabul qiladi. Ta'lim xizmatlari bo'yicha shartnomani Talaba Universitet bilan alohida tuzadi.

2. Xizmat narxi
2.1. UniGoh xizmatlari Talaba uchun bepul.
2.2. Talaba Universitetga o'qishga kirsa, UniGoh hamkorlik shartnomasi asosida Universitetdan xizmat haqi olishi mumkin. Bu Talabaning kontrakt summasiga ta'sir qilmaydi.

3. Talabaning majburiyatlari
3.1. Profilda va hujjatlarda faqat haqiqiy, o'ziga tegishli ma'lumotlarni taqdim etish.
3.2. Hujjatlarning soxta ekanligi aniqlansa, UniGoh arizani bekor qilish va akkauntni to'xtatish huquqiga ega.
3.3. Universitetga o'qishga kirganini platformada tasdiqlash («O'qishga kirdim» tugmasi).

4. UniGoh majburiyatlari
4.1. Arizani Talaba tanlagan Universitetga o'z vaqtida yuborish.
4.2. Ariza holati, suhbat yoki imtihon sanalari haqida Talabaga saytda va (ulangan bo'lsa) Telegram orqali xabar berish.
4.3. Talabaning shaxsiy ma'lumotlarini faqat ariza topshirish maqsadida qayta ishlash va uchinchi shaxslarga bermaslik (Talaba tanlagan Universitet bundan mustasno).

5. Shaxsiy ma'lumotlar
5.1. Talaba o'z shaxsiy ma'lumotlari va hujjatlari UniGoh tomonidan qayta ishlanishiga va o'zi tanlagan Universitetga yuborilishiga rozilik beradi.
5.2. Talaba istalgan vaqtda arizasini bekor qilishi va ma'lumotlarini o'chirishni so'rashi mumkin.

6. Elektron imzo
6.1. Talaba ushbu shartnomani platformada to'liq ismini yozib va imzo chizib tasdiqlaydi. Tomonlar bunday tasdiqni shartnomaga rozilik sifatida tan oladi.

7. Amal qilish muddati
7.1. Shartnoma imzolangan paytdan kuchga kiradi va Talaba arizalari bo'yicha jarayon tugaguniga qadar amal qiladi.
7.2. Nizolar muzokaralar yo'li bilan, kelishilmasa O'zbekiston Respublikasi qonunchiligiga muvofiq hal qilinadi.

UniGoh rekvizitlari: [KOMPANIYA NOMI], STIR [_____], manzil [_____], telefon [_____].$uz$,
'Договор об использовании сервиса UniGoh',
$ru$[НАЗВАНИЕ КОМПАНИИ] (далее — «UniGoh»), ИНН [_____], с одной стороны, и лицо, подписавшее настоящий договор в электронной форме (далее — «Студент»), с другой стороны, договорились о следующем.

1. Предмет договора
1.1. UniGoh помогает Студенту подать заявку в негосударственные высшие учебные заведения (далее — «Университет») через платформу unigoh.study: принимает и проверяет профиль и документы Студента и направляет их в выбранный Студентом Университет.
1.2. Решение о зачислении Университет принимает самостоятельно. Договор на оказание образовательных услуг Студент заключает с Университетом отдельно.

2. Стоимость
2.1. Услуги UniGoh для Студента бесплатны.
2.2. Если Студент зачислен в Университет, UniGoh может получить вознаграждение от Университета по договору о сотрудничестве. Это не влияет на стоимость обучения Студента.

3. Обязанности Студента
3.1. Указывать в профиле и документах только достоверные сведения о себе.
3.2. Если документы окажутся поддельными, UniGoh вправе отменить заявку и заблокировать аккаунт.
3.3. Подтвердить зачисление в Университет на платформе (кнопка «Я поступил(а)»).

4. Обязанности UniGoh
4.1. Своевременно направить заявку в выбранный Студентом Университет.
4.2. Сообщать Студенту о статусе заявки, датах собеседований и экзаменов на сайте и (если подключено) в Telegram.
4.3. Обрабатывать персональные данные Студента только для подачи заявок и не передавать их третьим лицам, кроме выбранного Студентом Университета.

5. Персональные данные
5.1. Студент даёт согласие на обработку своих персональных данных и документов UniGoh и на их передачу в выбранный им Университет.
5.2. Студент вправе в любое время отозвать заявку и потребовать удаления своих данных.

6. Электронная подпись
6.1. Студент подтверждает настоящий договор на платформе, указав полное имя и поставив подпись. Стороны признают такое подтверждение согласием с договором.

7. Срок действия
7.1. Договор вступает в силу с момента подписания и действует до завершения процесса по заявкам Студента.
7.2. Споры решаются путём переговоров, а при недостижении согласия — в соответствии с законодательством Республики Узбекистан.

Реквизиты UniGoh: [НАЗВАНИЕ КОМПАНИИ], ИНН [_____], адрес [_____], телефон [_____].$ru$,
false)
on conflict (version) do nothing;
