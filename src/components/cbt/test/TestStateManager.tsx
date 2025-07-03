import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useUserTest } from '@/hooks/useUserTest';
import { useSubjectQuiz } from '@/hooks/useSubjectQuiz';

interface TestStateManagerProps {
  testId: string;
  testTakerInfo?: TestTakerInfo;
}

const TestStateManager: React.FC<TestStateManagerProps> = ({ testId, testTakerInfo: providedTestTakerInfo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for test taker form and info
  const [showTakerForm, setShowTakerForm] = React.useState(false);
  const [testTakerInfo, setTestTakerInfo] = React.useState<TestTakerInfo | null>(providedTestTakerInfo || null);

  // Quiz settings
  const [settings] = React.useState({
    difficulty: 'beginner',
    timeLimit: 15,
    questionsCount: 10
  });

  // Hooks for different test types
  const testManagement = useTestManagement(testId && testId !== 'subject' ? testId : '', testTakerInfo);
  const userTest = useUserTest(testId);
  const subjectQuiz = useSubjectQuiz(location, settings);

  // Determine which test type we're dealing with
  const isSubjectQuiz = testId === 'subject';

  // Get the appropriate data based on test type
  const loading = isSubjectQuiz ? subjectQuiz.loading : (userTest.loading || testManagement.loading);
  const questions = isSubjectQuiz ? subjectQuiz.questions : userTest.questions;
  const testDetails = isSubjectQuiz ? subjectQuiz.testDetails : userTest.testDetails;
  
  // Test execution state
  const testStarted = isSubjectQuiz ? subjectQuiz.testStarted : testManagement.testStarted;
  const currentQuestion = isSubjectQuiz ? subjectQuiz.currentQuestion : testManagement.currentQuestion;
  const selectedAnswer = isSubjectQuiz ? subjectQuiz.selectedAnswer : testManagement.selectedAnswer;
  const timeRemaining = isSubjectQuiz ? subjectQuiz.timeRemaining : testManagement.timeRemaining;
  const showResults = isSubjectQuiz ? subjectQuiz.showResults : testManagement.showResults;
  const score = isSubjectQuiz ? subjectQuiz.score : testManagement.score;
  const userAnswers = isSubjectQuiz ? subjectQuiz.userAnswers : testManagement.userAnswers;

  // Timer effect for subject quiz
  React.useEffect(() => {
    if (isSubjectQuiz && subjectQuiz.testStarted && subjectQuiz.timeRemaining > 0 && !subjectQuiz.showResults) {
      const timer = setInterval(() => {
        subjectQuiz.setTimeRemaining(prev => {
          if (prev <= 1) {
            subjectQuiz.finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isSubjectQuiz, subjectQuiz.testStarted, subjectQuiz.timeRemaining, subjectQuiz.showResults]);

  const handleTestTakerSubmit = async (data: TestTakerInfo) => {
    if (!isSubjectQuiz && userTest.shareCodeRequired && testDetails?.share_code) {
      if (!data.shareCode) {
        userTest.setShareCodeError("Share code is required");
        return;
      }
      
      if (data.shareCode !== testDetails.share_code) {
        userTest.setShareCodeError("Invalid share code for this test");
        return;
      }
      
      // Clear any previous share code errors
      userTest.setShareCodeError(null);
    }
    
    setTestTakerInfo(data);
    setShowTakerForm(false);
    
    // Start the appropriate test
    if (isSubjectQuiz) {
      subjectQuiz.startTest();
    } else {
      testManagement.startTest();
    }
  };

  const formatUserAnswersForReview = () => {
    return userAnswers.map((selectedOption, index) => {
      const question = questions[index];
      const correctAnswer = question?.answer !== undefined ? question.answer : question?.correctOption || 0;
      return {
        selectedOption,
        isCorrect: selectedOption === correctAnswer
      };
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render no questions state
  if (questions.length === 0) {
    return <NoQuestionsState />;
  }

  // Render pre-test states
  if (!testStarted) {
    if (!isSubjectQuiz && user && userTest.previousAttempts > 0 && testDetails && !testDetails.allow_retakes) {
      return <AttemptBlockedState testDetails={testDetails} />;
    }

    if (showTakerForm) {
      return (
        <TestTakerForm 
          onSubmit={handleTestTakerSubmit} 
          testTitle={testDetails?.title || undefined}
          requireShareCode={!isSubjectQuiz && userTest.shareCodeRequired}
          shareCodeError={!isSubjectQuiz ? userTest.shareCodeError : null}
        />
      );
    }

    return (
      <TestInstructions
        testDetails={testDetails}
        questions={questions}
        location={location}
        previousAttempts={!isSubjectQuiz ? userTest.previousAttempts : 0}
        onStartTest={isSubjectQuiz ? subjectQuiz.startTest : testManagement.startTest}
        onShowTakerForm={() => setShowTakerForm(true)}
        user={user}
        testId={testId}
        testTakerInfo={testTakerInfo}
      />
    );
  }

  // Render results states
  if (showResults) {
    const isCreator = user?.id === testDetails?.creator_id;
    
    // Handle different visibility options
    if (!isSubjectQuiz && testDetails?.results_visibility) {
      switch (testDetails.results_visibility) {
        case 'creator_only':
          // Only show results to creator, others see submission complete
          if (!isCreator) {
            return (
              <SubmissionComplete 
                testDetails={testDetails} 
                testTakerInfo={testTakerInfo} 
              />
            );
          }
          break;
        
        case 'test_takers':
          // Show results to test takers and creator
          // This will fall through to the TestResults component
          break;
        
        case 'public':
          // Show results with public leaderboard
          // This will fall through to the TestResults component
          break;
      }
    }

    if (!isSubjectQuiz && testManagement.reviewMode) {
      return (
        <div className="pb-10">
          <AnswersReview
            questions={questions}
            userAnswers={formatUserAnswersForReview()}
            score={score}
            timeRemaining={timeRemaining}
            testDetails={testDetails}
            location={location}
            onBackToSummary={() => testManagement.setReviewMode(false)}
            onFinish={() => navigate('/cbt')}
            formatTime={formatTime}
          />
        </div>
      );
    }
    
    // Show results for test_takers visibility, public visibility, and subject quizzes
    return (
      <TestResults
        score={score}
        questions={questions}
        testDetails={testDetails}
        timeRemaining={timeRemaining}
        location={location}
        testId={testId}
        publicResults={!isSubjectQuiz ? testManagement.publicResults : []}
        testTakerInfo={testTakerInfo}
        user={user}
        onReviewAnswers={!isSubjectQuiz ? () => testManagement.setReviewMode(true) : undefined}
        onFinish={() => navigate('/cbt')}
        onTryAgain={!isSubjectQuiz ? testManagement.resetTest : undefined}
        formatTime={formatTime}
        savingError={!isSubjectQuiz ? testManagement.savingError : null}
      />
    );
  }

  // Render question display
  const currentQuestionData = questions[currentQuestion];

  if (!currentQuestionData) {
    return <NoQuestionsState />;
  }

  return (
    <QuestionDisplay
      currentQuestion={currentQuestion}
      questions={questions}
      timeRemaining={timeRemaining}
      selectedAnswer={selectedAnswer}
      onAnswerSelect={isSubjectQuiz ? subjectQuiz.handleAnswerSelect : testManagement.handleAnswerSelect}
      onPreviousQuestion={isSubjectQuiz ? subjectQuiz.goToPreviousQuestion : testManagement.goToPreviousQuestion}
      onNextQuestion={isSubjectQuiz ? subjectQuiz.goToNextQuestion : testManagement.goToNextQuestion}
      formatTime={formatTime}
    />
  );
};

export default TestStateManager;
