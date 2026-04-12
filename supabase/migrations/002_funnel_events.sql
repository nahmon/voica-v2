-- Funnel event tracking for panel interview drop-off analysis
create table if not exists funnel_events (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  event_name  text        not null,
  share_code  text,
  session_id  text,
  q_index     integer,
  properties  jsonb       default '{}'
);

-- Index for querying by share_code (per-interview funnel view)
create index if not exists funnel_events_share_code_idx on funnel_events (share_code);
-- Index for querying by event type (global funnel view)
create index if not exists funnel_events_event_name_idx on funnel_events (event_name);
-- Index for time-based queries
create index if not exists funnel_events_created_at_idx on funnel_events (created_at desc);

-- Allow anonymous inserts (panel participants are not logged in)
alter table funnel_events enable row level security;
create policy "anon can insert funnel events"
  on funnel_events for insert
  to anon
  with check (true);

-- Researchers can read (for funnel analysis)
create policy "authenticated can read funnel events"
  on funnel_events for select
  to authenticated
  using (true);
