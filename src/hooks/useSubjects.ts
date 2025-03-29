
import { useState, useEffect } from 'react';
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
        // This uses the database function we already have in Supabase
        const { data, error } = await supabase.rpc('get_subjects_from_questions');
        
        if (error) {
          throw error;
        }
        
        return data as Subject[];
      } catch (error) {
        console.error('Error loading subjects:', error);
        return [];
      }
    }
  });
};
