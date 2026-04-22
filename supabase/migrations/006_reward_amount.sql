-- Fix: sessions update policy was too permissive (any anon could update any session)
drop policy if exists "anon_update_own" on sessions;
create policy "anon_update_in_progress" on sessions
  for update using (status = 'in_progress');

-- Add numeric reward_amount to interviews for participant reward calculation
alter table interviews add column if not exists reward_amount integer not null default 0;
