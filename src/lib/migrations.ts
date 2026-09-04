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
  {
    id: "2026-09-04b-structured-requests",
    title: "طلبات الانضمام المهيكلة (الأب، الجنس، الميلاد، الوفاة…)",
    sql: `
alter table public.family_members add column if not exists first_name text;
alter table public.family_members add column if not exists gender text;
alter table public.family_members add column if not exists phone text;
alter table public.family_members add column if not exists occupation text;
alter table public.join_requests add column if not exists first_name text;
alter table public.join_requests add column if not exists parent_id uuid references public.family_members(id) on delete set null;
alter table public.join_requests add column if not exists gender text;
alter table public.join_requests add column if not exists birth_year int;
alter table public.join_requests add column if not exists death_year int;
alter table public.join_requests add column if not exists is_deceased boolean default false;
alter table public.join_requests add column if not exists city text;
alter table public.join_requests add column if not exists phone text;
alter table public.join_requests add column if not exists occupation text;
alter table public.join_requests add column if not exists full_name_ar text;
drop policy if exists "join insert public" on public.join_requests;
create policy "join insert public" on public.join_requests for insert with check (
  exists (select 1 from public.site_content where key='join_open' and value='true') or auth.role() = 'authenticated'
);
`,
  },
  {
    id: "2026-09-04c-optional-email",
    title: "البريد اختياري في الطلبات",
    sql: `alter table public.join_requests alter column email drop not null;`,
  },
  {
    id: "2026-09-04d-events",
    title: "مناسبات العائلة (مواليد، زواج، وفيات، إنجازات) + سبب الوفاة والزوجة",
    sql: `
alter table public.family_members add column if not exists death_cause text;
alter table public.family_members add column if not exists spouse_name text;
alter table public.family_members add column if not exists marriage_year int;
alter table public.news_posts add column if not exists category text default 'general';
alter table public.news_posts add column if not exists member_id uuid references public.family_members(id) on delete set null;
alter table public.news_posts add column if not exists event_date date;
alter table public.join_requests add column if not exists death_cause text;
`,
  },
];
