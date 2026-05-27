-- XP Tracker - Row Level Security for user progress
-- Run this in Supabase SQL Editor.

alter table public.xp_progress enable row level security;

alter table public.xp_progress
  alter column total_xp set default 0,
  alter column current_xp set default 0,
  alter column daily_goal set default 0,
  alter column last_saved_xp set default 0;

alter table public.xp_progress
  add column if not exists current_level integer not null default 0,
  add column if not exists target_level integer not null default 1,
  add column if not exists user_total_xp bigint not null default 0;

alter table public.xp_progress
  alter column current_level set default 0,
  alter column target_level set default 1,
  alter column user_total_xp set default 0;

drop policy if exists "Users can read own progress" on public.xp_progress;
drop policy if exists "Users can insert own progress" on public.xp_progress;
drop policy if exists "Users can update own progress" on public.xp_progress;

drop policy if exists "xp_progress_select_own" on public.xp_progress;
drop policy if exists "xp_progress_insert_own" on public.xp_progress;
drop policy if exists "xp_progress_update_own" on public.xp_progress;

create policy "xp_progress_select_own"
on public.xp_progress
for select
to authenticated
using (user_id::text = auth.uid()::text);

create policy "xp_progress_insert_own"
on public.xp_progress
for insert
to authenticated
with check (user_id::text = auth.uid()::text);

create policy "xp_progress_update_own"
on public.xp_progress
for update
to authenticated
using (user_id::text = auth.uid()::text)
with check (user_id::text = auth.uid()::text);

-- Keep one progress row per authenticated user.
-- If this fails, check whether duplicate user_id rows already exist.
create unique index if not exists xp_progress_user_id_unique
on public.xp_progress (user_id);

-- Verification query: should show RLS enabled and the three policies above.
select
  c.relrowsecurity as rls_enabled,
  p.policyname,
  p.cmd,
  p.roles,
  p.qual,
  p.with_check
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
  and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname = 'xp_progress'
order by p.policyname;
