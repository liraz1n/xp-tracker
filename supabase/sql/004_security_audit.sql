-- XP Tracker - Security audit queries
-- Run in Supabase SQL Editor after applying the previous migrations.
-- This script only reads metadata and does not change application data.

select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  table_schema,
  table_name,
  privilege_type,
  grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select
  'xp_progress rows without user_id' as check_name,
  count(*)::text as result
from public.xp_progress
where user_id is null
union all
select
  'user_subscriptions rows without user_id' as check_name,
  count(*)::text as result
from public.user_subscriptions
where user_id is null
union all
select
  'active limited coupons at or over limit' as check_name,
  count(*)::text as result
from public.discount_coupons
where active = true
  and max_redemptions is not null
  and redeemed_count >= max_redemptions;
