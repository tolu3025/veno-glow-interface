-- Create enum types for organization exam system
CREATE TYPE organization_type AS ENUM ('school', 'university', 'exam_center', 'training_institute');
CREATE TYPE org_exam_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'cancelled');
CREATE TYPE exam_session_status AS ENUM ('registered', 'in_progress', 'submitted', 'disqualified', 'expired');
CREATE TYPE academic_level AS ENUM ('jss1', 'jss2', 'jss3', 'sss1', 'sss2', 'sss3', '100_level', '200_level', '300_level', '400_level', '500_level', 'professional');
CREATE TYPE curriculum_type AS ENUM ('waec', 'neco', 'jamb', 'university', 'custom');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type organization_type NOT NULL DEFAULT 'school',
  admin_user_id UUID NOT NULL,
  logo_url TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization Exams table
CREATE TABLE public.organization_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  academic_level academic_level NOT NULL,
  curriculum_type curriculum_type NOT NULL DEFAULT 'custom',
  description TEXT,
  instructions TEXT,
  time_limit INTEGER NOT NULL DEFAULT 60,
  question_count INTEGER NOT NULL DEFAULT 20,
  difficulty test_difficulty NOT NULL DEFAULT 'intermediate',
  status org_exam_status NOT NULL DEFAULT 'draft',
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  access_code TEXT UNIQUE,
  allow_late_entry BOOLEAN DEFAULT false,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  show_results_immediately BOOLEAN DEFAULT true,
  max_violations INTEGER DEFAULT 5,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization Exam Questions table
CREATE TABLE public.organization_exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.organization_exams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization Exam Sessions (student attempts)
CREATE TABLE public.organization_exam_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.organization_exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_questions INTEGER,
  answers JSONB DEFAULT '[]'::jsonb,
  time_taken INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  status exam_session_status NOT NULL DEFAULT 'registered',
  violation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_email)
);

-- Anti-cheat logs
CREATE TABLE public.anti_cheat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.organization_exam_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_org_exams_organization ON public.organization_exams(organization_id);
CREATE INDEX idx_org_exams_status ON public.organization_exams(status);
CREATE INDEX idx_org_exams_access_code ON public.organization_exams(access_code);
CREATE INDEX idx_org_exam_questions_exam ON public.organization_exam_questions(exam_id);
CREATE INDEX idx_org_exam_sessions_exam ON public.organization_exam_sessions(exam_id);
CREATE INDEX idx_org_exam_sessions_email ON public.organization_exam_sessions(student_email);
CREATE INDEX idx_anti_cheat_session ON public.anti_cheat_logs(session_id);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_cheat_logs ENABLE ROW LEVEL SECURITY;

-- Organizations RLS policies
CREATE POLICY "Users can view their own organizations"
ON public.organizations FOR SELECT
USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Users can update their own organizations"
ON public.organizations FOR UPDATE
USING (auth.uid() = admin_user_id);

CREATE POLICY "Users can delete their own organizations"
ON public.organizations FOR DELETE
USING (auth.uid() = admin_user_id);

-- Organization Exams RLS policies
CREATE POLICY "Creators can manage their exams"
ON public.organization_exams FOR ALL
USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view active exams by access code"
ON public.organization_exams FOR SELECT
USING (status IN ('scheduled', 'active') AND access_code IS NOT NULL);

-- Organization Exam Questions RLS policies
CREATE POLICY "Exam creators can manage questions"
ON public.organization_exam_questions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.organization_exams 
  WHERE id = exam_id AND created_by = auth.uid()
));

CREATE POLICY "Anyone can view questions for accessible exams"
ON public.organization_exam_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.organization_exams 
  WHERE id = exam_id AND status IN ('scheduled', 'active')
));

-- Organization Exam Sessions RLS policies
CREATE POLICY "Exam creators can view all sessions for their exams"
ON public.organization_exam_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.organization_exams 
  WHERE id = exam_id AND created_by = auth.uid()
));

CREATE POLICY "Anyone can register for an exam session"
ON public.organization_exam_sessions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.organization_exams 
  WHERE id = exam_id AND status IN ('scheduled', 'active')
));

CREATE POLICY "Students can view and update their own sessions"
ON public.organization_exam_sessions FOR UPDATE
USING (true);

CREATE POLICY "Students can view their own session"
ON public.organization_exam_sessions FOR SELECT
USING (true);

-- Anti-cheat logs RLS policies
CREATE POLICY "Anyone can insert cheat logs for active sessions"
ON public.anti_cheat_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Exam creators can view cheat logs"
ON public.anti_cheat_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.organization_exam_sessions s
  JOIN public.organization_exams e ON s.exam_id = e.id
  WHERE s.id = session_id AND e.created_by = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_exams_updated_at
BEFORE UPDATE ON public.organization_exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique access code
CREATE OR REPLACE FUNCTION generate_exam_access_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.access_code IS NULL THEN
    NEW.access_code := upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_exam_access_code
BEFORE INSERT ON public.organization_exams
FOR EACH ROW
EXECUTE FUNCTION generate_exam_access_code();