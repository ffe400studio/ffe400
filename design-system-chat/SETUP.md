# Design System Chat — Setup Guide

## 1. Supabase 프로젝트 생성
1. https://supabase.com → 새 프로젝트 생성
2. Project Settings → API 에서 **Project URL**과 **anon key** 복사

## 2. .env 파일 생성
프로젝트 루트에 `.env` 파일 생성:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. DB 테이블 생성
Supabase Dashboard → SQL Editor → `supabase-setup.sql` 파일 내용 전체 실행

## 4. Storage 버킷 생성
Supabase Dashboard → Storage → New bucket
- Name: `chat-images`
- Public bucket: **체크**

Storage → Policies → `chat-images` 버킷에 정책 추가:
```sql
-- 업로드 허용
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (auth.role() = 'authenticated');

-- 공개 읽기 허용
create policy "Public read"
  on storage.objects for select
  using (bucket_id = 'chat-images');
```

## 5. 유저 생성
Supabase Dashboard → Authentication → Users → Add user (Invite 아닌 Create)

**user_a (관리자):**
- Email: `user_a@chat.com`
- Password: `qwertywow123`
- 생성 후 해당 유저 클릭 → Edit → User Metadata 에 입력:
  ```json
  { "role": "admin" }
  ```

**user_b (일반 유저):**
- Email: `user_b@chat.com`
- Password: `dudxor1211`
- User Metadata: `{}` (비워두거나 role 없음)

## 6. 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속
