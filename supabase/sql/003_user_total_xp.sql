-- XP Tracker - accumulated player XP
-- Run this in Supabase SQL Editor if your xp_progress table already exists.

alter table public.xp_progress
  add column if not exists user_total_xp bigint not null default 0;

alter table public.xp_progress
  alter column user_total_xp set default 0;
