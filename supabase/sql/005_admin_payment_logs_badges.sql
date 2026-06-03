-- XP Tracker - Payment logs, secure admin overview and badges support.
-- Run this in Supabase SQL Editor after 002_billing_subscriptions.sql.

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  event_type text not null,
  status text,
  payment_mode text,
  coupon_code text,
  amount_cents integer,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_user_id_created_at_idx
on public.payment_events (user_id, created_at desc);

create index if not exists payment_events_provider_payment_id_idx
on public.payment_events (provider_payment_id);

alter table public.payment_events enable row level security;

drop policy if exists "payment_events_select_own"
on public.payment_events;

create policy "payment_events_select_own"
on public.payment_events
for select
to authenticated
using (user_id::text = auth.uid()::text);

create or replace function public.is_xp_tracker_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'email') = 'ewertonpro11@gmail.com', false);
$$;

create or replace function public.get_admin_user_overview()
returns table (
  user_id uuid,
  email text,
  display_name text,
  subscription_status text,
  plan text,
  coupon_code text,
  current_period_ends_at timestamptz,
  payment_events_count bigint,
  last_payment_status text,
  progress_updated_at timestamptz,
  total_xp numeric,
  current_xp numeric,
  user_total_xp numeric
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email::text,
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name') as display_name,
    s.status as subscription_status,
    s.plan,
    s.coupon_code,
    s.current_period_ends_at,
    count(pe.id) as payment_events_count,
    (
      array_agg(pe.status order by pe.created_at desc)
        filter (where pe.status is not null)
    )[1] as last_payment_status,
    xp.updated_at as progress_updated_at,
    xp.total_xp::numeric,
    xp.current_xp::numeric,
    xp.user_total_xp::numeric
  from auth.users u
  left join public.user_subscriptions s on s.user_id = u.id
  left join public.payment_events pe on pe.user_id = u.id
  left join public.xp_progress xp on xp.user_id = u.id
  where public.is_xp_tracker_superadmin()
  group by
    u.id,
    u.email,
    u.raw_user_meta_data,
    s.status,
    s.plan,
    s.coupon_code,
    s.current_period_ends_at,
    xp.updated_at,
    xp.total_xp,
    xp.current_xp,
    xp.user_total_xp
  order by coalesce(xp.updated_at, u.created_at) desc;
$$;

grant execute on function public.is_xp_tracker_superadmin() to authenticated;
grant execute on function public.get_admin_user_overview() to authenticated;

insert into public.discount_coupons (
  code,
  description,
  discount_type,
  discount_value,
  duration_type,
  duration_months,
  max_redemptions,
  active
)
values
  (
    'TOFUS',
    '50% de desconto limitado aos 10 primeiros usos.',
    'percent',
    50,
    'once',
    1,
    10,
    true
  )
on conflict (code) do update
set
  description = excluded.description,
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  duration_type = excluded.duration_type,
  duration_months = excluded.duration_months,
  max_redemptions = excluded.max_redemptions,
  active = excluded.active;

select
  'payment_events' as check_name,
  count(*)::text as result
from public.payment_events
union all
select
  'active_badge_coupons' as check_name,
  count(*)::text as result
from public.discount_coupons
where active = true
  and code in ('FOUNDERS', 'TOFUS');
