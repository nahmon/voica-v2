-- Prevent duplicate responses for same session+question
-- Uses ON CONFLICT DO NOTHING pattern instead of hard constraint
-- to handle retries gracefully without 409 errors
alter table responses
  drop constraint if exists responses_session_question_unique;

alter table responses
  add constraint responses_session_question_unique
  unique (session_id, question_id);
