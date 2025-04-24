
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TutorialDetails from '@/components/tutorials/TutorialDetails';
import AdPlacement from '@/components/ads/AdPlacement';

const TutorialInfo = () => {
  const [tutorial, setTutorial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tutorialId = searchParams.get('id');

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!tutorialId) return;

      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', tutorialId)
        .single();

      if (error) {
        console.error('Error fetching tutorial:', error);
        return;
      }

      setTutorial(data);
      setIsLoading(false);
    };

    fetchTutorial();
  }, [tutorialId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Loading tutorial...</p>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Tutorial not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="space-y-6">
        <TutorialDetails tutorial={tutorial} />
        <AdPlacement location="content" />
      </div>
    </div>
  );
};

export default TutorialInfo;
