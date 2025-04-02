
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export type Subject = {
  name: string;
  question_count: number;
};

export const useSubjects = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [connectionTested, setConnectionTested] = useState<boolean>(false);
  const [hasConnection, setHasConnection] = useState<boolean | null>(null);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Test actual Supabase connection on mount
    const checkConnection = async () => {
      const result = await testSupabaseConnection();
      setHasConnection(result.success);
      setConnectionTested(true);
    };
    
    checkConnection();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      // If we know we're offline or connection test failed, immediately throw error
      if ((!isOnline || hasConnection === false) && connectionTested) {
        throw new Error('No connection to database');
      }

      try {
        console.log('Fetching subjects from Supabase...');
        
        // First try to get subjects via database function
        try {
          const { data: subjectsData, error: funcError } = await supabase.rpc('get_subjects_from_questions');
          
          if (!funcError && subjectsData && subjectsData.length > 0) {
            console.log('Subjects fetched successfully via RPC:', subjectsData);
            
            // Cache the results locally for offline use
            localStorage.setItem('cached_subjects', JSON.stringify(subjectsData));
            return subjectsData as Subject[];
          }
        } catch (error) {
          console.log('RPC method failed:', error);
          // Continue to next method
        }
        
        console.log('RPC method failed or returned no data, querying questions table directly');
        
        // Try direct database query
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('subject');
          
        if (questionsError) {
          console.error('Error fetching subjects from questions table:', questionsError);
          throw questionsError;
        }
        
        if (!questions || questions.length === 0) {
          console.log('No questions found in the questions table');
          throw new Error('No questions available');
        }
        
        console.log('Questions fetched successfully:', questions.length);
        
        // Count questions by subject
        const subjectCounts: Record<string, number> = {};
        
        questions.forEach(q => {
          if (q.subject) {
            subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
          }
        });
        
        // Format the data
        const formattedSubjects: Subject[] = Object.keys(subjectCounts)
          .filter(name => name) // Filter out any undefined/null/empty subjects
          .map(name => ({
            name,
            question_count: subjectCounts[name]
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Formatted subjects:', formattedSubjects);
        
        // Cache the results locally for offline use
        localStorage.setItem('cached_subjects', JSON.stringify(formattedSubjects));
        return formattedSubjects;
        
      } catch (error: any) {
        console.error('Error in useSubjects query:', error);
        
        // Try to get cached subjects from local storage
        const cachedSubjects = localStorage.getItem('cached_subjects');
        if (cachedSubjects) {
          console.log('Using cached subjects from local storage');
          return JSON.parse(cachedSubjects) as Subject[];
        }
        
        toast({
          title: "No subjects available",
          description: "Check your connection or try again later.",
          variant: "default",
          duration: 5000,
        });
        
        // Return empty array when all else fails
        return [];
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 8000),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    // Provide initial data from local storage if available
    initialData: () => {
      const cachedSubjects = localStorage.getItem('cached_subjects');
      if (cachedSubjects) {
        console.log('Using initial data from local storage');
        return JSON.parse(cachedSubjects) as Subject[];
      }
      return undefined;
    },
  });
};
