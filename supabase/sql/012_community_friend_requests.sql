-- XP Tracker - Community friend requests.
-- Rode este SQL no Supabase SQL Editor depois do SQL 011 da Comunidade.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.community_friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null check (char_length(btrim(requester_name)) between 2 and 40),
  addressee_name text not null check (char_length(btrim(addressee_name)) between 2 and 40),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create index if not exists community_friend_requests_requester_idx
on public.community_friend_requests (requester_id, status, updated_at desc);

create index if not exists community_friend_requests_addressee_idx
on public.community_friend_requests (addressee_id, status, updated_at desc);

drop index if exists public.community_friend_requests_pair_unique_idx;

create unique index community_friend_requests_pair_unique_idx
on public.community_friend_requests (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

alter table public.community_friend_requests enable row level security;

create or replace function public.validate_community_friend_request_update()
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

  new.requester_id := old.requester_id;
  new.addressee_id := old.addressee_id;
  new.created_at := old.created_at;

  if current_user_id = old.addressee_id then
    new.requester_name := old.requester_name;
    new.addressee_name := old.addressee_name;

    if new.status not in ('accepted', 'declined') then
      raise exception 'Resposta de amizade inválida.';
    end if;

    if old.status <> 'pending' then
      raise exception 'Este pedido já foi respondido.';
    end if;

    new.responded_at := coalesce(new.responded_at, now());
    return new;
  end if;

  if current_user_id = old.requester_id then
    if old.status not in ('declined', 'cancelled') then
      raise exception 'Este pedido não pode ser reenviado.';
    end if;

    if new.status <> 'pending' then
      raise exception 'Quem enviou o pedido só pode reenviar como pendente.';
    end if;

    new.responded_at := null;
    return new;
  end if;

  raise exception 'Você não participa deste pedido.';
end;
$$;

drop trigger if exists community_friend_requests_validate_update
on public.community_friend_requests;

create trigger community_friend_requests_validate_update
before update on public.community_friend_requests
for each row
execute function public.validate_community_friend_request_update();

drop policy if exists "community_friend_requests_select_participant"
on public.community_friend_requests;

create policy "community_friend_requests_select_participant"
on public.community_friend_requests
for select
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
);

drop policy if exists "community_friend_requests_insert_requester"
on public.community_friend_requests;

create policy "community_friend_requests_insert_requester"
on public.community_friend_requests
for insert
to authenticated
with check (
  auth.uid() = requester_id
  and requester_id <> addressee_id
  and exists (
    select 1
    from public.community_profiles requester_profile
    where requester_profile.user_id = auth.uid()
      and requester_profile.share_profile = true
  )
  and exists (
    select 1
    from public.community_profiles addressee_profile
    where addressee_profile.user_id = addressee_id
      and addressee_profile.share_profile = true
  )
);

drop policy if exists "community_friend_requests_update_participant"
on public.community_friend_requests;

create policy "community_friend_requests_update_participant"
on public.community_friend_requests
for update
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
)
with check (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
);

drop trigger if exists community_friend_requests_set_updated_at
on public.community_friend_requests;

create trigger community_friend_requests_set_updated_at
before update on public.community_friend_requests
for each row
execute function public.set_updated_at();

select
  'community_friend_requests' as check_name,
  count(*)::text as result
from public.community_friend_requests;
