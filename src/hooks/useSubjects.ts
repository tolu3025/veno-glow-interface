
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
        
        // If the function fails or returns no data, query user_test_questions directly
        const { data: testSubjects, error: testSubjectsError } = await supabase
          .from('user_test_questions')
          .select('subject')
          .not('subject', 'is', null);
          
        if (testSubjectsError) {
          console.error('Error fetching subjects from user_test_questions:', testSubjectsError);
          throw new Error(`Database error: ${testSubjectsError.message}`);
        }
        
        // Also query questions table
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('subject');
          
        if (questionsError) {
          console.error('Error fetching subjects from questions:', questionsError);
        }
        
        // Combine and count subjects from both tables
        const allSubjects = [
          ...(testSubjects || []).map(s => s.subject),
          ...(questions || []).map(q => q.subject)
        ].filter(Boolean);
        
        // Count questions by subject
        const subjectCounts: Record<string, number> = {};
        
        allSubjects.forEach(subject => {
          if (subject) {
            subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
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
