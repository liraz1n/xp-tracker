-- XP Tracker - Private chat between accepted community friends.
-- Rode este SQL no Supabase SQL Editor depois do SQL 013.

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
  );
$$;

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null check (char_length(btrim(sender_name)) between 2 and 40),
  recipient_name text not null check (char_length(btrim(recipient_name)) between 2 and 40),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists community_messages_sender_recipient_idx
on public.community_messages (sender_id, recipient_id, created_at desc);

create index if not exists community_messages_recipient_unread_idx
on public.community_messages (recipient_id, read_at, created_at desc);

alter table public.community_messages enable row level security;

create or replace function public.validate_community_message_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if current_user_id <> old.recipient_id then
    raise exception 'Apenas o destinatário pode marcar a mensagem como lida.';
  end if;

  new.sender_id := old.sender_id;
  new.recipient_id := old.recipient_id;
  new.sender_name := old.sender_name;
  new.recipient_name := old.recipient_name;
  new.body := old.body;
  new.created_at := old.created_at;
  new.read_at := coalesce(new.read_at, now());

  return new;
end;
$$;

drop trigger if exists community_messages_validate_update
on public.community_messages;

create trigger community_messages_validate_update
before update on public.community_messages
for each row
execute function public.validate_community_message_update();

drop policy if exists "community_messages_select_friends"
on public.community_messages;

create policy "community_messages_select_friends"
on public.community_messages
for select
to authenticated
using (
  (
    auth.uid() = sender_id
    or auth.uid() = recipient_id
  )
  and public.has_accepted_community_friendship(sender_id, recipient_id)
);

drop policy if exists "community_messages_insert_sender"
on public.community_messages;

create policy "community_messages_insert_sender"
on public.community_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> recipient_id
  and public.has_accepted_community_friendship(sender_id, recipient_id)
);

drop policy if exists "community_messages_update_recipient_read"
on public.community_messages;

create policy "community_messages_update_recipient_read"
on public.community_messages
for update
to authenticated
using (
  auth.uid() = recipient_id
  and public.has_accepted_community_friendship(sender_id, recipient_id)
)
with check (
  auth.uid() = recipient_id
  and public.has_accepted_community_friendship(sender_id, recipient_id)
);

select
  'community_messages' as check_name,
  count(*)::text as result
from public.community_messages;
