
-- Revert test_attempts policies to require authentication
DROP POLICY IF EXISTS "Anyone can insert test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Anyone can view test attempts they created" ON public.test_attempts;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can insert their own test attempts" 
ON public.test_attempts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can view their own test attempts or attempts for tests they created" 
ON public.test_attempts 
FOR SELECT 
USING (
  -- User can view their own attempts
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  -- Test creators can view attempts for their tests
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_attempts.test_id 
    AND user_tests.creator_id = auth.uid()
  )) OR
  -- Public results visibility
  (EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_attempts.test_id 
    AND user_tests.results_visibility = 'public'
  ))
);

CREATE POLICY "Users can update their own test attempts" 
ON public.test_attempts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can delete their own test attempts" 
ON public.test_attempts 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Update user_tests policies to require authentication for accessing tests
DROP POLICY IF EXISTS "Public access to tests with share codes or owned tests" ON public.user_tests;

CREATE POLICY "Authenticated users can view tests they own or public tests" 
ON public.user_tests 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- User owns the test
    creator_id = auth.uid() OR
    -- Test is public or has share code (but user must be authenticated)
    results_visibility = 'public' OR
    share_code IS NOT NULL
  )
);

-- Update user_test_questions policies to require authentication
DROP POLICY IF EXISTS "Public access to questions for tests with share codes" ON public.user_test_questions;

CREATE POLICY "Authenticated users can view questions for accessible tests" 
ON public.user_test_questions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = user_test_questions.test_id 
    AND (
      -- User owns the test
      user_tests.creator_id = auth.uid() OR
      -- Test is accessible (public or has share code)
      user_tests.results_visibility = 'public' OR
      user_tests.share_code IS NOT NULL
    )
  )
);

-- Fix the retakes issue by ensuring allow_retakes is properly enforced
-- Add a function to check if user can take the test based on retakes setting
CREATE OR REPLACE FUNCTION public.can_user_take_test(p_test_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_allows_retakes boolean;
  previous_attempts_count integer;
BEGIN
  -- Get the test's retake setting
  SELECT allow_retakes INTO test_allows_retakes
  FROM user_tests
  WHERE id = p_test_id;
  
  -- If retakes are allowed, user can always take the test
  IF test_allows_retakes = true THEN
    RETURN true;
  END IF;
  
  -- If retakes are not allowed, check if user has previous attempts
  SELECT COUNT(*) INTO previous_attempts_count
  FROM test_attempts
  WHERE test_id = p_test_id AND user_id = p_user_id;
  
  -- User can take test only if they have no previous attempts
  RETURN previous_attempts_count = 0;
END;
$$;

-- Update the test_attempts insert policy to check retakes
DROP POLICY IF EXISTS "Authenticated users can insert their own test attempts" ON public.test_attempts;

CREATE POLICY "Authenticated users can insert test attempts if allowed" 
ON public.test_attempts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid() AND
  public.can_user_take_test(test_id, auth.uid())
);
