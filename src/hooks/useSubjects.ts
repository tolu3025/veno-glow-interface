
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type Subject = {
  name: string;
  question_count: number;
};

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
        // If offline, we cannot fetch subjects
        if (isOffline) {
          throw new Error('You are offline');
        }

        // Use the database function to get subjects from the questions table
        const { data, error } = await supabase.rpc('get_subjects_from_questions');
        
        if (error) {
          throw new Error(`Error loading subjects: ${error.message}`);
        }
        
        // If no data or empty array, throw error
        if (!data || data.length === 0) {
          throw new Error('No subjects found');
        }
        
        console.log('Loaded subjects from database:', data);
        return data as Subject[];
      } catch (error) {
        console.error('Error loading subjects:', error);
        throw error;
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
