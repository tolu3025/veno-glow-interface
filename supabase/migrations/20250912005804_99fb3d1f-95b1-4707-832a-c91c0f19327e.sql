-- Fix RLS policies for test_questions table to reference the correct user_tests table instead of custom_tests

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert questions for their own tests" ON test_questions;
DROP POLICY IF EXISTS "Users can update questions for their own tests" ON test_questions;
DROP POLICY IF EXISTS "Users can delete questions for their own tests" ON test_questions;
DROP POLICY IF EXISTS "Users can view questions for public tests or their own tests" ON test_questions;

-- Create correct policies that reference user_tests table
CREATE POLICY "Users can insert questions for their own tests" 
ON test_questions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_questions.test_id 
    AND auth.uid() = user_tests.creator_id
  )
);

CREATE POLICY "Users can update questions for their own tests" 
ON test_questions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_questions.test_id 
    AND auth.uid() = user_tests.creator_id
  )
);

CREATE POLICY "Users can delete questions for their own tests" 
ON test_questions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_questions.test_id 
    AND auth.uid() = user_tests.creator_id
  )
);

CREATE POLICY "Users can view questions for public tests or their own tests" 
ON test_questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_tests 
    WHERE user_tests.id = test_questions.test_id 
    AND (user_tests.results_visibility = 'public' OR auth.uid() = user_tests.creator_id)
  )
);