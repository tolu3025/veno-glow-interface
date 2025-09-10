
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
      
      let allQuestions: any[] = [];
      
      // Fetch from question bank if needed - use case-insensitive matching
      if (settingsFromState.questionSource === 'question_bank' || settingsFromState.questionSource === 'mixed') {
        const { data: bankQuestions, error: bankError } = await supabase
          .from('questions')
          .select('*')
          .ilike('subject', `%${subject}%`) // Use case-insensitive partial matching
          .in('difficulty', settingsFromState.difficulty === 'all' ? 
              ['beginner', 'intermediate', 'advanced'] : 
              [settingsFromState.difficulty]);
              
        if (bankError) {
          console.error("Error fetching bank questions:", bankError);
        } else if (bankQuestions) {
          console.log(`Found ${bankQuestions.length} questions in question bank for subject pattern: ${subject}`);
          allQuestions = [...allQuestions, ...bankQuestions];
        }
      }
      
      // Fetch from user test questions if needed - use case-insensitive matching
      if (settingsFromState.questionSource === 'user_tests' || settingsFromState.questionSource === 'mixed') {
        const { data: testQuestions, error: testError } = await supabase
          .from('test_questions')
          .select('*')
          .ilike('subject', `%${subject}%`) // Use case-insensitive partial matching
          .in('difficulty', settingsFromState.difficulty === 'all' ? 
              ['beginner', 'intermediate', 'advanced'] : 
              [settingsFromState.difficulty]);
              
        if (testError) {
          console.error("Error fetching test questions:", testError);
        } else if (testQuestions) {
          console.log(`Found ${testQuestions.length} questions in user tests for subject pattern: ${subject}`);
          allQuestions = [...allQuestions, ...testQuestions];
        }
      }
      
      // If no questions found with partial match, try exact subject name from subjects list
      if (allQuestions.length === 0) {
        console.log('No questions found with partial match, trying exact subject names from database...');
        
        // Get all subjects and find the best match
        const { data: subjectsData } = await supabase
          .from('questions')
          .select('subject')
          .not('subject', 'is', null);
          
        const availableSubjects = [...new Set(subjectsData?.map(s => s.subject) || [])];
        console.log('Available subjects in database:', availableSubjects);
        
        // Find closest match
        const exactMatch = availableSubjects.find(s => 
          s?.toLowerCase().includes(subject.toLowerCase()) || 
          subject.toLowerCase().includes(s?.toLowerCase() || '')
        );
        
        if (exactMatch) {
          console.log(`Found closest match: ${exactMatch} for search: ${subject}`);
          
          if (settingsFromState.questionSource === 'question_bank' || settingsFromState.questionSource === 'mixed') {
            const { data: bankQuestions, error: bankError } = await supabase
              .from('questions')
              .select('*')
              .eq('subject', exactMatch)
              .in('difficulty', settingsFromState.difficulty === 'all' ? 
                  ['beginner', 'intermediate', 'advanced'] : 
                  [settingsFromState.difficulty]);
                  
            if (!bankError && bankQuestions) {
              allQuestions = [...allQuestions, ...bankQuestions];
            }
          }
          
          if (settingsFromState.questionSource === 'user_tests' || settingsFromState.questionSource === 'mixed') {
            const { data: testQuestions, error: testError } = await supabase
              .from('test_questions')
              .select('*')
              .eq('subject', exactMatch)
              .in('difficulty', settingsFromState.difficulty === 'all' ? 
                  ['beginner', 'intermediate', 'advanced'] : 
                  [settingsFromState.difficulty]);
                  
            if (!testError && testQuestions) {
              allQuestions = [...allQuestions, ...testQuestions];
            }
          }
        }
      }
      
      // Shuffle and limit questions
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
      const limitedQuestions = shuffledQuestions.slice(0, settingsFromState.questionsCount);
      
      if (limitedQuestions.length === 0) {
        console.log(`No questions found for subject: ${subject}`);
        toast.error(`No questions available for ${subject}`, {
          description: "Please try another subject or check if the subject name matches available subjects"
        });
        navigate('/cbt');
        return;
      }
      
      console.log(`Found ${limitedQuestions.length} questions for ${subject}`);
      
      const formattedQuestions: QuizQuestion[] = limitedQuestions.map(q => ({
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
