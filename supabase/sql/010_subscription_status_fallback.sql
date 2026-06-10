-- XP Tracker - Subscription status fallback for authenticated users.
-- Run this in Supabase SQL Editor after the billing tables exist.

create or replace function public.get_my_subscription_status()
returns table (
  status text,
  plan text,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  coupon_code text,
  discount_percent numeric,
  discount_amount_cents integer,
  discount_ends_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.status,
    s.plan,
    s.trial_ends_at,
    s.current_period_ends_at,
    s.coupon_code,
    s.discount_percent,
    s.discount_amount_cents,
    s.discount_ends_at
  from public.user_subscriptions s
  where s.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_subscription_status() to authenticated;

select *
from public.get_my_subscription_status();
