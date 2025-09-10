
import { supabase, testSupabaseConnection, isOnline, retryOperation } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export type Subject = {
  name: string;
  question_count: number;
  source: 'admin' | 'ai-generated' | 'combined';
};

// Define a type-safe version of querySafe with proper TypeScript definitions
async function querySafe<T>(
  queryFn: () => Promise<PostgrestSingleResponse<T>>, 
  fallbackData: T | null = null
): Promise<{ data: T | null; error: any; offline: boolean }> {
  if (!isOnline()) {
    return { data: fallbackData, error: new Error('Device is offline'), offline: true };
  }
  
  try {
    // Using await to properly handle the promise chain
    const result = await retryOperation(async () => {
      const response = await queryFn();
      return response;
    });
    
    return { data: result.data, error: result.error, offline: false };
  } catch (error) {
    return { data: fallbackData, error, offline: !isOnline() };
  }
}

export const useSubjects = () => {
  const [connectionTested, setConnectionTested] = useState<boolean>(false);
  const [hasConnection, setHasConnection] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const [realtimeData, setRealtimeData] = useState<Subject[] | null>(null);
  const MAX_RETRIES = 3;

  // Update online status using the isOnline function from the client
  const online = isOnline();

  // Connection testing function with retry capability
  const checkConnection = useCallback(async () => {
    if (retryCount >= MAX_RETRIES && !online) {
      console.log("Max retries exceeded and still offline, not checking connection again");
      setHasConnection(false);
      setConnectionTested(true);
      return false;
    }
    
    try {
      setConnectionTested(false);
      const result = await testSupabaseConnection();
      setHasConnection(result.success);
      
      if (!result.success && online && retryCount < MAX_RETRIES) {
        // If online but connection failed, schedule another attempt
        console.log(`Connection test failed, scheduling retry ${retryCount + 1}/${MAX_RETRIES}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return false;
      } else if (result.success) {
        // Reset retry count on success
        setRetryCount(0);
        return true;
      }
      return result.success;
    } catch (error) {
      console.error("Error testing connection:", error);
      setHasConnection(false);
      return false;
    } finally {
      setConnectionTested(true);
    }
  }, [retryCount, online]);

  // Check connection on mount and when online status changes
  useEffect(() => {
    checkConnection();
    
    // Setup listeners to check connection when online status changes
    const handleOnline = () => {
      setRetryCount(0); // Reset retry count when coming online
      checkConnection();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkConnection]);

  // Set up real-time subscription for both questions and user_tests tables
  useEffect(() => {
    const questionsChannel = supabase
      .channel('subjects-realtime-questions')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'questions'
        },
        (payload) => {
          console.log('Real-time update received for questions:', payload);
          // Trigger a refetch when questions change
          window.dispatchEvent(new CustomEvent('subjects-updated'));
        }
      )
      .subscribe();

    const userTestsChannel = supabase
      .channel('subjects-realtime-user-tests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tests'
        },
        (payload) => {
          console.log('Real-time update received for user_tests:', payload);
          window.dispatchEvent(new CustomEvent('subjects-updated'));
        }
      )
      .subscribe();

    const userTestQuestionsChannel = supabase
      .channel('subjects-realtime-user-test-questions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_test_questions'
        },
        (payload) => {
          console.log('Real-time update received for user_test_questions:', payload);
          window.dispatchEvent(new CustomEvent('subjects-updated'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(questionsChannel);
      supabase.removeChannel(userTestsChannel);
      supabase.removeChannel(userTestQuestionsChannel);
    };
  }, []);

  const query = useQuery({
    queryKey: ['subjects', online, hasConnection, retryCount],
    queryFn: async () => {
      // Track when we successfully fetch data
      const trackSuccess = () => {
        setLastSuccessfulFetch(new Date());
      };
      
      // If we know we're offline or connection test failed, immediately try to use cached data
      if ((!online || hasConnection === false) && connectionTested) {
        console.log("Offline or database unreachable, trying cached data");
        const cachedSubjects = localStorage.getItem('cached_subjects');
        if (cachedSubjects) {
          console.log('Using cached subjects from local storage');
          return JSON.parse(cachedSubjects) as Subject[];
        }
        throw new Error('No connection to database and no cached data available');
      }

      // Set up a query timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error('Query timed out after 10 seconds'));
        }, 10000);
      });
      
      try {
        console.log('Fetching subjects from both admin questions and AI-generated tests...');
        
        // Query the questions table (main question bank) and test_questions (user created questions)
        const [questionsResult, testQuestionsResult] = await Promise.race([
          Promise.all([
            querySafe<{ subject: string }[]>(async () => {
              return await supabase
                .from('questions')
                .select('subject');
            }),
            querySafe<{ subject: string }[]>(async () => {
              return await supabase
                .from('test_questions')
                .select('subject')
                .not('subject', 'is', null);
            })
          ]),
          timeoutPromise
        ]);
        
        // Process main questions (question bank)
        const questionBankCounts: Record<string, number> = {};
        if (questionsResult.data) {
          questionsResult.data.forEach((q: { subject: string }) => {
            if (q.subject && q.subject.trim()) {
              const subject = q.subject.trim();
              questionBankCounts[subject] = (questionBankCounts[subject] || 0) + 1;
            }
          });
        }
        
        // Process user created test questions
        const testQuestionCounts: Record<string, number> = {};
        if (testQuestionsResult.data) {
          testQuestionsResult.data.forEach((q: { subject: string }) => {
            if (q.subject && q.subject.trim()) {
              const subject = q.subject.trim();
              testQuestionCounts[subject] = (testQuestionCounts[subject] || 0) + 1;
            }
          });
        }
        
        // Combine both sources
        const allSubjects = new Set([
          ...Object.keys(questionBankCounts),
          ...Object.keys(testQuestionCounts)
        ]);
        
        const formattedSubjects: Subject[] = Array.from(allSubjects)
          .filter(name => name && name.trim()) // Filter out any undefined/null/empty subjects
          .map(name => {
            const questionBankCount = questionBankCounts[name] || 0;
            const testQuestionCount = testQuestionCounts[name] || 0;
            const totalCount = questionBankCount + testQuestionCount;
            
            let source: 'admin' | 'ai-generated' | 'combined' = 'admin';
            if (questionBankCount > 0 && testQuestionCount > 0) {
              source = 'combined';
            } else if (testQuestionCount > 0) {
              source = 'ai-generated';
            }
            
            return {
              name,
              question_count: totalCount,
              source
            };
          })
          .filter(subject => subject.question_count > 0) // Only include subjects with questions
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Formatted subjects from question bank and test questions:', formattedSubjects);
        
        // Cache the results locally for offline use
        localStorage.setItem('cached_subjects', JSON.stringify(formattedSubjects));
        trackSuccess();
        return formattedSubjects;
        
      } catch (error: any) {
        console.error('Error in useSubjects query:', error);
        
        // Try to get cached subjects from local storage
        const cachedSubjects = localStorage.getItem('cached_subjects');
        if (cachedSubjects) {
          console.log('Using cached subjects from local storage after error');
          return JSON.parse(cachedSubjects) as Subject[];
        }
        
        toast({
          title: "Database connection issue",
          description: isOnline() ? "Could not connect to database. Using offline mode." : "You're offline. Using locally stored data.",
          variant: "warning",
          duration: 5000,
        });
        
        // Return empty array when all else fails
        return [];
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000), // Exponential backoff
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
    meta: {
      // These functions can be used by components to manage connection
      retry: checkConnection,
      isOnline: () => online,
      lastFetch: lastSuccessfulFetch,
      connectionStatus: hasConnection === null ? 'unknown' : hasConnection ? 'connected' : 'disconnected',
    }
  });

  // Listen for real-time updates and refetch
  useEffect(() => {
    const handleSubjectsUpdate = () => {
      console.log('Subjects updated, refetching...');
      query.refetch();
    };

    window.addEventListener('subjects-updated', handleSubjectsUpdate);
    return () => window.removeEventListener('subjects-updated', handleSubjectsUpdate);
  }, [query.refetch]);

  return query;
};
