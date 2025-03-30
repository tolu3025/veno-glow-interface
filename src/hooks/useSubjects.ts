
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export type Subject = {
  name: string;
  question_count: number;
};

// Mock subjects data for fallback when offline
const MOCK_SUBJECTS: Subject[] = [
  { name: 'Mathematics', question_count: 15 },
  { name: 'Biology', question_count: 12 },
  { name: 'Chemistry', question_count: 10 },
  { name: 'Physics', question_count: 8 },
  { name: 'Computer Science', question_count: 14 },
  { name: 'English', question_count: 7 }
];

// Query configuration
const FETCH_TIMEOUT = 12000; // 12 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds
const STALE_TIME = 5 * 60 * 1000; // 5 minutes

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
      // If we know we're offline or connection test failed, immediately use fallback
      if ((!isOnline || hasConnection === false) && connectionTested) {
        console.log('Using offline subjects data');
        return MOCK_SUBJECTS;
      }

      try {
        console.log('Fetching subjects from Supabase...');
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT);
        });
        
        // First try to get subjects via database function
        try {
          const rpcPromise = supabase.rpc('get_subjects_from_questions');
          const result = await Promise.race([rpcPromise, timeoutPromise]);
          
          const { data: subjectsData, error: funcError } = result;
          
          if (!funcError && subjectsData && subjectsData.length > 0) {
            console.log('Subjects fetched successfully via RPC:', subjectsData);
            return subjectsData as Subject[];
          }
        } catch (error) {
          console.log('RPC method failed:', error);
          // Continue to next method
        }
        
        console.log('RPC method failed or returned no data, querying questions table directly');
        
        // Try direct database query with timeout
        try {
          const queryPromise = supabase
            .from('questions')
            .select('subject');
            
          const result = await Promise.race([queryPromise, timeoutPromise]);
          const { data: questions, error: questionsError } = result;
          
          if (questionsError) {
            console.error('Error fetching subjects from questions table:', questionsError);
            // Try fallback if error is network related
            if (questionsError.message?.includes('Failed to fetch') || 
                questionsError.code === 'NETWORK_ERROR') {
              console.log('Network error detected, using offline data');
              return MOCK_SUBJECTS;
            }
            throw new Error(`Database error: ${questionsError.message}`);
          }
          
          if (!questions || questions.length === 0) {
            console.log('No questions found in the questions table');
            toast({
              title: "No subjects available",
              description: "No subjects could be loaded from the database.",
              variant: "destructive",
            });
            return MOCK_SUBJECTS; // Use fallback data
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
          console.error('Error in direct query:', error);
          
          // Try to get cached subjects from local storage
          const cachedSubjects = localStorage.getItem('cached_subjects');
          if (cachedSubjects) {
            console.log('Using cached subjects from local storage');
            return JSON.parse(cachedSubjects) as Subject[];
          }
          
          // Last resort fallback
          console.log('Using offline fallback subjects');
          return MOCK_SUBJECTS;
        }
      } catch (error: any) {
        console.error('Error in useSubjects query:', error);
        
        // Try to get cached subjects from local storage
        const cachedSubjects = localStorage.getItem('cached_subjects');
        if (cachedSubjects) {
          console.log('Using cached subjects from local storage');
          return JSON.parse(cachedSubjects) as Subject[];
        }
        
        toast({
          title: "Failed to load subjects",
          description: "Using offline data instead. Check your connection and try again.",
          variant: "warning",
          duration: 5000,
        });
        
        return MOCK_SUBJECTS;
      }
    },
    retry: MAX_RETRIES,
    retryDelay: (attemptIndex) => Math.min(RETRY_DELAY * (attemptIndex + 1), 8000), // Exponential backoff
    refetchOnWindowFocus: false,
    staleTime: STALE_TIME, // Cache for 5 minutes
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
