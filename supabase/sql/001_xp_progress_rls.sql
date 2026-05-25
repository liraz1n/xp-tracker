-- XP Tracker - Row Level Security for user progress
-- Run this in Supabase SQL Editor.

alter table public.xp_progress enable row level security;

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
