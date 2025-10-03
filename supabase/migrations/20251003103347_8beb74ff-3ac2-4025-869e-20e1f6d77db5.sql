-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS public.past_questions CASCADE;

-- Create past_questions table
CREATE TABLE public.past_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  school TEXT NOT NULL,
  year TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('post-utme', 'waec', 'jamb', 'neco', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view past questions"
ON public.past_questions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can upload past questions"
ON public.past_questions
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own uploads"
ON public.past_questions
FOR UPDATE
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own uploads"
ON public.past_questions
FOR DELETE
USING (auth.uid() = uploaded_by);

-- Create indexes for better performance
CREATE INDEX idx_past_questions_school ON public.past_questions(school);
CREATE INDEX idx_past_questions_exam_type ON public.past_questions(exam_type);
CREATE INDEX idx_past_questions_subject ON public.past_questions(subject);

-- Add trigger for updated_at
CREATE TRIGGER update_past_questions_updated_at
BEFORE UPDATE ON public.past_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
