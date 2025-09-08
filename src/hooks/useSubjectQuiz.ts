
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type QuizQuestion = {
  id: string;
  text?: string;
  question?: string;
  options: string[];
  correctOption?: number;
  answer?: number;
  explanation?: string;
};

export const useSubjectQuiz = (location: any, settings: any) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Subject quiz state
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

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
      
      setTestDetails(subjectTestDetails);
      
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

  const startTest = () => {
    setTestStarted(true);
    setUserAnswers(new Array(questions.length).fill(null));
    if (testDetails?.time_limit) {
      setTimeRemaining(testDetails.time_limit * 60);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
    } else {
      finishTest();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
    }
  };

  const finishTest = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correctAnswers++;
      }
    });
    
    setScore(correctAnswers);
    setShowResults(true);
  };

  useEffect(() => {
    if (location.state?.subject) {
      loadSubjectQuiz();
    }
  }, [location.state]);

  return {
    questions,
    testDetails,
    loading,
    testStarted,
    currentQuestion,
    selectedAnswer,
    userAnswers,
    timeRemaining,
    showResults,
    score,
    startTest,
    handleAnswerSelect,
    goToNextQuestion,
    goToPreviousQuestion,
    finishTest,
    setTimeRemaining
  };
};
