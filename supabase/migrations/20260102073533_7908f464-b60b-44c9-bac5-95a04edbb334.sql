-- Drop the existing restrictive SELECT policy on test_questions
DROP POLICY IF EXISTS "Users can view questions for public tests or their own tests" ON test_questions;

-- Create a new policy that allows access for tests with share codes (shared tests)
CREATE POLICY "Users can view questions for accessible tests" 
ON test_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_questions.test_id 
    AND (
      user_tests.share_code IS NOT NULL -- Tests with share codes are accessible
      OR user_tests.results_visibility = 'public' -- Public tests
      OR auth.uid() = user_tests.creator_id -- Creator can always see
    )
  )
);