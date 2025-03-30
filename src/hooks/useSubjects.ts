
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export type Subject = {
  name: string;
  question_count: number;
};

// Provide some default subjects as fallback
const DEFAULT_SUBJECTS: Subject[] = [
  { name: 'Mathematics', question_count: 20 },
  { name: 'Science', question_count: 15 },
  { name: 'History', question_count: 10 },
  { name: 'English', question_count: 12 },
  { name: 'Computer Science', question_count: 18 },
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
      if (isOffline) {
        console.log('User is offline, returning default subjects');
        return DEFAULT_SUBJECTS;
      }

      try {
        console.log('Fetching subjects from Supabase...');
        
        // Simplified approach: directly query for subjects from user_test_questions
        const { data: testSubjects, error: testSubjectsError } = await supabase
          .from('user_test_questions')
          .select('subject')
          .not('subject', 'is', null)
          .order('subject')
          .limit(100);
          
        if (testSubjectsError) {
          console.error('Error fetching subjects from user_test_questions:', testSubjectsError);
          throw new Error(`Database error: ${testSubjectsError.message}`);
        }
        
        // Count questions by subject
        const subjectCounts: Record<string, number> = {};
        
        if (testSubjects && testSubjects.length > 0) {
          console.log('Raw subjects data:', testSubjects);
          
          testSubjects.forEach(item => {
            if (item.subject) {
              subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
            }
          });
          
          // Format the data
          const formattedSubjects: Subject[] = Object.keys(subjectCounts).map(name => ({
            name,
            question_count: subjectCounts[name]
          }));
          
          console.log('Formatted subjects:', formattedSubjects);
          
          if (formattedSubjects.length > 0) {
            return formattedSubjects;
          }
        }
        
        console.log('No subjects found in database, falling back to defaults');
        return DEFAULT_SUBJECTS;
        
      } catch (error: any) {
        console.error('Error in useSubjects query:', error);
        console.log('Falling back to default subjects due to error');
        // Return default subjects as a fallback
        return DEFAULT_SUBJECTS;
      }
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
