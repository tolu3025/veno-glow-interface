
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import TestStateManager from '@/components/cbt/test/TestStateManager';
import LoadingState from '@/components/cbt/test/LoadingState';

const TakeTestByCode = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If no user, redirect to login with the current path as return URL
    if (!user) {
      navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // If we have a user and share code, validate it
    if (shareCode) {
      validateShareCode();
    } else {
      setError("No share code provided in URL");
      setLoading(false);
    }
  }, [user, authLoading, shareCode, navigate]);

  const validateShareCode = async () => {
    if (!shareCode) return;

    try {
      setLoading(true);
      const { data: testData, error: testError } = await supabase
        .from('user_tests')
        .select('id, title')
        .eq('share_code', shareCode)
        .single();

      if (testError || !testData) {
        console.error('Error fetching test:', testError);
        setError("Invalid or expired share code");
        return;
      }

      setTestId(testData.id);
    } catch (error) {
      console.error('Error validating share code:', error);
      setError("Failed to validate share code");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is loading
  if (authLoading || loading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Test Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => {
                setError(null);
                validateShareCode();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/cbt')}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the test if we have a valid test ID
  if (testId) {
    return <TestStateManager testId={testId} />;
  }

  return <LoadingState />;
};

export default TakeTestByCode;
