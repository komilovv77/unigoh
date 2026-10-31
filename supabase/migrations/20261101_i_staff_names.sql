-- =============================================================================
-- i. Xodim ismi: bosh admin xodim qo'shayotganda ismini yozadi (yoki keyin o'zgartiradi).
--    Panelda ro'yxatdan o'tgandagi ism emas, shu ism ko'rinadi.
-- =============================================================================

alter table public.staff_invites add column if not exists full_name text;

drop function if exists public.assign_staff(text, text, text);
create or replace function public.assign_staff(p_email text, p_role text, p_university text default null, p_full_name text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid  uuid;
  nm   text := nullif(trim(p_full_name), '');
  mail text := lower(trim(p_email));
  uni  text := case when p_role = 'master' then null else p_university end;
begin
  if not public.is_master() then
    raise exception 'Faqat master admin xodim tayinlay oladi';
  end if;
  if nm is not null and length(nm) > 120 then
    raise exception 'Ism juda uzun';
  end if;
  -- Taklif har doim saqlanadi (ism va universitet shu yerda turadi)
  insert into public.staff_invites (email, role, university_id, full_name)
  values (mail, p_role, uni, nm)
  on conflict (email) do update
    set role = excluded.role, university_id = excluded.university_id,
        full_name = coalesce(excluded.full_name, public.staff_invites.full_name);
  -- Akkaunt allaqachon bo'lsa, darhol biriktiriladi
  select id into uid from auth.users where lower(email) = mail;
  if uid is not null then
    insert into public.staff (user_id, role, university_id, full_name)
    values (uid, p_role, uni, coalesce(nm, (select raw_user_meta_data->>'full_name' from auth.users where id = uid)))
    on conflict (user_id) do update
      set role = excluded.role, university_id = excluded.university_id,
          full_name = coalesce(nm, public.staff.full_name);
  end if;
end;
$$;

-- Ro'yxatdan o'tganda: taklifdagi ism ustun
create or replace function public.apply_staff_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv public.staff_invites;
begin
  select * into inv from public.staff_invites where email = lower(new.email);
  if found then
    insert into public.staff (user_id, role, university_id, full_name)
    values (new.id, inv.role, inv.university_id, coalesce(inv.full_name, new.raw_user_meta_data->>'full_name'))
    on conflict (user_id) do update
      set role = excluded.role, university_id = excluded.university_id, full_name = excluded.full_name;
  end if;
  return new;
end;
$$;

create or replace function public.apply_invite_to_existing()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email));
  insert into public.staff (user_id, role, university_id, full_name)
  select u.id, new.role, new.university_id, coalesce(new.full_name, u.raw_user_meta_data->>'full_name')
  from auth.users u where lower(u.email) = new.email
  on conflict (user_id) do update
    set role = excluded.role, university_id = excluded.university_id,
        full_name = coalesce(new.full_name, public.staff.full_name);
  return new;
end;
$$;

-- Ismni keyin o'zgartirish
create or replace function public.set_staff_name(p_user uuid, p_full_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  nm text := nullif(trim(p_full_name), '');
begin
  if not public.is_master() then
    raise exception 'Faqat master admin';
  end if;
  if nm is null or length(nm) > 120 then
    raise exception 'Ismni to''g''ri kiriting';
  end if;
  update public.staff set full_name = nm where user_id = p_user;
  update public.staff_invites set full_name = nm
   where email = (select lower(email) from auth.users where id = p_user);
end;
$$;

revoke all on function public.apply_staff_invite() from public, anon, authenticated;
revoke all on function public.apply_invite_to_existing() from public, anon, authenticated;
revoke all on function public.assign_staff(text, text, text, text) from public, anon;
grant execute on function public.assign_staff(text, text, text, text) to authenticated;
revoke all on function public.set_staff_name(uuid, text) from public, anon;
grant execute on function public.set_staff_name(uuid, text) to authenticated;

select 'staff names ready' as result;
