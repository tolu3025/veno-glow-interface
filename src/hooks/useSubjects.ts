
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  name: string;
  question_count: number;
}

const fetchSubjects = async (): Promise<Subject[]> => {
  try {
    // Fetch subjects from both questions table and user_tests table
    const [questionsResponse, userTestsResponse] = await Promise.all([
      supabase.rpc('get_subjects_from_questions'),
      supabase
        .from('user_tests')
        .select('subject')
        .not('subject', 'is', null)
    ]);

    if (questionsResponse.error) {
      console.error('Error fetching subjects from questions:', questionsResponse.error);
    }

    if (userTestsResponse.error) {
      console.error('Error fetching subjects from user_tests:', userTestsResponse.error);
    }

    const subjects = new Map<string, number>();

    // Add subjects from questions table
    if (questionsResponse.data) {
      questionsResponse.data.forEach((item: any) => {
        if (item.name) {
          subjects.set(item.name, (subjects.get(item.name) || 0) + Number(item.question_count));
        }
      });
    }

    // Add subjects from user_tests table
    if (userTestsResponse.data) {
      const userTestSubjects = userTestsResponse.data.reduce((acc: Record<string, number>, test: any) => {
        if (test.subject) {
          acc[test.subject] = (acc[test.subject] || 0) + 1;
        }
        return acc;
      }, {});

      Object.entries(userTestSubjects).forEach(([subject, count]) => {
        subjects.set(subject, (subjects.get(subject) || 0) + Number(count));
      });
    }

    // Convert map to array and sort
    return Array.from(subjects.entries())
      .map(([name, question_count]) => ({ name, question_count }))
      .sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error('Error in fetchSubjects:', error);
    // Return fallback subjects if there's an error
    return [
      { name: 'Mathematics', question_count: 50 },
      { name: 'Physics', question_count: 40 },
      { name: 'Chemistry', question_count: 35 },
      { name: 'Biology', question_count: 45 },
      { name: 'Computer Science', question_count: 30 },
    ];
  }
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
