-- XP Tracker - FOUNDERS lifetime access and OGANDALF launch coupon.
-- Run this in Supabase SQL Editor after 008_trial_three_days.sql.

delete from public.discount_coupons
where code = 'LIRA';

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
    'FOUNDERS',
    'Acesso vitalício por pagamento único de R$ 20,00 para os 10 primeiros fundadores.',
    'fixed_price_cents',
    2000,
    'forever',
    null,
    10,
    true
  ),
  (
    'OGANDALF',
    'Preço especial de R$ 2,50/mês para os 10 primeiros usos.',
    'fixed_price_cents',
    250,
    'forever',
    null,
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
  code,
  description,
  discount_type,
  discount_value,
  duration_type,
  max_redemptions,
  redeemed_count,
  active
from public.discount_coupons
where code in ('FOUNDERS', 'OGANDALF', 'LIRA')
order by code;
