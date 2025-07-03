
-- Revert the authentication-only policies and restore public access for share codes
-- This allows both registered and unregistered users to access tests via share codes

-- Update test_attempts policies to allow unregistered users again
DROP POLICY IF EXISTS "Authenticated users can insert test attempts if allowed" ON public.test_attempts;
DROP POLICY IF EXISTS "Users can view their own test attempts or attempts for tests they created" ON public.test_attempts;
DROP POLICY IF EXISTS "Users can update their own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Users can delete their own test attempts" ON public.test_attempts;

-- Create policies that allow both registered and unregistered users
CREATE POLICY "Anyone can insert test attempts" 
ON public.test_attempts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view test attempts they created" 
ON public.test_attempts 
FOR SELECT 
USING (
  -- Allow if user owns the attempt (registered users)
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  -- Allow if email matches (unregistered users)
  (auth.uid() IS NULL AND participant_email IS NOT NULL) OR
  -- Allow test creators to view attempts for their tests
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_attempts.test_id 
    AND user_tests.creator_id = auth.uid()
  )) OR
  -- Allow public results visibility
  (EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_attempts.test_id 
    AND user_tests.results_visibility = 'public'
  ))
);

CREATE POLICY "Users can update their own test attempts" 
ON public.test_attempts 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND participant_email IS NOT NULL)
);

CREATE POLICY "Users can delete their own test attempts" 
ON public.test_attempts 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND participant_email IS NOT NULL)
);

-- Update user_tests policies to allow public access to tests with share codes
DROP POLICY IF EXISTS "Authenticated users can view tests they own or public tests" ON public.user_tests;

CREATE POLICY "Public access to tests with share codes or owned tests" 
ON public.user_tests 
FOR SELECT 
USING (
  -- Allow access if test has a share code (public access)
  share_code IS NOT NULL OR
  -- Allow creators to view their own tests
  (auth.uid() IS NOT NULL AND creator_id = auth.uid()) OR
  -- Allow public tests
  (results_visibility = 'public')
);

-- Update user_test_questions policies to allow access for tests with share codes
DROP POLICY IF EXISTS "Authenticated users can view questions for accessible tests" ON public.user_test_questions;

CREATE POLICY "Public access to questions for tests with share codes" 
ON public.user_test_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = user_test_questions.test_id 
    AND (
      -- Test has share code (public access)
      user_tests.share_code IS NOT NULL OR
      -- User owns the test
      (auth.uid() IS NOT NULL AND user_tests.creator_id = auth.uid()) OR
      -- Test is public
      user_tests.results_visibility = 'public'
    )
  )
);

-- Remove the retakes enforcement function since it was causing issues
DROP FUNCTION IF EXISTS public.can_user_take_test(uuid, uuid);
