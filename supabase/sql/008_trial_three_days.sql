-- XP Tracker - Set the free trial to 3 days.
-- Run this in Supabase SQL Editor after the billing migration.

alter table public.user_subscriptions
alter column trial_ends_at set default (now() + interval '3 days');

update public.user_subscriptions as subscription
set
  trial_ends_at = subscription.trial_started_at + interval '3 days',
  updated_at = now()
from auth.users as account
where subscription.user_id = account.id
  and subscription.status = 'trialing'
  and coalesce(lower(account.email), '') <> 'ewertonpro11@gmail.com'
  and subscription.trial_ends_at > subscription.trial_started_at + interval '3 days';

select
  'trial_default_days' as check_name,
  '3' as result
union all
select
  'trialing_users_over_3_days' as check_name,
  count(*)::text as result
from public.user_subscriptions as subscription
join auth.users as account on account.id = subscription.user_id
where subscription.status = 'trialing'
  and coalesce(lower(account.email), '') <> 'ewertonpro11@gmail.com'
  and subscription.trial_ends_at > subscription.trial_started_at + interval '3 days';
