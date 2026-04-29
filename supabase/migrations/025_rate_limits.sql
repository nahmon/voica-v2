create table if not exists rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

-- No RLS needed — only accessed via service role key in API functions
alter table rate_limits disable row level security;

-- Atomic upsert function: increments counter, returns true if request is allowed
create or replace function check_rate_limit(p_key text, p_max integer, p_window_ms integer default 60000)
returns boolean
language plpgsql
as $$
declare
  v_count integer;
  v_reset_at timestamptz;
  v_new_reset timestamptz;
begin
  v_new_reset := now() + (p_window_ms || ' milliseconds')::interval;

  select count, reset_at into v_count, v_reset_at
  from rate_limits
  where key = p_key
  for update;

  if not found or now() > v_reset_at then
    insert into rate_limits (key, count, reset_at)
    values (p_key, 1, v_new_reset)
    on conflict (key) do update
      set count = 1, reset_at = excluded.reset_at;
    return true;
  end if;

  update rate_limits set count = count + 1 where key = p_key;
  return v_count < p_max;
end;
$$;
