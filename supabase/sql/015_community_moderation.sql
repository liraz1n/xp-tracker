-- XP Tracker - Community moderation: blocks and message reports.
-- Rode este SQL no Supabase SQL Editor depois do SQL 014.

create table if not exists public.community_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  blocker_name text not null check (char_length(btrim(blocker_name)) between 2 and 40),
  blocked_name text not null check (char_length(btrim(blocked_name)) between 2 and 40),
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id)
);

create unique index if not exists community_blocks_pair_unique_idx
on public.community_blocks (blocker_id, blocked_id);

create index if not exists community_blocks_blocked_idx
on public.community_blocks (blocked_id, created_at desc);

alter table public.community_blocks enable row level security;

create or replace function public.is_community_blocked(left_user uuid, right_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_blocks block
    where (
      block.blocker_id = left_user
      and block.blocked_id = right_user
    )
    or (
      block.blocker_id = right_user
      and block.blocked_id = left_user
    )
  );
$$;

create or replace function public.has_accepted_community_friendship(
  left_user uuid,
  right_user uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.community_friend_requests friendship
    where friendship.status = 'accepted'
      and (
        (
          friendship.requester_id = left_user
          and friendship.addressee_id = right_user
        )
        or (
          friendship.requester_id = right_user
          and friendship.addressee_id = left_user
        )
      )
  )
  and not public.is_community_blocked(left_user, right_user);
$$;

drop policy if exists "community_blocks_select_participant"
on public.community_blocks;

create policy "community_blocks_select_participant"
on public.community_blocks
for select
to authenticated
using (
  auth.uid() = blocker_id
  or auth.uid() = blocked_id
);

drop policy if exists "community_blocks_insert_blocker"
on public.community_blocks;

create policy "community_blocks_insert_blocker"
on public.community_blocks
for insert
to authenticated
with check (
  auth.uid() = blocker_id
  and blocker_id <> blocked_id
);

drop policy if exists "community_blocks_delete_blocker"
on public.community_blocks;

create policy "community_blocks_delete_blocker"
on public.community_blocks
for delete
to authenticated
using (auth.uid() = blocker_id);

create table if not exists public.community_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reporter_name text not null check (char_length(btrim(reporter_name)) between 2 and 40),
  reported_name text not null check (char_length(btrim(reported_name)) between 2 and 40),
  message_body text not null,
  reason text not null default 'Mensagem denunciada pelo usuário.',
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check (reporter_id <> reported_user_id)
);

create unique index if not exists community_message_reports_once_idx
on public.community_message_reports (message_id, reporter_id);

create index if not exists community_message_reports_status_idx
on public.community_message_reports (status, created_at desc);

alter table public.community_message_reports enable row level security;

create or replace function public.validate_community_message_report_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if not public.is_xp_tracker_superadmin() then
    raise exception 'Apenas superadmin pode revisar denúncias.';
  end if;

  new.message_id := old.message_id;
  new.reporter_id := old.reporter_id;
  new.reported_user_id := old.reported_user_id;
  new.reporter_name := old.reporter_name;
  new.reported_name := old.reported_name;
  new.message_body := old.message_body;
  new.reason := old.reason;
  new.created_at := old.created_at;
  new.status := coalesce(new.status, old.status);

  if new.status = 'reviewed' and old.status <> 'reviewed' then
    new.reviewed_at := now();
    new.reviewed_by := current_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists community_message_reports_validate_update
on public.community_message_reports;

create trigger community_message_reports_validate_update
before update on public.community_message_reports
for each row
execute function public.validate_community_message_report_update();

drop policy if exists "community_message_reports_insert_participant"
on public.community_message_reports;

create policy "community_message_reports_insert_participant"
on public.community_message_reports
for insert
to authenticated
with check (
  auth.uid() = reporter_id
  and exists (
    select 1
    from public.community_messages message
    where message.id = message_id
      and (
        message.sender_id = auth.uid()
        or message.recipient_id = auth.uid()
      )
      and reported_user_id in (message.sender_id, message.recipient_id)
      and reported_user_id <> auth.uid()
  )
);

drop policy if exists "community_message_reports_select_superadmin"
on public.community_message_reports;

create policy "community_message_reports_select_superadmin"
on public.community_message_reports
for select
to authenticated
using (public.is_xp_tracker_superadmin());

drop policy if exists "community_message_reports_update_superadmin"
on public.community_message_reports;

create policy "community_message_reports_update_superadmin"
on public.community_message_reports
for update
to authenticated
using (public.is_xp_tracker_superadmin())
with check (public.is_xp_tracker_superadmin());

select
  'community_blocks' as check_name,
  count(*)::text as result
from public.community_blocks
union all
select
  'community_message_reports' as check_name,
  count(*)::text as result
from public.community_message_reports;
