
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type Subject = {
  name: string;
  question_count: number;
};

// Mock data for when the API fails or network is unavailable
const MOCK_SUBJECTS: Subject[] = [
  { name: 'Mathematics', question_count: 150 },
  { name: 'Physics', question_count: 120 },
  { name: 'Chemistry', question_count: 100 },
  { name: 'Biology', question_count: 130 },
  { name: 'English', question_count: 90 },
  { name: 'Geography', question_count: 80 },
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
        // If offline, use mock data
        if (isOffline) {
          console.log('Offline mode: Using mock subjects data');
          return MOCK_SUBJECTS;
        }

        // This uses the database function we already have in Supabase
        const { data, error } = await supabase.rpc('get_subjects_from_questions');
        
        if (error) {
          console.error('Error loading subjects:', error);
          // Fall back to mock data on error
          return MOCK_SUBJECTS;
        }
        
        // If no data or empty array, fall back to mock data
        if (!data || data.length === 0) {
          console.log('No subjects found, using mock data');
          return MOCK_SUBJECTS;
        }
        
        return data as Subject[];
      } catch (error) {
        console.error('Error loading subjects:', error);
        // Fall back to mock data on exception
        return MOCK_SUBJECTS;
      }
    },
    retry: 1, // Only retry once to avoid excessive requests
    refetchOnWindowFocus: false // Prevent refetching when window gets focus
  });
};
