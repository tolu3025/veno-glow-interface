-- Enable REPLICA IDENTITY FULL on streak_challenges table
-- This ensures real-time UPDATE events include all columns including JSONB fields like questions
ALTER TABLE streak_challenges REPLICA IDENTITY FULL;