-- XP Tracker - Community polish: typing status, social logs and admin overview.
-- Run this in Supabase SQL Editor after SQL 016.

create table if not exists public.community_typing_status (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  is_typing boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipient_id),
  check (user_id <> recipient_id)
);

create index if not exists community_typing_status_recipient_idx
on public.community_typing_status (recipient_id, updated_at desc);

alter table public.community_typing_status enable row level security;

drop trigger if exists community_typing_status_set_updated_at
on public.community_typing_status;

create trigger community_typing_status_set_updated_at
before update on public.community_typing_status
for each row
execute function public.set_updated_at();

drop policy if exists "community_typing_status_select_participant"
on public.community_typing_status;

create policy "community_typing_status_select_participant"
on public.community_typing_status
for select
to authenticated
using (
  (
    auth.uid() = user_id
    or auth.uid() = recipient_id
  )
  and public.has_accepted_community_friendship(user_id, recipient_id)
);

drop policy if exists "community_typing_status_upsert_own"
on public.community_typing_status;

create policy "community_typing_status_upsert_own"
on public.community_typing_status
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.has_accepted_community_friendship(user_id, recipient_id)
);

drop policy if exists "community_typing_status_update_own"
on public.community_typing_status;

create policy "community_typing_status_update_own"
on public.community_typing_status
for update
to authenticated
using (
  auth.uid() = user_id
  and public.has_accepted_community_friendship(user_id, recipient_id)
)
with check (
  auth.uid() = user_id
  and public.has_accepted_community_friendship(user_id, recipient_id)
);

create table if not exists public.community_social_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  actor_name text not null default 'Jogador XP' check (char_length(btrim(actor_name)) between 2 and 40),
  target_name text not null default 'Jogador XP' check (char_length(btrim(target_name)) between 2 and 40),
  action_type text not null check (
    action_type in (
      'friend_request_sent',
      'friend_request_accepted',
      'friend_request_declined',
      'friend_removed',
      'user_blocked',
      'user_unblocked',
      'message_sent',
      'message_reported',
      'run_status_enabled',
      'run_status_disabled',
      'run_invite_sent',
      'run_invite_accepted',
      'run_invite_declined'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists community_social_logs_created_idx
on public.community_social_logs (created_at desc);

create index if not exists community_social_logs_actor_idx
on public.community_social_logs (actor_id, created_at desc);

alter table public.community_social_logs enable row level security;

drop policy if exists "community_social_logs_insert_actor"
on public.community_social_logs;

create policy "community_social_logs_insert_actor"
on public.community_social_logs
for insert
to authenticated
with check (auth.uid() = actor_id);

drop policy if exists "community_social_logs_select_superadmin"
on public.community_social_logs;

create policy "community_social_logs_select_superadmin"
on public.community_social_logs
for select
to authenticated
using (public.is_xp_tracker_superadmin());

create or replace function public.get_admin_social_overview()
returns table (
  metric_name text,
  result integer
)
language sql
security definer
set search_path = public
stable
as $$
  select *
  from (
    select 'community_profiles'::text as metric_name, count(*)::integer as result
    from public.community_profiles
    where share_profile = true

    union all

    select 'accepted_friendships'::text as metric_name, count(*)::integer as result
    from public.community_friend_requests
    where status = 'accepted'

    union all

    select 'open_friend_requests'::text as metric_name, count(*)::integer as result
    from public.community_friend_requests
    where status = 'pending'

    union all

    select 'messages_sent'::text as metric_name, count(*)::integer as result
    from public.community_messages

    union all

    select 'unread_messages'::text as metric_name, count(*)::integer as result
    from public.community_messages
    where read_at is null

    union all

    select 'looking_for_run'::text as metric_name, count(*)::integer as result
    from public.community_run_status
    where looking_for_run = true

    union all

    select 'pending_run_invites'::text as metric_name, count(*)::integer as result
    from public.community_run_invites
    where status = 'pending'

    union all

    select 'blocked_pairs'::text as metric_name, count(*)::integer as result
    from public.community_blocks

    union all

    select 'open_reports'::text as metric_name, count(*)::integer as result
    from public.community_message_reports
    where status = 'open'
  ) metrics
  where public.is_xp_tracker_superadmin();
$$;

grant execute on function public.get_admin_social_overview() to authenticated;

create or replace function public.get_admin_social_logs()
returns table (
  id uuid,
  actor_name text,
  target_name text,
  action_type text,
  metadata jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    log.id,
    log.actor_name,
    log.target_name,
    log.action_type,
    log.metadata,
    log.created_at
  from public.community_social_logs log
  where public.is_xp_tracker_superadmin()
  order by log.created_at desc
  limit 30;
$$;

grant execute on function public.get_admin_social_logs() to authenticated;

select
  'community_typing_status' as check_name,
  count(*)::text as result
from public.community_typing_status
union all
select
  'community_social_logs' as check_name,
  count(*)::text as result
from public.community_social_logs;
