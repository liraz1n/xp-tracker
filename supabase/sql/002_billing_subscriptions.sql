-- XP Tracker - Billing foundation, trial access and discount coupons
-- Run this in Supabase SQL Editor after 001_xp_progress_rls.sql.

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'premium_monthly',
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  coupon_code text,
  discount_percent numeric(5, 2),
  discount_amount_cents integer,
  discount_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  discount_type text not null
    check (discount_type in ('percent', 'free_months', 'fixed_price_cents')),
  discount_value numeric(10, 2) not null,
  duration_type text not null
    check (duration_type in ('once', 'repeating', 'forever')),
  duration_months integer,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.discount_coupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (coupon_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_subscriptions_set_updated_at
on public.user_subscriptions;

create trigger user_subscriptions_set_updated_at
before update on public.user_subscriptions
for each row
execute function public.set_updated_at();

create or replace function public.create_user_subscription_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription
on auth.users;

create trigger on_auth_user_created_subscription
after insert on auth.users
for each row
execute function public.create_user_subscription_trial();

insert into public.user_subscriptions (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

insert into public.discount_coupons (
  code,
  description,
  discount_type,
  discount_value,
  duration_type,
  duration_months,
  max_redemptions
)
values
  (
    'BETA50',
    '50% de desconto por 3 meses para beta testers.',
    'percent',
    50,
    'repeating',
    3,
    null
  ),
  (
    'LIRA',
    'Primeiro mês grátis.',
    'free_months',
    1,
    'once',
    1,
    null
  ),
  (
    'FOUNDERS',
    'Preço fundador de R$ 2,50/mês para os primeiros apoiadores.',
    'fixed_price_cents',
    250,
    'forever',
    null,
    20
  )
on conflict (code) do update
set
  description = excluded.description,
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  duration_type = excluded.duration_type,
  duration_months = excluded.duration_months,
  max_redemptions = excluded.max_redemptions,
  active = true;

alter table public.user_subscriptions enable row level security;
alter table public.discount_coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

drop policy if exists "user_subscriptions_select_own"
on public.user_subscriptions;

create policy "user_subscriptions_select_own"
on public.user_subscriptions
for select
to authenticated
using (user_id::text = auth.uid()::text);

drop policy if exists "discount_coupons_select_active"
on public.discount_coupons;

create policy "discount_coupons_select_active"
on public.discount_coupons
for select
to authenticated
using (
  active = true
  and (expires_at is null or expires_at > now())
);

drop policy if exists "coupon_redemptions_select_own"
on public.coupon_redemptions;

create policy "coupon_redemptions_select_own"
on public.coupon_redemptions
for select
to authenticated
using (user_id::text = auth.uid()::text);

-- Verification query: should show one subscription row per user and the default coupons.
select
  'subscriptions' as source,
  count(*)::text as total
from public.user_subscriptions
union all
select
  'active_coupons' as source,
  count(*)::text as total
from public.discount_coupons
where active = true;

update public.discount_coupons
set active = false
where code = 'LIRA';

update public.discount_coupons
set
  description = 'Preço fundador de R$ 2,50/mês para os 10 primeiros assinantes.',
  max_redemptions = 10,
  active = true
where code = 'FOUNDERS';
