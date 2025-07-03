
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TestTakerForm, { TestTakerInfo } from '@/components/cbt/TestTakerForm';
import TestStateManager from '@/components/cbt/test/TestStateManager';

const TakeTestByCode = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const [testId, setTestId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState<string>('Test');
  const [testTakerInfo, setTestTakerInfo] = useState<TestTakerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(true); // Always show form initially

  // Pre-populate share code from URL when component mounts
  useEffect(() => {
    if (shareCode && !testTakerInfo) {
      // Pre-validate the share code exists
      validateShareCode();
    }
  }, [shareCode]);

  const validateShareCode = async () => {
    if (!shareCode) return;

    try {
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .select('id, title')
        .eq('share_code', shareCode)
        .single();

      if (testError || !testData) {
        setError("Invalid or expired share code");
        return;
      }

      setTestTitle(testData.title);
    } catch (error) {
      console.error('Error validating share code:', error);
      setError("Failed to validate share code");
    }
  };

  const handleTestTakerSubmit = async (data: TestTakerInfo) => {
    if (!shareCode) {
      toast.error("No share code provided in URL");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Verify share code and get test
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .select('id, title, share_code')
        .eq('share_code', shareCode)
        .single();

      if (testError || !testData) {
        console.error('Error fetching test:', testError);
        toast.error("Invalid or expired share code");
        setError("Test not found with this share code");
        setLoading(false);
        return;
      }

      if (data.shareCode !== shareCode) {
        toast.error("Share code doesn't match the test");
        setError("Share code mismatch");
        setLoading(false);
        return;
      }

      // Store test taker info and proceed to test
      setTestTakerInfo(data);
      setTestId(testData.id);
      setFormVisible(false);
      
    } catch (error) {
      console.error('Error verifying share code:', error);
      toast.error("Failed to verify share code");
      setError("Failed to load test");
      setLoading(false);
    }
  };

  // If we have test ID and user info, render the test
  if (testId && testTakerInfo && !formVisible) {
    return <TestStateManager testId={testId} testTakerInfo={testTakerInfo} />;
  }

  // If there's an error, show error message with retry option
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Test Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(false);
              setFormVisible(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Always show the form immediately with pre-filled share code
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <TestTakerForm 
        onSubmit={handleTestTakerSubmit}
        testTitle={testTitle}
        requireShareCode={true}
        shareCodeError={error}
        loading={loading}
        initialShareCode={shareCode} // Pass the share code from URL
      />
    </div>
  );
};

export default TakeTestByCode;
