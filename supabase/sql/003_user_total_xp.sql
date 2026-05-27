-- XP Tracker - accumulated player XP
-- Run this in Supabase SQL Editor if your xp_progress table already exists.
-- This column stores the player's lifetime XP and is used by the dashboard card.

alter table public.xp_progress
  add column if not exists user_total_xp bigint not null default 0;

alter table public.xp_progress
  alter column user_total_xp set default 0;

update public.xp_progress
set user_total_xp = 0
where user_total_xp is null;

-- Ask Supabase/PostgREST to refresh its schema cache.
notify pgrst, 'reload schema';

-- Verification: should return one row with column_name = user_total_xp.
select
  column_name,
  data_type,
  column_default,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'xp_progress'
  and column_name = 'user_total_xp';
