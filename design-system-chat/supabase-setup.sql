-- messages 테이블
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text,
  image_url text,
  created_at timestamptz default now() not null
);

-- notices 테이블
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  image_url text,
  link_url text,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  is_active boolean default true not null
);

-- RLS 활성화
alter table public.messages enable row level security;
alter table public.notices enable row level security;

-- messages 정책
create policy "read messages" on public.messages for select using (auth.role() = 'authenticated');
create policy "insert messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "delete messages" on public.messages for delete using (auth.role() = 'authenticated');

-- notices 정책
create policy "read notices" on public.notices for select using (auth.role() = 'authenticated');
create policy "insert notices" on public.notices for insert with check (auth.uid() = created_by);

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notices;

-- Storage 정책
create policy "upload images" on storage.objects for insert with check (auth.role() = 'authenticated');
create policy "read images" on storage.objects for select using (bucket_id = 'chat-images');

-- user_settings 테이블 (텍스트 컬러 등 개인 설정)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  text_color text
);
alter table public.user_settings enable row level security;
create policy "read user_settings" on public.user_settings for select using (auth.role() = 'authenticated');
create policy "insert user_settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "update user_settings" on public.user_settings for update using (auth.uid() = user_id);

-- board_topics 테이블
create table if not exists public.board_topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  color text not null default '#7DAAA0',
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);
alter table public.board_topics enable row level security;
create policy "read board_topics" on public.board_topics for select using (auth.role() = 'authenticated');
create policy "insert board_topics" on public.board_topics for insert with check (auth.uid() = created_by);
create policy "delete board_topics" on public.board_topics for delete using (auth.role() = 'authenticated');

-- board_posts 테이블
create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.board_topics(id) on delete cascade not null,
  content text,
  link_url text,
  image_url text,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);
alter table public.board_posts enable row level security;
create policy "read board_posts" on public.board_posts for select using (auth.role() = 'authenticated');
create policy "insert board_posts" on public.board_posts for insert with check (auth.uid() = created_by);
create policy "delete board_posts" on public.board_posts for delete using (auth.role() = 'authenticated');
