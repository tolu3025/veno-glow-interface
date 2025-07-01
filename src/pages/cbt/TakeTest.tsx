
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

  // Use the test management hook only for user tests (not subject quizzes)
  const testManagement = useTestManagement(testId && testId !== 'subject' ? testId : '');

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
        if (testId && testId !== 'subject') {
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
              question: q.question_text,
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
        question: q.question,
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
    
    // For user tests, use the test management hook
    if (testId && testId !== 'subject') {
      testManagement.startTest();
    }
  };

  // For subject quizzes, we need our own state management
  const [subjectTestStarted, setSubjectTestStarted] = useState(false);
  const [subjectCurrentQuestion, setSubjectCurrentQuestion] = useState(0);
  const [subjectSelectedAnswer, setSubjectSelectedAnswer] = useState<number | null>(null);
  const [subjectUserAnswers, setSubjectUserAnswers] = useState<(number | null)[]>([]);
  const [subjectTimeRemaining, setSubjectTimeRemaining] = useState(0);
  const [subjectShowResults, setSubjectShowResults] = useState(false);
  const [subjectScore, setSubjectScore] = useState(0);

  const startSubjectTest = () => {
    setSubjectTestStarted(true);
    setSubjectUserAnswers(new Array(questions.length).fill(null));
    if (testDetails?.time_limit) {
      setSubjectTimeRemaining(testDetails.time_limit * 60);
    }
  };

  const handleSubjectAnswerSelect = (optionIndex: number) => {
    setSubjectSelectedAnswer(optionIndex);
    const newAnswers = [...subjectUserAnswers];
    newAnswers[subjectCurrentQuestion] = optionIndex;
    setSubjectUserAnswers(newAnswers);
  };

  const goToSubjectNextQuestion = () => {
    if (subjectCurrentQuestion < questions.length - 1) {
      setSubjectCurrentQuestion(prev => prev + 1);
      setSubjectSelectedAnswer(subjectUserAnswers[subjectCurrentQuestion + 1]);
    } else {
      finishSubjectTest();
    }
  };

  const goToSubjectPreviousQuestion = () => {
    if (subjectCurrentQuestion > 0) {
      setSubjectCurrentQuestion(prev => prev - 1);
      setSubjectSelectedAnswer(subjectUserAnswers[subjectCurrentQuestion - 1]);
    }
  };

  const finishSubjectTest = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (subjectUserAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });
    
    setSubjectScore(correctAnswers);
    setSubjectShowResults(true);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Determine which state to use based on test type
  const isSubjectQuiz = testId === 'subject';
  const currentTestStarted = isSubjectQuiz ? subjectTestStarted : testManagement.testStarted;
  const currentQuestionIndex = isSubjectQuiz ? subjectCurrentQuestion : testManagement.currentQuestion;
  const currentSelectedAnswer = isSubjectQuiz ? subjectSelectedAnswer : testManagement.selectedAnswer;
  const currentTimeRemaining = isSubjectQuiz ? subjectTimeRemaining : testManagement.timeRemaining;
  const currentShowResults = isSubjectQuiz ? subjectShowResults : testManagement.showResults;
  const currentScore = isSubjectQuiz ? subjectScore : testManagement.score;

  // Create formatted user answers for the review
  const formatUserAnswersForReview = () => {
    const answers = isSubjectQuiz ? subjectUserAnswers : testManagement.userAnswers;
    return answers.map((selectedOption, index) => {
      const question = questions[index];
      const correctAnswer = question?.answer !== undefined ? question.answer : question?.correctOption || 0;
      return {
        selectedOption,
        isCorrect: selectedOption === correctAnswer
      };
    });
  };

  useEffect(() => {
    console.log("Current test state:", {
      testId,
      questionsLoaded: questions.length,
      testStarted: currentTestStarted,
      showResults: currentShowResults,
      submissionComplete: testManagement.submissionComplete,
      resultsVisibility: testDetails?.results_visibility,
      score: currentScore,
      currentQuestion: currentQuestionIndex,
      selectedAnswer: currentSelectedAnswer
    });
  }, [
    testId, 
    questions, 
    currentTestStarted, 
    currentShowResults,
    testDetails,
    currentScore,
    currentQuestionIndex,
    currentSelectedAnswer
  ]);

  if (loading || (testId !== 'subject' && testManagement.loading)) {
    return <LoadingState />;
  }

  if (questions.length === 0) {
    return <NoQuestionsState />;
  }

  if (!isSubjectQuiz && testManagement.submissionComplete) {
    return (
      <SubmissionComplete 
        testDetails={testDetails} 
        testTakerInfo={testTakerInfo} 
      />
    );
  }

  if (!currentTestStarted) {
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
        onStartTest={isSubjectQuiz ? startSubjectTest : testManagement.startTest}
        onShowTakerForm={() => setShowTakerForm(true)}
        user={user}
        testId={testId || ''}
      />
    );
  }

  if (currentShowResults) {
    const isCreator = user?.id === testDetails?.creator_id;
    
    if (testDetails?.results_visibility === 'creator_only' && !isCreator) {
      return (
        <SubmissionComplete 
          testDetails={testDetails} 
          testTakerInfo={testTakerInfo} 
        />
      );
    }

    if (!isSubjectQuiz && testManagement.reviewMode) {
      return (
        <div className="pb-10">
          <AnswersReview
            questions={questions}
            userAnswers={formatUserAnswersForReview()}
            score={testManagement.score}
            timeRemaining={testManagement.timeRemaining}
            testDetails={testDetails}
            location={location}
            onBackToSummary={() => testManagement.setReviewMode(false)}
            onFinish={() => navigate('/cbt')}
            formatTime={testManagement.formatTime}
          />
        </div>
      );
    }
    
    return (
      <TestResults
        score={currentScore}
        questions={questions}
        testDetails={testDetails}
        timeRemaining={currentTimeRemaining}
        location={location}
        testId={testId || ''}
        publicResults={testManagement.publicResults}
        testTakerInfo={testTakerInfo}
        user={user}
        onReviewAnswers={!isSubjectQuiz ? () => testManagement.setReviewMode(true) : undefined}
        onFinish={() => navigate('/cbt')}
        onTryAgain={!isSubjectQuiz ? testManagement.resetTest : undefined}
        formatTime={formatTime}
        savingError={testManagement.savingError}
      />
    );
  }

  const currentQuestionData = questions[currentQuestionIndex];

  if (!currentQuestionData) {
    return <NoQuestionsState />;
  }

  return (
    <QuestionDisplay
      currentQuestion={currentQuestionIndex}
      questions={questions}
      timeRemaining={currentTimeRemaining}
      selectedAnswer={currentSelectedAnswer}
      onAnswerSelect={isSubjectQuiz ? handleSubjectAnswerSelect : testManagement.handleAnswerSelect}
      onPreviousQuestion={isSubjectQuiz ? goToSubjectPreviousQuestion : testManagement.goToPreviousQuestion}
      onNextQuestion={isSubjectQuiz ? goToSubjectNextQuestion : testManagement.goToNextQuestion}
      formatTime={formatTime}
    />
  );
};

export default TakeTest;
