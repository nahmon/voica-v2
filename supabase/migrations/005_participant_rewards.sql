-- Bank accounts registered by panel participants for reward payout
create table participant_bank_accounts (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references auth.users(id) on delete cascade not null unique,
  bank_name      text        not null,
  account_number text        not null,
  account_holder text        not null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Reward records created when a participant completes an interview
create table participant_rewards (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        references sessions(id) on delete cascade not null,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  interview_id uuid        references interviews(id) on delete cascade not null,
  amount       integer     not null,
  currency     text        not null default 'KRW',
  -- pending: created, claimed: account registered + requested, paid: admin confirmed payout
  status       text        not null default 'pending' check (status in ('pending','claimed','paid','cancelled')),
  claimed_at   timestamptz,
  paid_at      timestamptz,
  note         text,
  created_at   timestamptz default now()
);

alter table participant_bank_accounts enable row level security;
alter table participant_rewards       enable row level security;

create policy "owner_all"  on participant_bank_accounts for all    using (auth.uid() = user_id);
create policy "owner_read" on participant_rewards       for select using (auth.uid() = user_id);
create policy "owner_claim" on participant_rewards      for update using (auth.uid() = user_id);
