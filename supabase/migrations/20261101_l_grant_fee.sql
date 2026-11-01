-- Grant ariza to'lovi: 199 999 so'm
alter table public.grant_settings alter column fee set default 199999;
update public.grant_settings set fee = 199999, updated_at = now() where id;
select fee from public.grant_settings;
