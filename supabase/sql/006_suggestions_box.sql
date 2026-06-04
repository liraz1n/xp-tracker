-- XP Tracker - Suggestion box.
-- Run this in Supabase SQL Editor to receive user suggestions.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_name text,
  message text not null check (char_length(btrim(message)) between 3 and 1000),
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists suggestions_user_id_created_at_idx
on public.suggestions (user_id, created_at desc);

create index if not exists suggestions_status_created_at_idx
on public.suggestions (status, created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "suggestions_insert_own"
on public.suggestions;

create policy "suggestions_insert_own"
on public.suggestions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "suggestions_select_own"
on public.suggestions;

create policy "suggestions_select_own"
on public.suggestions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "suggestions_select_superadmin"
on public.suggestions;

create policy "suggestions_select_superadmin"
on public.suggestions
for select
to authenticated
using (public.is_xp_tracker_superadmin());

drop policy if exists "suggestions_update_superadmin"
on public.suggestions;

create policy "suggestions_update_superadmin"
on public.suggestions
for update
to authenticated
using (public.is_xp_tracker_superadmin())
with check (public.is_xp_tracker_superadmin());

select
  'suggestions' as check_name,
  count(*)::text as result
from public.suggestions;
