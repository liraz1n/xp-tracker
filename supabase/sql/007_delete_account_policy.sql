-- XP Tracker - Allow users to delete their own progress row.
-- Run this in Supabase SQL Editor before using the Deletar conta action.

alter table public.xp_progress enable row level security;

drop policy if exists "xp_progress_delete_own"
on public.xp_progress;

create policy "xp_progress_delete_own"
on public.xp_progress
for delete
to authenticated
using (user_id::text = auth.uid()::text);

select
  'xp_progress_delete_own' as check_name,
  count(*)::text as result
from pg_policies
where schemaname = 'public'
  and tablename = 'xp_progress'
  and policyname = 'xp_progress_delete_own';
