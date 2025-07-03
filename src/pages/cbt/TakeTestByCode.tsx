import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TestTakerForm, { TestTakerInfo } from '@/components/cbt/TestTakerForm';
import TestStateManager from '@/components/cbt/test/TestStateManager';

const TakeTestByCode = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const [testId, setTestId] = useState<string | null>(null);
  const [testTakerInfo, setTestTakerInfo] = useState<TestTakerInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestTakerSubmit = async (data: TestTakerInfo) => {
    if (!shareCode) {
      toast.error("No share code provided in URL");
      return;
    }

    setLoading(true);
    
    try {
      // Verify share code and get test
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .select('id, title, share_code')
        .eq('share_code', shareCode)
        .single();

      if (testError || !testData) {
        toast.error("Invalid or expired share code");
        setLoading(false);
        return;
      }

      if (data.shareCode !== shareCode) {
        toast.error("Share code doesn't match the test");
        setLoading(false);
        return;
      }

      // Store test taker info and proceed to test
      setTestTakerInfo(data);
      setTestId(testData.id);
      
    } catch (error) {
      console.error('Error verifying share code:', error);
      toast.error("Failed to verify share code");
      setLoading(false);
    }
  };

  // If we have test ID and user info, render the test
  if (testId && testTakerInfo) {
    return <TestStateManager testId={testId} testTakerInfo={testTakerInfo} />;
  }

  // Otherwise show the form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <TestTakerForm 
        onSubmit={handleTestTakerSubmit}
        testTitle="Test"
        requireShareCode={true}
        shareCodeError={null}
        loading={loading}
      />
    </div>
  );
};

export default TakeTestByCode;
