-- XP Tracker - Allow users to remove their own community friendships.
-- Rode este SQL no Supabase SQL Editor depois do SQL 012.

drop policy if exists "community_friend_requests_delete_participant"
on public.community_friend_requests;

create policy "community_friend_requests_delete_participant"
on public.community_friend_requests
for delete
to authenticated
using (
  auth.uid() = requester_id
  or auth.uid() = addressee_id
);

select
  'community_friend_requests_delete_policy' as check_name,
  'ok' as result;
