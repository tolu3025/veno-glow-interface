
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type Subject = {
  name: string;
  question_count: number;
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        console.log('Fetching subjects from Supabase...');
        
        // First try to get subjects via database function
        const { data: subjectsData, error: funcError } = await supabase
          .rpc('get_subjects_from_questions');
          
        if (!funcError && subjectsData && subjectsData.length > 0) {
          console.log('Subjects fetched successfully via RPC:', subjectsData);
          return subjectsData as Subject[];
        }
        
        console.log('RPC method failed or returned no data, querying questions table directly');
        
        // If the function fails or returns no data, query questions table directly
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('subject');
          
        if (questionsError) {
          console.error('Error fetching subjects from questions table:', questionsError);
          throw new Error(`Database error: ${questionsError.message}`);
        }
        
        if (!questions || questions.length === 0) {
          console.log('No questions found in the questions table');
          return [];
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
        console.error('Error in useSubjects query:', error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
