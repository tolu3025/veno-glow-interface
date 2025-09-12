-- Clean up orphaned test questions and fix foreign key constraint

-- First, remove any test_questions that don't have corresponding tests in user_tests
DELETE FROM test_questions 
WHERE test_id NOT IN (SELECT id FROM user_tests);

-- Now drop and recreate the foreign key constraint correctly
ALTER TABLE test_questions DROP CONSTRAINT IF EXISTS test_questions_test_id_fkey;

-- Add the correct foreign key constraint pointing to user_tests
ALTER TABLE test_questions 
ADD CONSTRAINT test_questions_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES user_tests(id) ON DELETE CASCADE;