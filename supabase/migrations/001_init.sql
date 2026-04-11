-- interviews
create table interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  share_code text unique not null,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade not null,
  order_num int not null,
  type text not null check (type in ('voice','multiple_choice','likert')),
  content text not null,
  options jsonb,
  tts_url text,
  created_at timestamptz default now()
);

-- sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade not null,
  respondent jsonb,
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- responses
create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  type text not null check (type in ('voice','multiple_choice','likert')),
  audio_url text,
  transcript text,
  value jsonb,
  created_at timestamptz default now()
);

-- reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade not null,
  content jsonb,
  status text not null default 'generating' check (status in ('generating','completed','failed')),
  created_at timestamptz default now()
);

-- RLS
alter table interviews enable row level security;
alter table questions enable row level security;
alter table sessions enable row level security;
alter table responses enable row level security;
alter table reports enable row level security;

-- interviews: owner can do everything; anon can read active by share_code
create policy "owner_all" on interviews for all using (auth.uid() = user_id);
create policy "anon_read_active" on interviews for select using (status = 'active');

-- questions: owner can manage; anon can read questions of active interviews
create policy "owner_all" on questions for all using (
  exists (select 1 from interviews where interviews.id = questions.interview_id and interviews.user_id = auth.uid())
);
create policy "anon_read" on questions for select using (
  exists (select 1 from interviews where interviews.id = questions.interview_id and interviews.status = 'active')
);

-- sessions: anon can insert/update; owner can read
create policy "anon_insert" on sessions for insert with check (true);
create policy "anon_update_own" on sessions for update using (true);
create policy "owner_read" on sessions for select using (
  exists (select 1 from interviews where interviews.id = sessions.interview_id and interviews.user_id = auth.uid())
);

-- responses: anon can insert; owner can read
create policy "anon_insert" on responses for insert with check (true);
create policy "owner_read" on responses for select using (
  exists (
    select 1 from sessions
    join interviews on interviews.id = sessions.interview_id
    where sessions.id = responses.session_id and interviews.user_id = auth.uid()
  )
);

-- reports: owner only
create policy "owner_all" on reports for all using (
  exists (select 1 from interviews where interviews.id = reports.interview_id and interviews.user_id = auth.uid())
);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger interviews_updated_at
  before update on interviews
  for each row execute function update_updated_at();
