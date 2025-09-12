-- Fix foreign key constraint in test_questions table to reference user_tests instead of custom_tests

-- First drop the existing foreign key constraint
ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_test_id_fkey;

-- Add the correct foreign key constraint pointing to user_tests
ALTER TABLE test_questions 
ADD CONSTRAINT test_questions_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES user_tests(id) ON DELETE CASCADE;