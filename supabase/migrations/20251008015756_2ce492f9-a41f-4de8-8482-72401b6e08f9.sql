-- Create table for AI tutor chat history
CREATE TABLE IF NOT EXISTS public.ai_tutor_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_tutor_chats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chats
CREATE POLICY "Users can view their own AI tutor chats"
ON public.ai_tutor_chats
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own chats
CREATE POLICY "Users can create their own AI tutor chats"
ON public.ai_tutor_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own chats
CREATE POLICY "Users can update their own AI tutor chats"
ON public.ai_tutor_chats
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own chats
CREATE POLICY "Users can delete their own AI tutor chats"
ON public.ai_tutor_chats
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_ai_tutor_chats_user_id ON public.ai_tutor_chats(user_id);
CREATE INDEX idx_ai_tutor_chats_created_at ON public.ai_tutor_chats(created_at DESC);