-- XP Tracker - Community run status and run invites.
-- Run this in Supabase SQL Editor after SQL 015.

create table if not exists public.community_run_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  looking_for_run boolean not null default false,
  activity_type text not null default 'qualquer'
    check (activity_type in ('qualquer', 'cripta_1', 'cripta_2', 'cripta_3', 'masmorra')),
  note text not null default '' check (char_length(note) <= 120),
  updated_at timestamptz not null default now()
);

create index if not exists community_run_status_looking_idx
on public.community_run_status (looking_for_run, updated_at desc);

alter table public.community_run_status enable row level security;

drop policy if exists "community_run_status_select_visible"
on public.community_run_status;

create policy "community_run_status_select_visible"
on public.community_run_status
for select
to authenticated
using (
  exists (
    select 1
    from public.community_profiles profile
    where profile.user_id = auth.uid()
      and profile.share_profile = true
  )
);

drop policy if exists "community_run_status_insert_own"
on public.community_run_status;

create policy "community_run_status_insert_own"
on public.community_run_status
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "community_run_status_update_own"
on public.community_run_status;

create policy "community_run_status_update_own"
on public.community_run_status
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community_run_status_delete_own"
on public.community_run_status;

create policy "community_run_status_delete_own"
on public.community_run_status
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists community_run_status_set_updated_at
on public.community_run_status;

create trigger community_run_status_set_updated_at
before update on public.community_run_status
for each row
execute function public.set_updated_at();

create table if not exists public.community_run_invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(btrim(sender_name)) between 2 and 40),
  recipient_name text not null check (char_length(btrim(recipient_name)) between 2 and 40),
  activity_type text not null
    check (activity_type in ('qualquer', 'cripta_1', 'cripta_2', 'cripta_3', 'masmorra')),
  note text not null default '' check (char_length(note) <= 160),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists community_run_invites_sender_idx
on public.community_run_invites (sender_id, status, updated_at desc);

create index if not exists community_run_invites_recipient_idx
on public.community_run_invites (recipient_id, status, updated_at desc);

alter table public.community_run_invites enable row level security;

create or replace function public.validate_community_run_invite_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  new.sender_id := old.sender_id;
  new.recipient_id := old.recipient_id;
  new.sender_name := old.sender_name;
  new.recipient_name := old.recipient_name;
  new.activity_type := old.activity_type;
  new.note := old.note;
  new.created_at := old.created_at;

  if current_user_id = old.recipient_id then
    if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
      raise exception 'Convite de run nao pode ser alterado desse jeito.';
    end if;

    new.responded_at := coalesce(new.responded_at, now());
  elsif current_user_id = old.sender_id then
    if old.status <> 'pending' or new.status <> 'cancelled' then
      raise exception 'Apenas convites pendentes podem ser cancelados.';
    end if;

    new.responded_at := coalesce(new.responded_at, now());
  else
    raise exception 'Apenas participantes podem alterar o convite.';
  end if;

  return new;
end;
$$;

drop trigger if exists community_run_invites_validate_update
on public.community_run_invites;

create trigger community_run_invites_validate_update
before update on public.community_run_invites
for each row
execute function public.validate_community_run_invite_update();

drop trigger if exists community_run_invites_set_updated_at
on public.community_run_invites;

create trigger community_run_invites_set_updated_at
before update on public.community_run_invites
for each row
execute function public.set_updated_at();

drop policy if exists "community_run_invites_select_participant"
on public.community_run_invites;

create policy "community_run_invites_select_participant"
on public.community_run_invites
for select
to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
);

drop policy if exists "community_run_invites_insert_sender_friend"
on public.community_run_invites;

create policy "community_run_invites_insert_sender_friend"
on public.community_run_invites
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> recipient_id
  and public.has_accepted_community_friendship(sender_id, recipient_id)
);

drop policy if exists "community_run_invites_update_participant"
on public.community_run_invites;

create policy "community_run_invites_update_participant"
on public.community_run_invites
for update
to authenticated
using (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
)
with check (
  auth.uid() = sender_id
  or auth.uid() = recipient_id
);

select
  'community_run_status' as check_name,
  count(*)::text as result
from public.community_run_status
union all
select
  'community_run_invites' as check_name,
  count(*)::text as result
from public.community_run_invites;
