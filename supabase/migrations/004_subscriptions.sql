-- Subscriptions: one active subscription per user
create table subscriptions (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        references auth.users(id) on delete cascade not null unique,
  plan                 text        not null default 'pro',
  billing_cycle        text        not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  status               text        not null default 'active' check (status in ('active','cancelled','expired','past_due')),
  amount               integer     not null,
  current_period_start timestamptz not null,
  current_period_end   timestamptz not null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Payment history per subscription
create table subscription_payments (
  id               uuid        primary key default gen_random_uuid(),
  subscription_id  uuid        references subscriptions(id) on delete cascade,
  user_id          uuid        references auth.users(id) on delete cascade not null,
  toss_payment_key text,
  toss_order_id    text        unique not null,
  amount           integer     not null,
  status           text        not null default 'pending' check (status in ('pending','done','failed')),
  paid_at          timestamptz,
  created_at       timestamptz default now()
);

alter table subscriptions         enable row level security;
alter table subscription_payments enable row level security;

create policy "owner_all" on subscriptions         for all using (auth.uid() = user_id);
create policy "owner_all" on subscription_payments for all using (auth.uid() = user_id);
