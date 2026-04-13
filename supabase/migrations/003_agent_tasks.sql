-- supabase/migrations/003_agent_tasks.sql
create table if not exists agent_tasks (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text        not null default 'pending'
                             check (status in ('pending','running','done','failed')),
  instruction    text        not null,
  tg_chat_id     text        not null,
  tg_message_id  text        not null,
  result_url     text,
  error_msg      text,
  started_at     timestamptz,
  done_at        timestamptz
);

-- 디스패처 시작 시 pending 재조회 인덱스
create index on agent_tasks (status, created_at)
  where status = 'pending';

-- Realtime 활성화
alter publication supabase_realtime add table agent_tasks;
