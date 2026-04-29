-- MANUAL APPLY REQUIRED: Run in Supabase SQL editor

-- Fix sessions RLS: restrict anonymous updates to in-progress sessions only
-- Previously: USING (true) allowed any anon user to update any session

drop policy if exists "anon_update_own" on sessions;

create policy "anon_update_in_progress" on sessions
  for update
  to anon
  using (status = 'in_progress')
  with check (status in ('in_progress', 'completed', 'abandoned'));
