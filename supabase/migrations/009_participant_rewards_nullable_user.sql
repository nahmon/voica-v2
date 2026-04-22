-- Allow reward creation before participant authenticates.
-- user_id is filled in when participant claims the reward with their account.
alter table participant_rewards
  alter column user_id drop not null;
