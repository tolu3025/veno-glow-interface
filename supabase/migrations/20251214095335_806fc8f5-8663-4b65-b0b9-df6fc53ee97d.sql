-- Create voice chat sessions table for transcript storage
CREATE TABLE public.voice_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  topic TEXT,
  transcript JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own voice sessions" 
ON public.voice_chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create their own voice sessions" 
ON public.voice_chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own voice sessions" 
ON public.voice_chat_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own voice sessions" 
ON public.voice_chat_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_voice_chat_sessions_updated_at
BEFORE UPDATE ON public.voice_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();