-- Create course_materials table for storing class PDFs
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_content TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  institution TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for search
CREATE INDEX idx_course_materials_search ON public.course_materials 
USING gin(to_tsvector('english', course_name || ' ' || course_code || ' ' || course_title));

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Admin can manage course materials (using existing admin check pattern)
CREATE POLICY "Admins can manage course materials"
ON public.course_materials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN (SELECT email FROM auth.users WHERE auth.users.id = auth.uid())
  )
);

-- Everyone can read course materials
CREATE POLICY "Everyone can read course materials"
ON public.course_materials
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
BEFORE UPDATE ON public.course_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();