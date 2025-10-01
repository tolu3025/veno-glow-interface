-- Create update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create past_questions table
CREATE TABLE IF NOT EXISTS public.past_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  school TEXT NOT NULL,
  year TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('post-utme', 'waec', 'jamb', 'neco', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID,
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

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_past_questions_school ON public.past_questions(school);
CREATE INDEX IF NOT EXISTS idx_past_questions_exam_type ON public.past_questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_past_questions_subject ON public.past_questions(subject);

-- Add trigger for updated_at
CREATE TRIGGER update_past_questions_updated_at
BEFORE UPDATE ON public.past_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();