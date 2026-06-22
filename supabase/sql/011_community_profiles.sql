-- XP Tracker - Community profiles.
-- Run this in Supabase SQL Editor to enable the community visibility feature.

create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  current_level integer not null default 0 check (current_level >= 0),
  target_level integer not null default 1 check (target_level >= 0),
  progress_percent numeric(6, 2) not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  badges text[] not null default '{}',
  share_profile boolean not null default false,
  accepted_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists community_profiles_visible_level_idx
on public.community_profiles (share_profile, current_level desc, progress_percent desc);

alter table public.community_profiles enable row level security;

create or replace function public.has_community_profile_visible(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_profiles
    where user_id = p_user_id
      and share_profile = true
  );
$$;

grant execute on function public.has_community_profile_visible(uuid) to authenticated;

drop policy if exists "community_profiles_select_reciprocal"
on public.community_profiles;

create policy "community_profiles_select_reciprocal"
on public.community_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or (
    share_profile = true
    and public.has_community_profile_visible(auth.uid())
  )
);

drop policy if exists "community_profiles_insert_own"
on public.community_profiles;

create policy "community_profiles_insert_own"
on public.community_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community_profiles_update_own"
on public.community_profiles;

create policy "community_profiles_update_own"
on public.community_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists community_profiles_set_updated_at
on public.community_profiles;

create trigger community_profiles_set_updated_at
before update on public.community_profiles
for each row
execute function public.set_updated_at();

select
  'community_profiles' as check_name,
  count(*)::text as result
from public.community_profiles;
