-- =============================================================================
-- k. Grant competition
--   Application with a motivation letter, minimum exam score and up to 3 ranked choices.
--   Review fee covers the application review.
--   Reviews and decisions are visible to master admins only.
--   Results are published to everyone at once (site letter + SMS).
-- =============================================================================

-- 1. Settings (single row)
create table if not exists public.grant_settings (
  id                  boolean primary key default true check (id),
  season              integer not null default 2026,
  fee                 integer not null default 199000,
  min_dtm             numeric not null default 65,
  accepting           boolean not null default true,
  deadline            date,
  results_published_at timestamptz,
  updated_at          timestamptz not null default now()
);
insert into public.grant_settings (id) values (true) on conflict do nothing;
alter table public.grant_settings enable row level security;
drop policy if exists "grant_settings_read" on public.grant_settings;
create policy "grant_settings_read" on public.grant_settings for select using (true);
drop policy if exists "grant_settings_master" on public.grant_settings;
create policy "grant_settings_master" on public.grant_settings
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- 2. Applications (students see their own; decisions live elsewhere)
create sequence if not exists public.grant_code_seq start 1001;
create table if not exists public.grant_applications (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null default ('GR-' || to_char(now(), 'YY') || '-' || nextval('public.grant_code_seq')),
  season        integer not null,
  student_id    uuid not null references auth.users(id) on delete cascade,
  full_name     text,
  dtm_score     numeric not null,
  choices       jsonb not null,            -- [{university_id, university, program_id, program}]
  motivation    text not null,
  fee_status    text not null default 'unpaid' check (fee_status in ('unpaid', 'paid', 'waived')),
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (student_id, season)
);
create index if not exists grant_applications_season_idx on public.grant_applications (season, created_at desc);
alter table public.grant_applications enable row level security;
drop policy if exists "grant_app_own_read" on public.grant_applications;
create policy "grant_app_own_read" on public.grant_applications
  for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "grant_app_master" on public.grant_applications;
create policy "grant_app_master" on public.grant_applications
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));
-- Students never write directly, only through grant_submit()

-- 3. Reviews and decisions (master only)
create table if not exists public.grant_reviews (
  application_id  uuid primary key references public.grant_applications(id) on delete cascade,
  score           numeric check (score between 0 and 100),
  decision        text check (decision in ('ACCEPTED', 'WAITLISTED', 'REJECTED')),
  award_percent   integer check (award_percent in (25, 50, 75, 100)),
  award_university_id text,
  award_program   text,
  funded_by       text check (funded_by in ('university', 'unigoh')),
  note            text,                    -- internal note, hidden from the student
  reviewed_by     uuid references auth.users(id) on delete set null,
  updated_at      timestamptz not null default now()
);
alter table public.grant_reviews enable row level security;
drop policy if exists "grant_reviews_master" on public.grant_reviews;
create policy "grant_reviews_master" on public.grant_reviews
  for all to authenticated using ((select public.is_master())) with check ((select public.is_master()));

-- 4. Student submits or edits (before payment)
create or replace function public.grant_submit(p_motivation text, p_choices jsonb)
returns public.grant_applications
language plpgsql security definer set search_path = public as $$
declare
  s     public.grant_settings;
  prof  public.profiles;
  uid   uuid := auth.uid();
  clean jsonb := '[]'::jsonb;
  c     jsonb;
  u     public.universities;
  prog  jsonb;
  seen  text[] := '{}';
  v_row public.grant_applications;
  mot   text := trim(coalesce(p_motivation, ''));
begin
  if uid is null then raise exception 'Avval tizimga kiring'; end if;
  if exists (select 1 from public.staff where user_id = uid) then raise exception 'Xodim akkaunti grantga topshira olmaydi'; end if;
  select * into s from public.grant_settings where id;
  if not s.accepting or s.results_published_at is not null or (s.deadline is not null and current_date > s.deadline) then
    raise exception 'GRANT_CLOSED';
  end if;
  select * into prof from public.profiles where id = uid;
  if prof.id is null or coalesce(trim(prof.full_name), '') = '' or coalesce(trim(prof.phone), '') = '' then
    raise exception 'PROFILE_INCOMPLETE';
  end if;
  if prof.test_score is null or prof.test_score < s.min_dtm then
    raise exception 'DTM_LOW';
  end if;
  if length(mot) < 300 or length(mot) > 5000 then raise exception 'MOTIVATION_LENGTH'; end if;
  if jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) < 1 or jsonb_array_length(p_choices) > 3 then
    raise exception 'CHOICES_COUNT';
  end if;
  for c in select * from jsonb_array_elements(p_choices) loop
    select * into u from public.universities where id = c->>'university_id' and is_active;
    if u.id is null then raise exception 'Universitet topilmadi'; end if;
    if u.id = any(seen) then raise exception 'CHOICES_DUPLICATE'; end if;
    seen := seen || u.id;
    select p into prog from jsonb_array_elements(u.programs) p where p->>'id' = c->>'program_id';
    if prog is null then raise exception 'Yo''nalish topilmadi'; end if;
    clean := clean || jsonb_build_object('university_id', u.id, 'university', u.name,
                                         'program_id', prog->>'id', 'program', prog->>'name');
  end loop;

  select * into v_row from public.grant_applications where student_id = uid and season = s.season;
  if v_row.id is not null then
    if v_row.fee_status <> 'unpaid' then raise exception 'GRANT_LOCKED'; end if;
    update public.grant_applications
       set motivation = mot, choices = clean, dtm_score = prof.test_score, full_name = prof.full_name, updated_at = now()
     where id = v_row.id returning * into v_row;
  else
    insert into public.grant_applications (season, student_id, full_name, dtm_score, choices, motivation)
    values (s.season, uid, prof.full_name, prof.test_score, clean, mot) returning * into v_row;
    insert into public.notifications (student_id, kind, data)
    values (uid, 'grant_submitted', jsonb_build_object('code', v_row.code, 'fee', s.fee));
  end if;
  return v_row;
end;
$$;
revoke all on function public.grant_submit(text, jsonb) from public, anon;
grant execute on function public.grant_submit(text, jsonb) to authenticated;

-- 5. Student reads their result (only after publication)
create or replace function public.my_grant()
returns table (
  id uuid, code text, season integer, full_name text, dtm_score numeric, choices jsonb, motivation text,
  fee_status text, created_at timestamptz, published_at timestamptz,
  decision text, award_percent integer, award_university text, award_program text
)
language sql stable security definer set search_path = public as $$
  select g.id, g.code, g.season, g.full_name, g.dtm_score, g.choices, g.motivation, g.fee_status, g.created_at,
         s.results_published_at,
         case when s.results_published_at is not null and g.fee_status <> 'unpaid' then coalesce(r.decision, 'REJECTED') end,
         case when s.results_published_at is not null and r.decision = 'ACCEPTED' then r.award_percent end,
         case when s.results_published_at is not null and r.decision = 'ACCEPTED' then u.name end,
         case when s.results_published_at is not null and r.decision = 'ACCEPTED' then r.award_program end
  from public.grant_applications g
  join public.grant_settings s on s.id and s.season = g.season
  left join public.grant_reviews r on r.application_id = g.id
  left join public.universities u on u.id = r.award_university_id
  where g.student_id = auth.uid();
$$;
revoke all on function public.my_grant() from public, anon;
grant execute on function public.my_grant() to authenticated;

-- 6. Master: set payment status (manual until a payment gateway is connected)
create or replace function public.grant_set_fee(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare g public.grant_applications;
begin
  if not public.is_master() then raise exception 'Faqat bosh admin'; end if;
  if p_status not in ('unpaid', 'paid', 'waived') then raise exception 'Noto''g''ri holat'; end if;
  update public.grant_applications
     set fee_status = p_status, paid_at = case when p_status = 'unpaid' then null else coalesce(paid_at, now()) end, updated_at = now()
   where id = p_id returning * into g;
  if g.id is not null and p_status <> 'unpaid' then
    insert into public.notifications (student_id, kind, data)
    values (g.student_id, 'grant_paid', jsonb_build_object('code', g.code));
  end if;
end;
$$;
revoke all on function public.grant_set_fee(uuid, text) from public, anon;
grant execute on function public.grant_set_fee(uuid, text) to authenticated;

-- 7. Publish results: site notification + SMS to everyone at once
create or replace function public.grant_publish()
returns integer language plpgsql security definer set search_path = public as $$
declare
  s public.grant_settings;
  missing integer;
  n integer := 0;
  g record;
begin
  if not public.is_master() then raise exception 'Faqat bosh admin'; end if;
  select * into s from public.grant_settings where id;
  if s.results_published_at is not null then raise exception 'Natijalar allaqachon e''lon qilingan'; end if;
  select count(*) into missing from public.grant_applications a
    left join public.grant_reviews r on r.application_id = a.id
   where a.season = s.season and a.fee_status <> 'unpaid' and r.decision is null;
  if missing > 0 then raise exception 'Hali % ta arizaga qaror chiqarilmagan', missing; end if;
  select count(*) into missing from public.grant_applications a
    join public.grant_reviews r on r.application_id = a.id
   where a.season = s.season and r.decision = 'ACCEPTED'
     and (r.award_percent is null or r.award_university_id is null or r.funded_by is null);
  if missing > 0 then raise exception '% ta g''olibda grant foizi, universitet yoki moliyalashtiruvchi ko''rsatilmagan', missing; end if;

  update public.grant_settings set results_published_at = now(), accepting = false, updated_at = now() where id;

  for g in
    select a.id, a.student_id, a.code, p.phone, coalesce(p.lang, 'uz') as lang
      from public.grant_applications a left join public.profiles p on p.id = a.student_id
     where a.season = s.season and a.fee_status <> 'unpaid'
  loop
    insert into public.notifications (student_id, kind, data)
    values (g.student_id, 'grant_result', jsonb_build_object('code', g.code));
    perform public.sms_enqueue('student', g.phone,
      case when g.lang = 'ru'
        then 'UniGoh: результат конкурса грантов (' || g.code || ') готов. Откройте письмо на сайте unigoh.study'
        else 'UniGoh: grant tanlovi natijasi (' || g.code || ') tayyor. Xatni unigoh.study saytida oching.' end,
      null);
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.grant_publish() from public, anon;
grant execute on function public.grant_publish() to authenticated;

select 'grants ready' as result;
