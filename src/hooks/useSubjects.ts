
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export type Subject = {
  name: string;
  question_count: number;
};

// Demo subjects to use as fallback if network completely fails
const demoSubjects: Subject[] = [
  { name: 'Mathematics', question_count: 25 },
  { name: 'Physics', question_count: 15 },
  { name: 'Chemistry', question_count: 18 },
  { name: 'Biology', question_count: 20 },
  { name: 'English', question_count: 22 }
];

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        console.log('Fetching subjects from Supabase...');
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
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
            throw new Error(`Database error: ${questionsError.message}`);
          }
          
          if (!questions || questions.length === 0) {
            console.log('No questions found in the questions table');
            // Try one more fallback - checking user_test_questions
            
            const testQueryPromise = supabase.from('user_test_questions').select('subject');
            const testResult = await Promise.race([testQueryPromise, timeoutPromise]);
            const { data: testQuestions, error: testError } = testResult;
            
            if (testError || !testQuestions || testQuestions.length === 0) {
              console.log('No subjects found in any tables, using demo data');
              // If all database methods fail, return demo data
              toast({
                title: "Network issue detected",
                description: "Using cached subjects. Some features may be limited.",
                duration: 5000,
              });
              return demoSubjects;
            }
            
            // Process test questions if available
            const subjectCounts: Record<string, number> = {};
            testQuestions.forEach(q => {
              if (q.subject) {
                subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
              }
            });
            
            const formattedSubjects: Subject[] = Object.keys(subjectCounts)
              .filter(name => name)
              .map(name => ({
                name,
                question_count: subjectCounts[name]
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
            
            return formattedSubjects;
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
          
          return formattedSubjects;
        } catch (error: any) {
          console.error('Error in direct query:', error);
          throw error;
        }
      } catch (error: any) {
        console.error('Error in useSubjects query:', error);
        
        // Provide a more helpful error message if it's a network error
        if (error.message && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('Request timeout')
        )) {
          console.log('Network error detected, returning fallback data');
          toast({
            title: "Connection to database failed",
            description: "Using cached subjects. Please check your internet connection.",
            variant: "destructive",
            duration: 5000,
          });
          return demoSubjects;
        }
        
        throw error;
      }
    },
    retry: MAX_RETRIES,
    retryDelay: (attemptIndex) => Math.min(RETRY_DELAY * (attemptIndex + 1), 8000), // Exponential backoff
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
