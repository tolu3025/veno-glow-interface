
-- First, let's update the user_tests table to ensure result visibility options are properly defined
ALTER TYPE IF EXISTS test_results_visibility RENAME TO test_results_visibility_old;

CREATE TYPE test_results_visibility AS ENUM ('creator_only', 'test_takers', 'public');

-- Update the user_tests table to use the new enum type
ALTER TABLE user_tests 
ALTER COLUMN results_visibility TYPE test_results_visibility 
USING results_visibility::test_results_visibility;

-- Drop the old type if it exists
DROP TYPE IF EXISTS test_results_visibility_old;

-- Create a table to track test completions with specific visibility handling
CREATE TABLE IF NOT EXISTS test_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES user_tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_name TEXT,
  participant_email TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraint to ensure either user_id or participant_email is present
  CONSTRAINT test_completions_participant_check CHECK (
    user_id IS NOT NULL OR (participant_name IS NOT NULL AND participant_email IS NOT NULL)
  )
);

-- Enable RLS on test_completions
ALTER TABLE test_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_completions
CREATE POLICY "Test creators can view all completions for their tests"
  ON test_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_tests 
      WHERE user_tests.id = test_completions.test_id 
      AND user_tests.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own completions"
  ON test_completions FOR SELECT
  USING (
    user_id = auth.uid() OR 
    participant_email = auth.email()
  );

CREATE POLICY "Public can view completions for public tests"
  ON test_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_tests 
      WHERE user_tests.id = test_completions.test_id 
      AND user_tests.results_visibility = 'public'
    )
  );

CREATE POLICY "Anyone can insert test completions"
  ON test_completions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own completions"
  ON test_completions FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    participant_email = auth.email()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_completions_test_id ON test_completions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_user_id ON test_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_email ON test_completions(participant_email);
CREATE INDEX IF NOT EXISTS idx_test_completions_completed_at ON test_completions(completed_at);

-- Update existing test_attempts data to new structure if needed
INSERT INTO test_completions (
  test_id, user_id, participant_name, participant_email, 
  score, total_questions, time_taken, completed_at
)
SELECT DISTINCT
  test_id, user_id, participant_name, participant_email,
  score, total_questions, time_taken, completed_at
FROM test_attempts 
WHERE test_id IS NOT NULL
ON CONFLICT DO NOTHING;
