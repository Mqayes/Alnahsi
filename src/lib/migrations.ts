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
  {
    id: "2026-09-05-personal-blogs",
    title: "المدونات الشخصية (كتابة + رفع صور لكل عضو)",
    sql: `
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  member_id uuid references public.family_members(id) on delete set null,
  title text not null,
  body text not null default '',
  cover_image text,
  status text not null default 'published',
  visibility text not null default 'family',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_author_idx on public.blog_posts (author_id, created_at desc);
create index if not exists blog_posts_feed_idx on public.blog_posts (status, created_at desc);
alter table public.blog_posts enable row level security;

drop policy if exists "blog read" on public.blog_posts;
create policy "blog read" on public.blog_posts for select using (
  (status = 'published' and visibility = 'public')
  or (status = 'published' and auth.role() = 'authenticated')
  or author_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "blog insert own" on public.blog_posts;
create policy "blog insert own" on public.blog_posts for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "blog update own" on public.blog_posts;
create policy "blog update own" on public.blog_posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "blog delete own" on public.blog_posts;
create policy "blog delete own" on public.blog_posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true)
  on conflict (id) do nothing;

drop policy if exists "blog images read" on storage.objects;
create policy "blog images read" on storage.objects for select
  using (bucket_id = 'blog-images');

drop policy if exists "blog images write own" on storage.objects;
create policy "blog images write own" on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "blog images delete own" on storage.objects;
create policy "blog images delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'blog-images' and (storage.foldername(name))[1] = auth.uid()::text);

insert into public.site_content (key, value) values ('blogs_open','true'),('ticker_enabled','true')
  on conflict (key) do nothing;
`,
  },
  {
    id: "2026-09-06-member-contributions",
    title: "مشاركات الأعضاء (أخبار + صور الأرشيف + خصوصية لكل عنصر)",
    sql: `
-- ١) سجل صور العائلة: جدول يحمل خصوصية ومالكاً لكل صورة
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  uploader_name text,
  path text not null,
  url text not null,
  caption text,
  visibility text not null default 'family',
  created_at timestamptz not null default now()
);
create index if not exists gallery_items_feed_idx on public.gallery_items (visibility, created_at desc);
create index if not exists gallery_items_owner_idx on public.gallery_items (uploader_id, created_at desc);
alter table public.gallery_items enable row level security;

drop policy if exists "gallery read" on public.gallery_items;
create policy "gallery read" on public.gallery_items for select using (
  visibility = 'public'
  or auth.role() = 'authenticated'
);

drop policy if exists "gallery insert member" on public.gallery_items;
create policy "gallery insert member" on public.gallery_items for insert to authenticated
  with check (uploader_id = auth.uid());

drop policy if exists "gallery update own" on public.gallery_items;
create policy "gallery update own" on public.gallery_items for update to authenticated
  using (uploader_id = auth.uid() or public.is_admin())
  with check (uploader_id = auth.uid() or public.is_admin());

drop policy if exists "gallery delete own" on public.gallery_items;
create policy "gallery delete own" on public.gallery_items for delete to authenticated
  using (uploader_id = auth.uid() or public.is_admin());

-- ٢) الأخبار: يكتبها أي عضو، ولكل خبر خصوصية وصاحب
alter table public.news_posts add column if not exists author_id uuid references auth.users(id) on delete set null;
alter table public.news_posts add column if not exists author_name text;
alter table public.news_posts add column if not exists visibility text not null default 'family';

drop policy if exists "news read" on public.news_posts;
create policy "news read" on public.news_posts for select using (
  visibility = 'public'
  or auth.role() = 'authenticated'
);

drop policy if exists "news insert member" on public.news_posts;
create policy "news insert member" on public.news_posts for insert to authenticated
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "news update own" on public.news_posts;
create policy "news update own" on public.news_posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "news delete own" on public.news_posts;
create policy "news delete own" on public.news_posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ٣) مخزن صور الأرشيف: يرفع كل عضو داخل مجلده فقط
insert into storage.buckets (id, name, public) values ('gallery-images', 'gallery-images', true)
  on conflict (id) do nothing;

drop policy if exists "gallery images read" on storage.objects;
create policy "gallery images read" on storage.objects for select
  using (bucket_id = 'gallery-images');

drop policy if exists "gallery images write member" on storage.objects;
create policy "gallery images write member" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'gallery-images'
    and ((storage.foldername(name))[1] = 'members' and (storage.foldername(name))[2] = auth.uid()::text
         or public.is_admin())
  );

drop policy if exists "gallery images delete own" on storage.objects;
create policy "gallery images delete own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'gallery-images'
    and ((storage.foldername(name))[1] = 'members' and (storage.foldername(name))[2] = auth.uid()::text
         or public.is_admin())
  );

insert into public.site_content (key, value)
  values ('members_can_post_news','true'),('members_can_upload_gallery','true')
  on conflict (key) do nothing;
`,
  },
  {
    id: "2026-09-07-occasions-and-messages",
    title: "مناسبات وإعلانات الأعضاء + مراسلة الإدارة",
    sql: `
-- ١) المناسبات والإعلانات: مسار منفصل لا يمسّ شجرة النسب
create table if not exists public.occasions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  kind text not null default 'announcement',
  title text not null,
  body text not null default '',
  location text,
  starts_at timestamptz,
  cover_image text,
  visibility text not null default 'family',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists occasions_feed_idx on public.occasions (status, starts_at desc, created_at desc);
create index if not exists occasions_owner_idx on public.occasions (author_id, created_at desc);
alter table public.occasions enable row level security;

drop policy if exists "occasions read" on public.occasions;
create policy "occasions read" on public.occasions for select using (
  (status = 'published' and visibility = 'public')
  or (status = 'published' and auth.role() = 'authenticated')
  or author_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "occasions insert member" on public.occasions;
create policy "occasions insert member" on public.occasions for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "occasions update own" on public.occasions;
create policy "occasions update own" on public.occasions for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

drop policy if exists "occasions delete own" on public.occasions;
create policy "occasions delete own" on public.occasions for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ٢) رسائل الأعضاء للإدارة
create table if not exists public.member_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sender_name text,
  sender_email text,
  topic text not null default 'general',
  subject text not null,
  body text not null,
  status text not null default 'new',
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists member_messages_inbox_idx on public.member_messages (status, created_at desc);
create index if not exists member_messages_sender_idx on public.member_messages (sender_id, created_at desc);
alter table public.member_messages enable row level security;

-- المرسل يرى رسائله فقط؛ الإدارة ترى الجميع
drop policy if exists "messages read" on public.member_messages;
create policy "messages read" on public.member_messages for select using (
  sender_id = auth.uid() or public.is_admin()
);

drop policy if exists "messages insert own" on public.member_messages;
create policy "messages insert own" on public.member_messages for insert to authenticated
  with check (sender_id = auth.uid());

-- المرسل لا يعدّل رسالته بعد الإرسال؛ الإدارة وحدها ترد وتغيّر الحالة
drop policy if exists "messages update admin" on public.member_messages;
create policy "messages update admin" on public.member_messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "messages delete" on public.member_messages;
create policy "messages delete" on public.member_messages for delete to authenticated
  using (sender_id = auth.uid() or public.is_admin());

insert into public.site_content (key, value)
  values ('members_can_post_occasions','true'),('members_can_message_admin','true')
  on conflict (key) do nothing;
`,
  },
];
