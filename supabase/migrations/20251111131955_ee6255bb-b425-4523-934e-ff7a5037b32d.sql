-- Update past_questions exam_type check constraint to include all level options
ALTER TABLE public.past_questions 
DROP CONSTRAINT IF EXISTS past_questions_exam_type_check;

ALTER TABLE public.past_questions
ADD CONSTRAINT past_questions_exam_type_check 
CHECK (exam_type = ANY (ARRAY[
  '100-level'::text,
  '200-level'::text,
  '300-level'::text,
  '400-level'::text,
  '500-level'::text,
  '600-level'::text,
  'post-utme'::text,
  'waec'::text,
  'jamb'::text,
  'neco'::text,
  'other'::text
]));