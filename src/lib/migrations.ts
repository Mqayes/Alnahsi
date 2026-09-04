/** ترحيلات قاعدة البيانات — تُطبَّق من لوحة التحكم عبر دالة apply_migration (مالك فقط) */
export const MIGRATIONS: { id: string; title: string; sql: string }[] = [
  {
    id: "2026-09-04-accounts-tree",
    title: "الحسابات (إيقاف/ربط) + حقول الشجرة + إعدادات",
    sql: `
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists member_id uuid references public.family_members(id) on delete set null;
alter table public.family_members add column if not exists parent_id uuid references public.family_members(id) on delete set null;
alter table public.family_members add column if not exists generation int;
alter table public.family_members add column if not exists city text;
alter table public.family_members add column if not exists is_deceased boolean default false;
alter table public.family_members add column if not exists notes text;
alter table public.family_members add column if not exists gender text;
alter table public.news_posts add column if not exists cover_image text;
insert into public.site_content (key, value) values ('tree_public','false'),('join_open','true') on conflict (key) do nothing;
drop policy if exists "members read auth" on public.family_members;
create policy "members read auth" on public.family_members for select
  using (auth.role() = 'authenticated' or exists (select 1 from public.site_content where key='tree_public' and value='true'));
`,
  },
];
