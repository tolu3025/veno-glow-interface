import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

interface BattleArenaProps {
  challengeId: string;
  questions: Question[];
  durationSeconds: number;
  isHost: boolean;
  opponentName: string;
  onComplete: (score: number) => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  challengeId,
  questions,
  durationSeconds,
  isHost,
  opponentName,
  onComplete,
}) => {
  const { user } = useAuth();
  
  // Ensure questions is always a valid array
  const safeQuestions = Array.isArray(questions) && questions.length > 0 ? questions : [];
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(safeQuestions.length).fill(null));
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);

  // Handle case when questions are empty/invalid
  if (safeQuestions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold mb-4 text-destructive">Error Loading Battle</h2>
          <p className="text-muted-foreground mb-4">Questions could not be loaded for this challenge.</p>
          <Button onClick={() => onComplete(0)} variant="outline">
            Return to Challenge
          </Button>
        </Card>
      </div>
    );
  }
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Subscribe to opponent's answers
  useEffect(() => {
    const channel = supabase
      .channel(`challenge-answers-${challengeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenge_answers',
          filter: `challenge_id=eq.${challengeId}`,
        },
        (payload) => {
          const answer = payload.new as any;
          if (answer.user_id !== user?.id) {
            setOpponentProgress(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, user?.id]);

  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    const isCorrect = answerIndex === questions[currentQuestion].answer;

    // Save answer to database
    await supabase.from('challenge_answers').insert({
      challenge_id: challengeId,
      user_id: user?.id,
      question_index: currentQuestion,
      selected_answer: answerIndex,
      is_correct: isCorrect,
    });

    // Auto-advance after delay
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        handleSubmit();
      }
    }, 500);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Calculate score
    const score = answers.reduce((acc, answer, idx) => {
      if (answer === safeQuestions[idx]?.answer) return acc + 1;
      return acc;
    }, 0);

    onComplete(score);
  }, [answers, safeQuestions, onComplete, isSubmitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const question = safeQuestions[currentQuestion];
  const isTimeCritical = timeRemaining <= 10;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Question {currentQuestion + 1}/{safeQuestions.length}
            </div>
            <Progress value={(currentQuestion / safeQuestions.length) * 100} className="w-24" />
          </div>

        <motion.div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            isTimeCritical ? 'bg-destructive/20 text-destructive' : 'bg-muted'
          }`}
          animate={isTimeCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Clock className="w-5 h-5" />
          {formatTime(timeRemaining)}
        </motion.div>
      </div>

      {/* Opponent progress */}
      <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{opponentName}'s progress</span>
        <div className="flex items-center gap-2">
          <Progress value={(opponentProgress / safeQuestions.length) * 100} className="w-20" />
          <span className="text-sm font-medium">{opponentProgress}/{safeQuestions.length}</span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-6 mb-6">
        <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {question.question}
          </ReactMarkdown>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === question.answer;
            const showResult = selectedAnswer !== null;

            return (
              <motion.button
                key={idx}
                whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                onClick={() => handleAnswerSelect(idx)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : isSelected
                        ? 'border-destructive bg-destructive/10'
                        : 'border-border opacity-50'
                    : isSelected
                      ? 'border-veno-primary bg-veno-primary/10'
                      : 'border-border hover:border-veno-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    showResult && isCorrect
                      ? 'bg-green-500 text-white'
                      : showResult && isSelected
                        ? 'bg-destructive text-white'
                        : 'bg-muted'
                  }`}>
                    {showResult && isCorrect ? (
                      <Check className="w-4 h-4" />
                    ) : showResult && isSelected ? (
                      <X className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  <div className="flex-1 prose prose-sm dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {option}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Skip / Submit buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQuestion < safeQuestions.length - 1) {
              setCurrentQuestion(prev => prev + 1);
              setSelectedAnswer(null);
            }
          }}
          disabled={selectedAnswer !== null || currentQuestion === safeQuestions.length - 1}
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-veno-primary hover:bg-veno-primary/90"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          Submit All
        </Button>
      </div>
    </div>
  );
};
