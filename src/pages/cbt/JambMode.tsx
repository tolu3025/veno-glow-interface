import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Check, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const JAMB_SUBJECTS = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'government', label: 'Government' },
  { id: 'crk', label: 'CRK' },
  { id: 'geography', label: 'Geography' },
  { id: 'economics', label: 'Economics' },
  { id: 'irk', label: 'IRK' },
  { id: 'civic_education', label: 'Civic Education' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'current_affairs', label: 'Current Affairs' },
  { id: 'history', label: 'History' },
];

// ALOC API question format
interface AlocQuestion {
  id: number;
  question: string;
  option: { a: string; b: string; c: string; d: string; e?: string };
  answer: string;
  section: string;
  examtype: string;
  examyear: string;
}

interface SubjectQuestions {
  subject: string;
  label: string;
  questions: AlocQuestion[];
}

type Phase = 'select' | 'loading' | 'exam' | 'results';

const TOTAL_TIME = 120 * 60; // 2 hours in seconds

const JambMode = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectQuestions, setSubjectQuestions] = useState<SubjectQuestions[]>([]);
  const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({});

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 3) {
        toast.error('You can only select 3 additional subjects');
        return prev;
      }
      return [...prev, id];
    });
  };

  const startExam = async () => {
    if (selectedSubjects.length !== 3) {
      toast.error('Please select exactly 3 subjects');
      return;
    }

    setPhase('loading');

    try {
      const { data, error } = await supabase.functions.invoke('fetch-jamb-questions', {
        body: { subjects: selectedSubjects }
      });

      if (error) throw error;
      if (!data?.questions) throw new Error('No questions returned');

      setSubjectQuestions(data.questions);
      setPhase('exam');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch questions');
      setPhase('select');
    }
  };

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleAnswer = (subjectId: string, questionIndex: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || {}), [questionIndex]: option }
    }));
  };

  const recordChallengeScore = async (totalCorrect: number, totalQuestions: number, pct: number) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Get active season
      const { data: season } = await supabase
        .from('jamb_challenge_seasons')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!season) return;

      // Points = percentage score (e.g. 72% = 72 points)
      const points = pct;

      await supabase.from('jamb_challenge_scores').insert({
        user_id: currentUser.id,
        season_id: season.id,
        score: totalCorrect,
        total_questions: totalQuestions,
        percentage: pct,
        points,
      });
    } catch (err) {
      console.error('Failed to record JAMB challenge score:', err);
    }
  };

  const handleSubmit = useCallback(() => {
    const newScores: Record<string, { correct: number; total: number }> = {};

    subjectQuestions.forEach(sq => {
      let correct = 0;
      sq.questions.forEach((q, i) => {
        const userAnswer = answers[sq.subject]?.[i];
        if (userAnswer && userAnswer.toLowerCase() === q.answer?.toLowerCase()) {
          correct++;
        }
      });
      newScores[sq.subject] = { correct, total: sq.questions.length };
    });

    const totalCorrect = Object.values(newScores).reduce((a, b) => a + b.correct, 0);
    const totalQuestions = Object.values(newScores).reduce((a, b) => a + b.total, 0);
    const pct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Record score for JAMB Challenge
    recordChallengeScore(totalCorrect, totalQuestions, pct);

    setScores(newScores);
    setPhase('results');
  }, [subjectQuestions, answers]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const activeSubject = subjectQuestions[activeSubjectIndex];

  // ── SUBJECT SELECTION ──
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-3">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cbt')}>
              <ArrowLeft size={18} />
            </Button>
            <span className="font-semibold text-lg">JAMB Mode</span>
            <div className="w-9" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
          {/* Fixed subjects */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Compulsory</h3>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Check size={16} className="text-green-600" />
                <span className="font-medium text-sm">English — 60 questions</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <Check size={16} className="text-amber-600" />
                <span className="font-medium text-sm">Literature (Lekki Headmaster) — 10 questions</span>
              </div>
            </CardContent>
          </Card>

          {/* Choose 3 */}
          <div>
            <h3 className="font-semibold mb-3">Choose 3 Subjects ({selectedSubjects.length}/3)</h3>
            <div className="grid grid-cols-2 gap-2">
              {JAMB_SUBJECTS.map(sub => {
                const selected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className={`p-3 rounded-xl text-sm font-medium text-left transition-all border ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Total: <strong>190 questions</strong> · <strong>2 hours</strong>
          </div>

          <Button
            onClick={startExam}
            disabled={selectedSubjects.length !== 3}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Start JAMB Exam
          </Button>
        </div>
      </div>
    );
  }

  // ── LOADING ──
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Preparing your JAMB exam...</p>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === 'results') {
    const totalCorrect = Object.values(scores).reduce((a, b) => a + b.correct, 0);
    const totalQuestions = Object.values(scores).reduce((a, b) => a + b.total, 0);
    const percentage = Math.round((totalCorrect / totalQuestions) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-3">
          <div className="flex items-center justify-center">
            <span className="font-semibold text-lg">JAMB Results</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-5xl font-bold">{percentage}%</p>
              <p className="text-muted-foreground">{totalCorrect} / {totalQuestions} correct</p>
              <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                percentage >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {percentage >= 50 ? 'PASS' : 'FAIL'}
              </span>
            </CardContent>
          </Card>

          {subjectQuestions.map(sq => {
            const s = scores[sq.subject];
            if (!s) return null;
            const pct = Math.round((s.correct / s.total) * 100);
            return (
              <Card key={sq.subject}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{sq.label}</p>
                    <p className="text-xs text-muted-foreground">{s.correct}/{s.total} correct</p>
                  </div>
                  <span className="font-bold text-lg">{pct}%</span>
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
            <CardContent className="p-4 text-center space-y-2">
              <p className="font-semibold text-sm">🔥 Your score earned you <span className="text-primary font-bold">{percentage} points</span> in the JAMB Challenge!</p>
              <Button onClick={() => navigate('/cbt/jamb-challenge')} className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                View JAMB Challenge Leaderboard
              </Button>
            </CardContent>
          </Card>

          <Button onClick={() => navigate('/cbt')} variant="outline" className="w-full">
            Back to CBT
          </Button>
        </div>
      </div>
    );
  }

  // ── EXAM ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Timer + Subject tabs */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-mono font-bold flex items-center gap-1">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </span>
          <Button size="sm" variant="destructive" onClick={handleSubmit}>
            Submit All
          </Button>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1">
          {subjectQuestions.map((sq, i) => (
            <button
              key={sq.subject}
              onClick={() => setActiveSubjectIndex(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                i === activeSubjectIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {sq.label} ({(answers[sq.subject] ? Object.keys(answers[sq.subject]).length : 0)}/{sq.questions.length})
            </button>
          ))}
        </div>
      </div>

      {/* Questions */}
      {activeSubject && (
        <div className="flex-1 container mx-auto px-4 py-4 max-w-2xl space-y-4 pb-24">
          {activeSubject.questions.map((q, qIndex) => (
            <Card key={qIndex} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">
                  <span className="text-muted-foreground mr-1">Q{qIndex + 1}.</span>
                  <span dangerouslySetInnerHTML={{ __html: q.question }} />
                </p>
                <div className="space-y-2">
                  {Object.entries(q.option).map(([key, value]) => {
                    if (!value) return null;
                    const isSelected = answers[activeSubject.subject]?.[qIndex] === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(activeSubject.subject, qIndex, key)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="font-semibold mr-2 uppercase">{key}.</span>
                        <span dangerouslySetInnerHTML={{ __html: value }} />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom nav between subjects */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-3 flex justify-between max-w-2xl mx-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={activeSubjectIndex === 0}
          onClick={() => { setActiveSubjectIndex(i => i - 1); window.scrollTo(0, 0); }}
        >
          <ChevronLeft size={16} className="mr-1" /> Prev Subject
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={activeSubjectIndex === subjectQuestions.length - 1}
          onClick={() => { setActiveSubjectIndex(i => i + 1); window.scrollTo(0, 0); }}
        >
          Next Subject <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default JambMode;
