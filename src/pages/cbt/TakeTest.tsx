import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

// Components
import TestTakerForm, { TestTakerInfo } from '@/components/cbt/TestTakerForm';
import LoadingState from '@/components/cbt/test/LoadingState';
import NoQuestionsState from '@/components/cbt/test/NoQuestionsState';
import AttemptBlockedState from '@/components/cbt/test/AttemptBlockedState';
import SubmissionComplete from '@/components/cbt/test/SubmissionComplete';
import TestInstructions from '@/components/cbt/test/TestInstructions';
import QuestionDisplay from '@/components/cbt/test/QuestionDisplay';
import TestResults from '@/components/cbt/test/TestResults';
import AnswersReview from '@/components/cbt/test/AnswersReview';

// Hooks
import { useTestManagement } from '@/hooks/useTestManagement';

type QuizQuestion = {
  id: string;
  text?: string;
  question?: string;
  options: string[];
  correctOption?: number;
  answer?: number;
  explanation?: string;
};

type TestDetails = {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  time_limit: number | null;
  results_visibility: 'creator_only' | 'test_takers' | 'public';
  allow_retakes: boolean;
  share_code?: string;
};

const TakeTest = () => {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [showTakerForm, setShowTakerForm] = useState(false);
  const [testTakerInfo, setTestTakerInfo] = useState<TestTakerInfo | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<number>(0);
  const [shareCodeRequired, setShareCodeRequired] = useState(false);
  const [shareCodeError, setShareCodeError] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    difficulty: 'beginner',
    timeLimit: 15,
    questionsCount: 10
  });

  const testManagement = useTestManagement({
    testId,
    user,
    questions,
    testDetails,
    testTakerInfo
  });

  useEffect(() => {
    if (location.state?.settings) {
      setSettings(location.state.settings);
    }
  }, [location.state]);

  useEffect(() => {
    const loadTest = async () => {
      setLoading(true);

      if (testId === 'subject' && location.state?.subject) {
        loadSubjectQuiz();
        return;
      }
      
      try {
        if (testId) {
          // Log the process to help debugging
          console.log(`Loading test with ID: ${testId}`);
          
          const { data: testData, error: testError } = await supabase
            .from('user_tests')
            .select('*')
            .eq('id', testId)
            .single();
            
          if (testError) {
            console.error("Error fetching test data:", testError);
            throw testError;
          }
          
          if (!testData) {
            toast.error("Test not found");
            navigate('/cbt');
            return;
          }
          
          console.log("Test details loaded:", testData);
          setTestDetails(testData as TestDetails);
          
          // Check if this test requires a share code
          setShareCodeRequired(!!testData.share_code && !user);
          
          if (user && testData.allow_retakes === false) {
            const { data: attempts, error: attemptsError } = await supabase
              .from('test_attempts')
              .select('*', { count: 'exact' })
              .eq('test_id', testId)
              .eq('user_id', user.id);
              
            if (!attemptsError && attempts && attempts.length > 0) {
              setPreviousAttempts(attempts.length);
            }
          }
          
          const { data: questionsData, error: questionsError } = await supabase
            .from('user_test_questions')
            .select('*')
            .eq('test_id', testId);
            
          if (questionsError) {
            console.error("Error fetching questions:", questionsError);
            throw questionsError;
          }
          
          if (questionsData && questionsData.length > 0) {
            console.log("Raw questions data:", questionsData);
            
            const formattedQuestions: QuizQuestion[] = questionsData.map(q => ({
              id: q.id,
              text: q.question_text,
              question: q.question_text, // Adding both text and question properties
              options: Array.isArray(q.options) ? q.options.map(opt => String(opt)) : [],
              correctOption: q.answer,
              answer: q.answer,
              explanation: q.explanation
            }));
            
            console.log("Formatted questions:", formattedQuestions);
            setQuestions(formattedQuestions);
          } else {
            console.warn("No questions found for test ID:", testId);
            toast.error("No questions available for this test");
          }
        }
      } catch (error) {
        console.error("Error loading test:", error);
        toast.error("Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user, navigate, location.state]);

  const loadSubjectQuiz = async () => {
    try {
      const subject = location.state.subject;
      const settingsFromState = location.state.settings || settings;
      
      // Set basic test details for subject quizzes
      const subjectTestDetails = {
        id: 'subject',
        title: `${subject} Quiz`,
        description: `Test your knowledge of ${subject}`,
        creator_id: 'system',
        time_limit: settingsFromState.timeLimit || 15,
        results_visibility: 'public',
        allow_retakes: true,
        subject: subject
      };
      
      setTestDetails(subjectTestDetails as TestDetails);
      
      const difficultyFilter = settingsFromState.difficulty === 'all' 
        ? ['beginner', 'intermediate', 'advanced'] 
        : [settingsFromState.difficulty];
      
      console.log(`Fetching questions for subject: ${subject} with difficulty: ${difficultyFilter.join(', ')}`);
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', subject)
        .in('difficulty', difficultyFilter)
        .limit(settingsFromState.questionsCount);
        
      if (error) {
        console.error("Error fetching questions:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`No questions found for subject: ${subject}`);
        toast.error(`No questions available for ${subject}`, {
          description: "Please try another subject or difficulty level"
        });
        navigate('/cbt');
        return;
      }
      
      console.log(`Found ${data.length} questions for ${subject}`);
      console.log("Raw subject questions:", data);
      
      const formattedQuestions: QuizQuestion[] = data.map(q => ({
        id: q.id,
        text: q.question,
        question: q.question, // Adding both text and question properties
        options: Array.isArray(q.options) ? 
          q.options.map((opt: any) => String(opt)) : [],
        correctOption: q.answer,
        answer: q.answer,
        explanation: q.explanation
      }));
      
      console.log("Subject quiz formatted questions:", formattedQuestions);
      setQuestions(formattedQuestions);
    } catch (error) {
      console.error("Error loading subject questions:", error);
      toast.error("Failed to load questions");
      navigate('/cbt');
    } finally {
      setLoading(false);
    }
  };

  const handleTestTakerSubmit = async (data: TestTakerInfo) => {
    // Verify share code if required
    if (shareCodeRequired && testDetails?.share_code) {
      if (!data.shareCode) {
        setShareCodeError("Share code is required");
        return;
      }
      
      if (data.shareCode !== testDetails.share_code) {
        setShareCodeError("Invalid share code for this test");
        return;
      }
    }
    
    setTestTakerInfo(data);
    setShowTakerForm(false);
    testManagement.startTest();
  };

  // Add extensive logging to help debug
  useEffect(() => {
    console.log("Current test state:", {
      testId,
      questionsLoaded: questions.length,
      testStarted: testManagement.testStarted,
      showResults: testManagement.showResults,
      reviewMode: testManagement.reviewMode,
      submissionComplete: testManagement.submissionComplete,
      resultsVisibility: testDetails?.results_visibility,
      score: testManagement.score,
      currentQuestion: testManagement.currentQuestion,
      selectedAnswer: testManagement.selectedAnswer,
      savingStatus: testManagement.saving ? 'in-progress' : testManagement.savingError ? 'error' : 'complete'
    });
  }, [
    testId, 
    questions, 
    testManagement.testStarted, 
    testManagement.showResults, 
    testManagement.reviewMode,
    testDetails,
    testManagement.score,
    testManagement.currentQuestion,
    testManagement.selectedAnswer,
    testManagement.saving,
    testManagement.savingError
  ]);

  if (loading) {
    return <LoadingState />;
  }

  if (questions.length === 0) {
    return <NoQuestionsState />;
  }

  if (testManagement.submissionComplete) {
    return (
      <SubmissionComplete 
        testDetails={testDetails} 
        testTakerInfo={testTakerInfo} 
      />
    );
  }

  if (!testManagement.testStarted) {
    if (user && previousAttempts > 0 && testDetails && !testDetails.allow_retakes) {
      return <AttemptBlockedState testDetails={testDetails} />;
    }

    if (showTakerForm) {
      return (
        <TestTakerForm 
          onSubmit={handleTestTakerSubmit} 
          testTitle={testDetails?.title || undefined}
          requireShareCode={shareCodeRequired}
          shareCodeError={shareCodeError}
        />
      );
    }

    return (
      <TestInstructions
        testDetails={testDetails}
        questions={questions}
        location={location}
        previousAttempts={previousAttempts}
        onStartTest={testManagement.startTest}
        onShowTakerForm={() => setShowTakerForm(true)}
        user={user}
        testId={testId || ''}
      />
    );
  }

  if (testManagement.showResults) {
    const isCreator = user?.id === testDetails?.creator_id;
    const canViewResults = 
      isCreator || 
      testDetails?.results_visibility === 'test_takers' || 
      testDetails?.results_visibility === 'public';
    
    if (!canViewResults) {
      return (
        <SubmissionComplete 
          testDetails={testDetails} 
          testTakerInfo={testTakerInfo} 
        />
      );
    }

    if (testManagement.reviewMode) {
      return (
        <AnswersReview
          questions={questions}
          userAnswers={testManagement.userAnswers}
          score={testManagement.score}
          timeRemaining={testManagement.timeRemaining}
          testDetails={testDetails}
          location={location}
          onBackToSummary={() => testManagement.setReviewMode(false)}
          onFinish={() => navigate('/cbt')}
          formatTime={testManagement.formatTime}
        />
      );
    }
    
    return (
      <TestResults
        score={testManagement.score}
        questions={questions}
        testDetails={testDetails}
        timeRemaining={testManagement.timeRemaining}
        location={location}
        testId={testId || ''}
        publicResults={testManagement.publicResults}
        testTakerInfo={testTakerInfo}
        user={user}
        onReviewAnswers={() => testManagement.setReviewMode(true)}
        onFinish={() => navigate('/cbt')}
        onTryAgain={testManagement.resetTest}
        formatTime={testManagement.formatTime}
        savingError={testManagement.savingError}
      />
    );
  }

  const currentQuestionData = questions[testManagement.currentQuestion];

  if (!currentQuestionData) {
    return <NoQuestionsState />;
  }

  return (
    <QuestionDisplay
      currentQuestion={testManagement.currentQuestion}
      questions={questions}
      timeRemaining={testManagement.timeRemaining}
      selectedAnswer={testManagement.selectedAnswer}
      onAnswerSelect={testManagement.handleAnswerSelect}
      onPreviousQuestion={testManagement.goToPreviousQuestion}
      onNextQuestion={testManagement.goToNextQuestion}
      formatTime={testManagement.formatTime}
    />
  );
};

export default TakeTest;
