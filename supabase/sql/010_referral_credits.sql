-- XP Tracker - Referral credits.
-- Rule: every 5 qualified referrals generate 1 credit worth R$ 0,50.
-- Run this in Supabase SQL Editor after 009_founders_lifetime_ogandalf.sql.

create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  status text not null default 'qualified'
    check (status in ('pending', 'qualified', 'blocked')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz not null default now(),
  unique (referred_user_id),
  check (referrer_user_id <> referred_user_id)
);

create table if not exists public.referral_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null,
  transaction_type text not null
    check (transaction_type in ('checkout_discount', 'manual_adjustment')),
  reference_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists referrals_referrer_status_idx
on public.referrals (referrer_user_id, status, created_at desc);

create index if not exists referral_credit_transactions_user_created_idx
on public.referral_credit_transactions (user_id, created_at desc);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_credit_transactions enable row level security;

drop policy if exists "referral_codes_select_own"
on public.referral_codes;

create policy "referral_codes_select_own"
on public.referral_codes
for select
to authenticated
using (user_id::text = auth.uid()::text);

drop policy if exists "referrals_select_involved"
on public.referrals;

create policy "referrals_select_involved"
on public.referrals
for select
to authenticated
using (
  referrer_user_id::text = auth.uid()::text
  or referred_user_id::text = auth.uid()::text
);

drop policy if exists "referral_credit_transactions_select_own"
on public.referral_credit_transactions;

create policy "referral_credit_transactions_select_own"
on public.referral_credit_transactions
for select
to authenticated
using (user_id::text = auth.uid()::text);

create or replace function public.ensure_my_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_code text;
  new_code text;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  select code into existing_code
  from public.referral_codes
  where user_id = current_user_id;

  if existing_code is not null then
    return existing_code;
  end if;

  loop
    new_code := upper(substr(md5(current_user_id::text || clock_timestamp()::text || random()::text), 1, 8));

    begin
      insert into public.referral_codes (user_id, code)
      values (current_user_id, new_code);

      return new_code;
    exception when unique_violation then
      -- Try another random code.
    end;
  end loop;
end;
$$;

create or replace function public.accept_referral_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_code text := upper(trim(coalesce(p_code, '')));
  referrer_id uuid;
begin
  if current_user_id is null or normalized_code = '' then
    return false;
  end if;

  select user_id into referrer_id
  from public.referral_codes
  where code = normalized_code;

  if referrer_id is null or referrer_id = current_user_id then
    return false;
  end if;

  insert into public.referrals (
    referrer_user_id,
    referred_user_id,
    code,
    status,
    qualified_at
  )
  values (
    referrer_id,
    current_user_id,
    normalized_code,
    'qualified',
    now()
  )
  on conflict (referred_user_id) do nothing;

  return true;
end;
$$;

create or replace function public.get_my_referral_summary()
returns table (
  code text,
  qualified_referrals integer,
  credits_earned integer,
  credits_used integer,
  credits_available integer,
  available_cents integer,
  next_credit_progress integer
)
language sql
security definer
set search_path = public
as $$
  with my_code as (
    select public.ensure_my_referral_code() as code
  ),
  qualified as (
    select count(*)::integer as total
    from public.referrals
    where referrer_user_id = auth.uid()
      and status = 'qualified'
  ),
  used as (
    select coalesce(sum(abs(amount_cents)), 0)::integer as total_cents
    from public.referral_credit_transactions
    where user_id = auth.uid()
      and transaction_type = 'checkout_discount'
      and amount_cents < 0
  )
  select
    my_code.code,
    qualified.total as qualified_referrals,
    floor(qualified.total / 5)::integer as credits_earned,
    floor(used.total_cents / 50)::integer as credits_used,
    greatest(floor(qualified.total / 5)::integer - floor(used.total_cents / 50)::integer, 0) as credits_available,
    greatest((floor(qualified.total / 5)::integer * 50) - used.total_cents, 0) as available_cents,
    mod(qualified.total, 5)::integer as next_credit_progress
  from my_code, qualified, used;
$$;

grant execute on function public.ensure_my_referral_code() to authenticated;
grant execute on function public.accept_referral_code(text) to authenticated;
grant execute on function public.get_my_referral_summary() to authenticated;

select
  'referral_codes' as check_name,
  count(*)::text as result
from public.referral_codes
union all
select
  'referrals' as check_name,
  count(*)::text as result
from public.referrals
union all
select
  'referral_credit_transactions' as check_name,
  count(*)::text as result
from public.referral_credit_transactions;
