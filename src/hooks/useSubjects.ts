
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

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
      if (isOffline) {
        toast({
          title: "You're offline",
          description: "Please check your internet connection to see available subjects.",
          variant: "warning",
        });
        throw new Error('You are offline');
      }

      try {
        // First, check if the questions table exists in the database
        const { data: tableExists, error: tableCheckError } = await supabase
          .rpc('check_if_table_exists', { table_name: 'questions' });
        
        if (tableCheckError) {
          console.error('Error checking if questions table exists:', tableCheckError);
          throw new Error(`Database error: ${tableCheckError.message}`);
        }
        
        if (!tableExists) {
          console.error('Questions table does not exist in database');
          throw new Error('Questions table not found in database');
        }

        // If the table exists, use the get_subjects_from_questions function 
        const { data, error } = await supabase.rpc('get_subjects_from_questions');
        
        if (error) {
          console.error('Error from Supabase RPC:', error);
          toast({
            title: "Failed to load subjects",
            description: "There was an error loading subjects from the database.",
            variant: "destructive",
          });
          throw new Error(`Error loading subjects: ${error.message}`);
        }
        
        // If no data or empty array, show error
        if (!data || data.length === 0) {
          console.log('No subjects found in database');
          throw new Error('No subjects found in database');
        }
        
        console.log('Loaded subjects from database:', data);
        return data as Subject[];
      } catch (error: any) {
        console.error('Error in useSubjects query:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
