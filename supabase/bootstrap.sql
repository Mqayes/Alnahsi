-- يُشغَّل مرة واحدة فقط: يثبّت آلية الترقية الذاتية من لوحة التحكم (المالك فقط)
create table if not exists public.schema_migrations (id text primary key, applied_at timestamptz default now());
alter table public.schema_migrations enable row level security;
drop policy if exists "migrations read staff" on public.schema_migrations;
create policy "migrations read staff" on public.schema_migrations for select using (public.is_admin());

create or replace function public.apply_migration(mig_id text, mig_sql text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'owner only';
  end if;
  if exists (select 1 from public.schema_migrations where id = mig_id) then return; end if;
  execute mig_sql;
  insert into public.schema_migrations (id) values (mig_id);
end $$;
revoke all on function public.apply_migration(text, text) from public;
grant execute on function public.apply_migration(text, text) to authenticated;
