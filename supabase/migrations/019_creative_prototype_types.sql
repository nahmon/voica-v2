-- Allow creative and prototype question types (added in UI but missing from DB constraint)
ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_type_check
    CHECK (type IN ('voice', 'multiple_choice', 'likert', 'creative', 'prototype'));

-- Also update responses table to allow the same types
ALTER TABLE responses
  DROP CONSTRAINT IF EXISTS responses_type_check;
ALTER TABLE responses
  ADD CONSTRAINT responses_type_check
    CHECK (type IN ('voice', 'multiple_choice', 'likert', 'creative', 'prototype'));
