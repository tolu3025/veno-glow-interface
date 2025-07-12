-- Enable realtime for questions table to reflect admin changes immediately
ALTER TABLE public.questions REPLICA IDENTITY FULL;

-- Add questions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;

-- Also enable realtime for user_tests table for AI-generated test updates
ALTER TABLE public.user_tests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tests;