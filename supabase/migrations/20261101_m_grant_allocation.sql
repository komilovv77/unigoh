-- =============================================================================
-- m. Grant taqsimoti va kafolatlangan kontrakt o'rni
--   * Talaba 3 ta universitetni xohish tartibida tanlaydi (1 → 2 → 3).
--   * Grantlar ball bo'yicha taqsimlanadi: eng kuchli talaba birinchi tanlaydi —
--     o'zining 1-tanlovidagi eng katta bo'sh grantni oladi; u yerda bo'sh grant
--     qolmasa, 2-tanlovga, keyin 3-tanlovga o'tadi.
--     Universitet grantlari (masalan 100%) faqat o'sha universitetda,
--     UniGoh grantlari (50%, 25%) istalgan hamkor universitetda ishlatiladi.
--   * Grant olmaganlar ham kontrakt asosida 1-tanlovga qabul taklifini oladi;
--     talaba voz kechsa yoki universitet rad etsa — 2-tanlovga, keyin 3-ga o'tadi.
-- =============================================================================

alter table public.grant_settings add column if not exists pool jsonb not null default '[]'::jsonb;
  -- [{university_id: 'x' | null, percent: 100, count: 1, funded_by: 'university' | 'unigoh'}]
alter table public.grant_settings add column if not exists waitlist_size integer not null default 10;

alter table public.grant_reviews add column if not exists excluded boolean not null default false;
alter table public.grant_reviews add column if not exists choice_rank integer;

alter table public.grant_applications add column if not exists offer_rank integer;
alter table public.grant_applications add column if not exists offer_application_id uuid references public.applications(id) on delete set null;

alter table public.applications add column if not exists source text not null default 'direct';
alter table public.applications drop constraint if exists applications_source_check;
alter table public.applications add constraint applications_source_check check (source in ('direct', 'grant'));
alter table public.applications add column if not exists grant_application_id uuid references public.grant_applications(id) on delete set null;
alter table public.applications add column if not exists grant_percent integer;
alter table public.applications add column if not exists grant_funded_by text;
alter table public.applications add column if not exists choice_rank integer;

-- -----------------------------------------------------------------------------
-- 1. Guard: grant tizimi (ichki funksiyalar) talaba nomidan ariza yarata/yangilay oladi
-- -----------------------------------------------------------------------------
create or replace function public.applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := public.my_role();
  offer boolean := coalesce(current_setting('unigoh.offer', true), '') = '1';
  sys boolean := coalesce(current_setting('unigoh.grant', true), '') = '1';
begin
  if sys then
    new.updated_at := now();
    return new;
  end if;

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
      new.source := 'direct';
      new.grant_application_id := null;
      new.grant_percent := null;
      new.grant_funded_by := null;
      new.choice_rank := null;
    end if;
    return new;
  end if;

  -- grant maydonlarini hech kim qo'lda o'zgartirmaydi (faqat tizim)
  if r <> 'master' then
    new.source := old.source;
    new.grant_application_id := old.grant_application_id;
    new.grant_percent := old.grant_percent;
    new.grant_funded_by := old.grant_funded_by;
    new.choice_rank := old.choice_rank;
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

-- -----------------------------------------------------------------------------
-- 2. Xabarlar: grant tizimi yaratgan taklif uchun "ariza topshirildi" xabari yuborilmaydi
--    (talaba natijani grant xatida ko'radi)
-- -----------------------------------------------------------------------------
create or replace function public.applications_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base jsonb;
  p record;
  uni record;
  t record;
  ru boolean;
  sys boolean := coalesce(current_setting('unigoh.grant', true), '') = '1';
begin
  select name, code into uni from public.universities where id = new.university_id;
  base := jsonb_build_object('university', coalesce(uni.name, new.university_id), 'program', coalesce(new.program_name, ''), 'code', new.code);

  if tg_op = 'INSERT' then
    if not sys then
      insert into public.notifications (student_id, application_id, kind, data) values (new.student_id, new.id, 'submitted', base);
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not sys then
      insert into public.notifications (student_id, application_id, kind, data)
      values (new.student_id, new.id, 'status', base || jsonb_build_object('status', new.status));
    end if;

    -- Talabaga SMS: universitet javob berdi (grant tizimi o'zi alohida SMS yuboradi)
    if new.status in ('ADMITTED', 'REJECTED') and not sys then
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
-- 3. Avtomatik taqsimlash (bosh admin). Natijalar e'lon qilinguncha qayta-qayta ishlatish mumkin.
-- -----------------------------------------------------------------------------
create or replace function public.grant_allocate()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.grant_settings;
  missing integer;
  a record;
  c jsonb;
  rnk integer;
  slot record;
  waits integer := 0;
  won integer := 0;
  rej integer := 0;
  placed boolean;
begin
  if not public.is_master() then raise exception 'Faqat bosh admin'; end if;
  select * into s from public.grant_settings where id;
  if s.results_published_at is not null then raise exception 'Natijalar allaqachon e''lon qilingan'; end if;

  select count(*) into missing from public.grant_applications g
    left join public.grant_reviews r on r.application_id = g.id
   where g.season = s.season and g.fee_status <> 'unpaid' and not coalesce(r.excluded, false) and r.score is null;
  if missing > 0 then raise exception 'Hali % ta arizaga ball qo''yilmagan', missing; end if;

  drop table if exists _slots;
  create temp table _slots (sid serial, university_id text, percent integer, funded_by text, taken boolean default false) on commit drop;
  insert into _slots (university_id, percent, funded_by)
  select nullif(p->>'university_id', ''), (p->>'percent')::int, coalesce(p->>'funded_by', 'unigoh')
    from jsonb_array_elements(s.pool) p, generate_series(1, greatest(coalesce((p->>'count')::int, 0), 0));

  for a in
    select g.*, r.excluded, r.score from public.grant_applications g
      join public.grant_reviews r on r.application_id = g.id
     where g.season = s.season and g.fee_status <> 'unpaid'
     order by r.excluded, r.score desc nulls last, g.dtm_score desc, g.created_at
  loop
    placed := false;
    if not a.excluded then
      rnk := 0;
      for c in select * from jsonb_array_elements(a.choices) loop
        rnk := rnk + 1;
        select * into slot from _slots
         where not taken and (university_id = c->>'university_id' or university_id is null)
         order by percent desc, (university_id is not null) desc, sid
         limit 1;
        if found then
          update _slots set taken = true where sid = slot.sid;
          update public.grant_reviews
             set decision = 'ACCEPTED', award_percent = slot.percent, award_university_id = c->>'university_id',
                 award_program = c->>'program', funded_by = slot.funded_by, choice_rank = rnk, updated_at = now()
           where application_id = a.id;
          won := won + 1;
          placed := true;
          exit;
        end if;
      end loop;
    end if;
    if not placed then
      if not a.excluded and waits < s.waitlist_size then
        waits := waits + 1;
        update public.grant_reviews set decision = 'WAITLISTED', award_percent = null, award_university_id = null,
               award_program = null, funded_by = null, choice_rank = null, updated_at = now() where application_id = a.id;
      else
        rej := rej + 1;
        update public.grant_reviews set decision = 'REJECTED', award_percent = null, award_university_id = null,
               award_program = null, funded_by = null, choice_rank = null, updated_at = now() where application_id = a.id;
      end if;
    end if;
  end loop;

  return jsonb_build_object('accepted', won, 'waitlisted', waits, 'rejected', rej,
                            'unused_slots', (select count(*) from _slots where not taken));
end;
$$;
revoke all on function public.grant_allocate() from public, anon;
grant execute on function public.grant_allocate() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Taklif yaratish: talabaning N-tanloviga qabul (grant bo'lsa — grant bilan)
-- -----------------------------------------------------------------------------
create or replace function public.grant_make_offer(p_ga uuid, p_rank integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  g public.grant_applications;
  r public.grant_reviews;
  c jsonb;
  app public.applications;
  pct integer;
  fby text;
begin
  select * into g from public.grant_applications where id = p_ga;
  if g.id is null then return null; end if;
  c := g.choices -> (p_rank - 1);
  if c is null then
    update public.grant_applications set offer_rank = null, offer_application_id = null, updated_at = now() where id = p_ga;
    return null;
  end if;
  select * into r from public.grant_reviews where application_id = p_ga;
  if r.decision = 'ACCEPTED' and r.award_university_id = c->>'university_id' then
    pct := r.award_percent; fby := r.funded_by;
  end if;

  perform set_config('unigoh.grant', '1', true);
  select * into app from public.applications
   where student_id = g.student_id and university_id = c->>'university_id' and program_id is not distinct from c->>'program_id';
  if app.id is null then
    insert into public.applications (student_id, university_id, program_id, program_name, status, source,
                                     grant_application_id, grant_percent, grant_funded_by, choice_rank)
    values (g.student_id, c->>'university_id', c->>'program_id', c->>'program', 'ADMITTED', 'grant',
            g.id, pct, fby, p_rank)
    returning * into app;
  else
    update public.applications
       set status = case when status in ('SENT', 'CONTRACT', 'ENROLLED') then status else 'ADMITTED' end,
           source = 'grant', grant_application_id = g.id, grant_percent = pct, grant_funded_by = fby, choice_rank = p_rank
     where id = app.id returning * into app;
  end if;
  perform set_config('unigoh.grant', '', true);

  update public.grant_applications set offer_rank = p_rank, offer_application_id = app.id, updated_at = now() where id = p_ga;
  return app.id;
end;
$$;
revoke all on function public.grant_make_offer(uuid, integer) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. E'lon: xat + SMS + har bir ishtirokchiga qabul taklifi
-- -----------------------------------------------------------------------------
create or replace function public.grant_publish()
returns integer language plpgsql security definer set search_path = public as $$
declare
  s public.grant_settings;
  missing integer;
  n integer := 0;
  g record;
  rnk integer;
begin
  if not public.is_master() then raise exception 'Faqat bosh admin'; end if;
  select * into s from public.grant_settings where id;
  if s.results_published_at is not null then raise exception 'Natijalar allaqachon e''lon qilingan'; end if;
  select count(*) into missing from public.grant_applications a
    left join public.grant_reviews r on r.application_id = a.id
   where a.season = s.season and a.fee_status <> 'unpaid' and r.decision is null;
  if missing > 0 then raise exception 'Hali % ta arizaga qaror chiqarilmagan — avval "Avtomatik taqsimlash"ni bosing', missing; end if;
  select count(*) into missing from public.grant_applications a
    join public.grant_reviews r on r.application_id = a.id
   where a.season = s.season and r.decision = 'ACCEPTED'
     and (r.award_percent is null or r.award_university_id is null or r.funded_by is null);
  if missing > 0 then raise exception '% ta g''olibda grant foizi, universitet yoki moliyalashtiruvchi ko''rsatilmagan', missing; end if;

  update public.grant_settings set results_published_at = now(), accepting = false, updated_at = now() where id;

  for g in
    select a.id, a.student_id, a.code, a.choices, p.phone, coalesce(p.lang, 'uz') as lang,
           r.decision, r.award_university_id, coalesce(r.excluded, false) as excluded
      from public.grant_applications a
      join public.grant_reviews r on r.application_id = a.id
      left join public.profiles p on p.id = a.student_id
     where a.season = s.season and a.fee_status <> 'unpaid'
  loop
    -- Qabul taklifi: g'olibga grant berilgan tanlovida, qolganlarga 1-tanlovida
    if not g.excluded then
      rnk := 1;
      if g.decision = 'ACCEPTED' then
        select o.ord into rnk from jsonb_array_elements(g.choices) with ordinality o(v, ord)
         where o.v->>'university_id' = g.award_university_id limit 1;
      end if;
      perform public.grant_make_offer(g.id, coalesce(rnk, 1));
    end if;

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

-- -----------------------------------------------------------------------------
-- 6. Talaba: "keyingi tanlovimga o'tish"
-- -----------------------------------------------------------------------------
create or replace function public.grant_next_choice()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  g public.grant_applications;
  cur public.applications;
  nid uuid;
begin
  select ga.* into g from public.grant_applications ga
    join public.grant_settings s on s.id and s.season = ga.season and s.results_published_at is not null
   where ga.student_id = auth.uid();
  if g.id is null or g.offer_rank is null then raise exception 'Taklif topilmadi'; end if;
  if g.offer_rank >= jsonb_array_length(g.choices) then raise exception 'NO_MORE_CHOICES'; end if;
  select * into cur from public.applications where id = g.offer_application_id;
  if cur.status in ('SENT', 'CONTRACT', 'ENROLLED') then raise exception 'Siz bu universitetga rozilik bergansiz'; end if;
  if cur.id is not null and cur.status not in ('WITHDRAWN', 'REJECTED') then
    perform set_config('unigoh.grant', '1', true);
    update public.applications set status = 'WITHDRAWN' where id = cur.id;
    perform set_config('unigoh.grant', '', true);
  end if;
  nid := public.grant_make_offer(g.id, g.offer_rank + 1);
  return nid;
end;
$$;
revoke all on function public.grant_next_choice() from public, anon;
grant execute on function public.grant_next_choice() to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Universitet grant yo'lidagi talabani rad etsa — avtomatik keyingi tanlov
-- -----------------------------------------------------------------------------
create or replace function public.grant_cascade()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  g public.grant_applications;
begin
  if new.source = 'grant' and new.status = 'REJECTED' and old.status is distinct from 'REJECTED'
     and new.grant_application_id is not null then
    select * into g from public.grant_applications where id = new.grant_application_id;
    if g.offer_application_id = new.id and g.offer_rank is not null then
      perform public.grant_make_offer(g.id, g.offer_rank + 1);
      insert into public.notifications (student_id, kind, data)
      values (g.student_id, 'grant_next', jsonb_build_object('code', g.code));
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.grant_cascade() from public, anon, authenticated;
drop trigger if exists applications_grant_cascade on public.applications;
create trigger applications_grant_cascade after update of status on public.applications
  for each row execute function public.grant_cascade();

-- -----------------------------------------------------------------------------
-- 8. Talabaning grant ma'lumoti (taklif bilan)
-- -----------------------------------------------------------------------------
drop function if exists public.my_grant();
create or replace function public.my_grant()
returns table (
  id uuid, code text, season integer, full_name text, dtm_score numeric, choices jsonb, motivation text,
  fee_status text, created_at timestamptz, published_at timestamptz,
  decision text, award_percent integer, award_university text, award_program text,
  offer_rank integer, offer_application_id uuid, offer_status text, offer_university text, offer_program text,
  offer_grant_percent integer
)
language sql stable security definer set search_path = public as $$
  select g.id, g.code, g.season, g.full_name, g.dtm_score, g.choices, g.motivation, g.fee_status, g.created_at,
         s.results_published_at,
         case when s.results_published_at is not null and g.fee_status <> 'unpaid' then coalesce(r.decision, 'REJECTED') end,
         case when s.results_published_at is not null and r.decision = 'ACCEPTED' then r.award_percent end,
         case when s.results_published_at is not null and r.decision = 'ACCEPTED' then u.name end,
         case when s.results_published_at is not null and r.decision = 'ACCEPTED' then r.award_program end,
         case when s.results_published_at is not null then g.offer_rank end,
         case when s.results_published_at is not null then g.offer_application_id end,
         case when s.results_published_at is not null then oa.status end,
         case when s.results_published_at is not null then ou.name end,
         case when s.results_published_at is not null then oa.program_name end,
         case when s.results_published_at is not null then oa.grant_percent end
  from public.grant_applications g
  join public.grant_settings s on s.id and s.season = g.season
  left join public.grant_reviews r on r.application_id = g.id
  left join public.universities u on u.id = r.award_university_id
  left join public.applications oa on oa.id = g.offer_application_id
  left join public.universities ou on ou.id = oa.university_id
  where g.student_id = auth.uid();
$$;
revoke all on function public.my_grant() from public, anon;
grant execute on function public.my_grant() to authenticated;

select 'grant allocation ready' as result;
