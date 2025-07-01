
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import TestStateManager from '@/components/cbt/test/TestStateManager';

const TakeTest = () => {
  const { testId } = useParams();
  const location = useLocation();
  const [settings, setSettings] = useState({
    difficulty: 'beginner',
    timeLimit: 15,
    questionsCount: 10
  });

  useEffect(() => {
    if (location.state?.settings) {
      setSettings(location.state.settings);
    }
  }, [location.state]);

  useEffect(() => {
    console.log("Current test state:", {
      testId,
      settings,
      locationState: location.state
    });
  }, [testId, settings, location.state]);

  if (!testId) {
    return <div>Test ID not found</div>;
  }

  return <TestStateManager testId={testId} />;
};

export default TakeTest;
