
-- Create a function to count questions in a test
CREATE OR REPLACE FUNCTION public.get_question_count(test_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.test_questions
  WHERE test_id = $1;
$$;
