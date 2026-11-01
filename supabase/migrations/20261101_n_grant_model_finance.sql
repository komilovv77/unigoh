-- =============================================================================
-- n. Grant modeli (yakuniy) va moliya hisob-kitobi
--   * Universitet grantlari: shu universitetni 1-o'ringa qo'yganlar orasidagi eng kuchlilarga
--     ("chempionlar"). Har bir universitet o'z ichida bellashadi.
--   * UniGoh grantlari: qolgan barcha ishtirokchilar orasida umumiy reyting bo'yicha,
--     talabaning 1-tanlovidagi universitetda (cheklov yo'q — UniGoh to'laydi).
--   * Qolganlar: zaxira ro'yxati / kontrakt asosida qabul taklifi (1-tanlovdan boshlab).
--   * Ulush universitet haqiqatda oladigan puldan: universitet granti chegirmasi ayriladi,
--     UniGoh granti esa universitet daromadini kamaytirmaydi (uni UniGoh to'laydi).
-- =============================================================================

create or replace function public.grant_allocate()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.grant_settings;
  missing integer;
  a record;
  slot record;
  waits integer := 0;
  won integer := 0;
  champs integer := 0;
  rej integer := 0;
begin
  if not public.is_master() then raise exception 'Faqat bosh admin'; end if;
  select * into s from public.grant_settings where id;
  if s.results_published_at is not null then raise exception 'Natijalar allaqachon e''lon qilingan'; end if;

  select count(*) into missing from public.grant_applications g
    left join public.grant_reviews r on r.application_id = g.id
   where g.season = s.season and g.fee_status <> 'unpaid' and not coalesce(r.excluded, false) and r.score is null;
  if missing > 0 then raise exception 'Hali % ta arizaga ball qo''yilmagan', missing; end if;

  -- Avval hamma qarorlar tozalanadi
  update public.grant_reviews r set decision = null, award_percent = null, award_university_id = null,
         award_program = null, funded_by = null, choice_rank = null, updated_at = now()
    from public.grant_applications g
   where g.id = r.application_id and g.season = s.season;

  drop table if exists _slots;
  create temp table _slots (sid serial, university_id text, percent integer, funded_by text, taken boolean default false) on commit drop;
  insert into _slots (university_id, percent, funded_by)
  select nullif(p->>'university_id', ''), (p->>'percent')::int, coalesce(p->>'funded_by', 'unigoh')
    from jsonb_array_elements(s.pool) p, generate_series(1, greatest(coalesce((p->>'count')::int, 0), 0));

  drop table if exists _cand;
  create temp table _cand on commit drop as
  select g.id, g.choices, g.choices->0->>'university_id' as first_uni, g.choices->0->>'program' as first_prog,
         r.score, g.dtm_score, g.created_at, coalesce(r.excluded, false) as excluded, false as placed
    from public.grant_applications g
    join public.grant_reviews r on r.application_id = g.id
   where g.season = s.season and g.fee_status <> 'unpaid';

  -- 1-bosqich: universitet grantlari — shu universitetni 1-o'ringa qo'yganlar orasida eng kuchlilarga
  for slot in select * from _slots where university_id is not null order by university_id, percent desc, sid loop
    select * into a from _cand
     where not placed and not excluded and first_uni = slot.university_id
     order by score desc nulls last, dtm_score desc, created_at
     limit 1;
    if found then
      update _cand set placed = true where id = a.id;
      update _slots set taken = true where sid = slot.sid;
      update public.grant_reviews
         set decision = 'ACCEPTED', award_percent = slot.percent, award_university_id = a.first_uni,
             award_program = a.first_prog, funded_by = slot.funded_by, choice_rank = 1, updated_at = now()
       where application_id = a.id;
      champs := champs + 1;
    end if;
  end loop;

  -- 2-bosqich: UniGoh grantlari — qolganlar orasida umumiy reyting bo'yicha, talabaning 1-tanlovida
  for slot in select * from _slots where university_id is null order by percent desc, sid loop
    select * into a from _cand
     where not placed and not excluded
     order by score desc nulls last, dtm_score desc, created_at
     limit 1;
    exit when not found;
    update _cand set placed = true where id = a.id;
    update _slots set taken = true where sid = slot.sid;
    update public.grant_reviews
       set decision = 'ACCEPTED', award_percent = slot.percent, award_university_id = a.first_uni,
           award_program = a.first_prog, funded_by = slot.funded_by, choice_rank = 1, updated_at = now()
     where application_id = a.id;
    won := won + 1;
  end loop;

  -- 3-bosqich: zaxira ro'yxati va qolganlar (kontrakt asosida)
  for a in select * from _cand where not placed order by excluded, score desc nulls last, dtm_score desc, created_at loop
    if not a.excluded and waits < s.waitlist_size then
      waits := waits + 1;
      update public.grant_reviews set decision = 'WAITLISTED', updated_at = now() where application_id = a.id;
    else
      rej := rej + 1;
      update public.grant_reviews set decision = 'REJECTED', updated_at = now() where application_id = a.id;
    end if;
  end loop;

  return jsonb_build_object('champions', champs, 'unigoh', won, 'accepted', champs + won, 'waitlisted', waits,
                            'rejected', rej, 'unused_slots', (select count(*) from _slots where not taken));
end;
$$;
revoke all on function public.grant_allocate() from public, anon;
grant execute on function public.grant_allocate() to authenticated;

-- Moliya: ulush va UniGoh to'laydigan grant summasi
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
  round(coalesce(a.contract_amount, 0)
        * (1 - case when a.grant_funded_by = 'university' then coalesce(a.grant_percent, 0) else 0 end / 100.0)
        * c.rate / 100.0)::bigint as amount,
  c.status,
  c.paid_at,
  c.created_at,
  a.grant_percent,
  a.grant_funded_by,
  case when a.grant_funded_by = 'unigoh'
       then round(coalesce(a.contract_amount, 0) * coalesce(a.grant_percent, 0) / 100.0)::bigint else 0 end as unigoh_grant_due
from public.application_commissions c
join public.applications a on a.id = c.application_id;
grant select on public.commission_ledger to authenticated;
revoke all on public.commission_ledger from anon;

select 'grant model v2 ready' as result;
