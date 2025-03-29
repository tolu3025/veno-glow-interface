
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type Subject = {
  name: string;
  question_count: number;
};

// Fallback subjects in case the database is unavailable
const FALLBACK_SUBJECTS: Subject[] = [
  { name: 'Mathematics', question_count: 50 },
  { name: 'English Language', question_count: 40 },
  { name: 'Physics', question_count: 35 },
  { name: 'Chemistry', question_count: 30 },
  { name: 'Biology', question_count: 45 }
];

export const useSubjects = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        // If offline, return fallback subjects
        if (isOffline) {
          console.log('Using fallback subjects due to offline status');
          return FALLBACK_SUBJECTS;
        }

        // Use the database function to get subjects from the questions table
        const { data, error } = await supabase.rpc('get_subjects_from_questions');
        
        if (error) {
          console.error('Error from Supabase RPC:', error);
          throw new Error(`Error loading subjects: ${error.message}`);
        }
        
        // If no data or empty array, use fallback subjects
        if (!data || data.length === 0) {
          console.log('No subjects found in database, using fallback data');
          return FALLBACK_SUBJECTS;
        }
        
        console.log('Loaded subjects from database:', data);
        return data as Subject[];
      } catch (error) {
        console.error('Error in useSubjects query:', error);
        
        // Return fallback subjects on any error
        console.log('Using fallback subjects due to error');
        return FALLBACK_SUBJECTS;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
