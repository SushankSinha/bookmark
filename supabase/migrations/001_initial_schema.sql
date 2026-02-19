-- =============================================================================
-- Smart Bookmarks - Initial Schema
-- =============================================================================
-- Run this in your Supabase SQL editor or via `supabase db push`

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =============================================================================
-- BOOKMARKS TABLE
-- =============================================================================
create table if not exists public.bookmarks (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  url         text        not null check (length(url) > 0 and length(url) <= 2048),
  title       text        not null check (length(title) > 0 and length(title) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- INDEXES (for scalability)
-- =============================================================================

-- Primary query: fetch all bookmarks for a user, sorted by newest first
-- This covers: SELECT * FROM bookmarks WHERE user_id = $1 ORDER BY created_at DESC
create index if not exists idx_bookmarks_user_id_created_at
  on public.bookmarks (user_id, created_at desc);

-- For real-time filter: WHERE user_id = eq.<uuid>
create index if not exists idx_bookmarks_user_id
  on public.bookmarks (user_id);

-- For paginated access patterns (cursor-based pagination future support)
create index if not exists idx_bookmarks_id
  on public.bookmarks (id);

-- =============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bookmarks_updated_at on public.bookmarks;

create trigger set_bookmarks_updated_at
  before update on public.bookmarks
  for each row
  execute function public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- RLS ensures data isolation between users at the database level.
-- Even if someone bypasses the app layer, they cannot see another user's data.

alter table public.bookmarks enable row level security;

-- SELECT: Users can only read their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- INSERT: Users can only insert bookmarks with their own user_id
create policy "Users can insert own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- DELETE: Users can only delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- UPDATE: Users can only update their own bookmarks (not user_id)
create policy "Users can update own bookmarks"
  on public.bookmarks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- REALTIME
-- =============================================================================
-- Enable realtime for the bookmarks table
alter publication supabase_realtime add table public.bookmarks;

-- =============================================================================
-- COMMENTS (documentation in schema)
-- =============================================================================
comment on table public.bookmarks is 'Private bookmarks per user. RLS enforced.';
comment on column public.bookmarks.user_id is 'FK to auth.users — cascade delete removes bookmarks when user account deleted.';
comment on column public.bookmarks.url is 'Normalized URL, max 2048 chars (standard browser URL limit).';
comment on column public.bookmarks.title is 'User-defined title for the bookmark, max 500 chars.';
comment on index idx_bookmarks_user_id_created_at is 'Covers the primary list query: user bookmarks ordered by recency.';
