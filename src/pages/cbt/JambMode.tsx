import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Check, Clock, Loader2, ChevronLeft, ChevronRight, Menu, X, Eye, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const JAMB_SUBJECTS = [
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
  { id: 'englishlit', label: 'Literature in English' },
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

interface AlocQuestion {
  id: number;
  question: string;
  option: { a: string; b: string; c: string; d: string; e?: string };
  answer: string;
  section: string;
  image?: string;
  examtype: string;
  examyear: string;
}

interface SubjectQuestions {
  subject: string;
  label: string;
  questions: AlocQuestion[];
}

type Phase = 'select' | 'loading' | 'exam' | 'review' | 'results' | 'explanations';

const TOTAL_TIME = 120 * 60;

const JambMode = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectQuestions, setSubjectQuestions] = useState<SubjectQuestions[]>([]);
  const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [showNavPanel, setShowNavPanel] = useState(false);

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

      // No merging — each subject stands on its own
      setSubjectQuestions(data.questions);
      setPhase('exam');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch questions');
      setPhase('select');
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

    // Calculate JAMB score out of 400 (each subject scored out of 100)
    const subjectScores = Object.values(newScores);
    const jambTotal = subjectScores.reduce((sum, s) => sum + Math.round((s.correct / s.total) * 100), 0);
    const totalCorrect = subjectScores.reduce((a, b) => a + b.correct, 0);
    const totalQuestions = subjectScores.reduce((a, b) => a + b.total, 0);

    recordChallengeScore(totalCorrect, totalQuestions, jambTotal);
    setScores(newScores);
    setPhase('results');
  }, [subjectQuestions, answers]);

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
  }, [phase, handleSubmit]);

  const handleAnswer = (subjectId: string, questionIndex: number, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || {}), [questionIndex]: option }
    }));
  };

  const recordChallengeScore = async (totalCorrect: number, totalQuestions: number, jambScore: number) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      const { data: season } = await supabase
        .from('jamb_challenge_seasons')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!season) return;
      await supabase.from('jamb_challenge_scores').insert({
        user_id: currentUser.id,
        season_id: season.id,
        score: totalCorrect,
        total_questions: totalQuestions,
        percentage: Math.round((totalCorrect / totalQuestions) * 100),
        points: jambScore,
      });
    } catch (err) {
      console.error('Failed to record JAMB challenge score:', err);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const activeSubject = subjectQuestions[activeSubjectIndex];
  const activeQuestion = activeSubject?.questions[currentQuestionIndex];
  const subjectAnswers = answers[activeSubject?.subject] || {};

  const switchSubject = (index: number) => {
    setActiveSubjectIndex(index);
    setCurrentQuestionIndex(0);
    setShowNavPanel(false);
  };

  const getAnsweredCount = (subjectId: string) => Object.keys(answers[subjectId] || {}).length;

  const reviewData = useMemo(() => {
    return subjectQuestions.map(sq => ({
      label: sq.label,
      subject: sq.subject,
      total: sq.questions.length,
      answered: getAnsweredCount(sq.subject),
      unanswered: sq.questions.length - getAnsweredCount(sq.subject),
      unansweredNumbers: sq.questions
        .map((_, i) => i)
        .filter(i => !answers[sq.subject]?.[i as number])
        .map(i => (i as number) + 1),
    }));
  }, [subjectQuestions, answers]);

  const totalUnanswered = reviewData.reduce((a, b) => a + b.unanswered, 0);

  // ── SUBJECT SELECTION ──
  if (phase === 'select') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="sticky top-0 z-50 border-b px-4 py-3" style={{ backgroundColor: '#1B5E20', color: 'white' }}>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cbt')} className="text-white hover:bg-white/20">
              <ArrowLeft size={18} />
            </Button>
            <span className="font-bold text-lg tracking-wide">JAMB UTME CBT</span>
            <div className="w-9" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: '#1B5E20' }}>Compulsory Subject</h3>
              <div className="flex items-center gap-2 p-3 rounded-lg border" style={{ backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }}>
                <Check size={16} style={{ color: '#2E7D32' }} />
                <span className="font-medium text-sm">Use of English — 60 questions</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold mb-3">Choose 3 Subjects ({selectedSubjects.length}/3)</h3>
            <div className="grid grid-cols-2 gap-2">
              {JAMB_SUBJECTS.map(sub => {
                const selected = selectedSubjects.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => toggleSubject(sub.id)}
                    className="p-3 rounded-lg text-sm font-medium text-left transition-all border"
                    style={{
                      backgroundColor: selected ? '#1B5E20' : 'white',
                      color: selected ? 'white' : '#333',
                      borderColor: selected ? '#1B5E20' : '#ddd',
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center text-sm" style={{ color: '#666' }}>
            Total: <strong>4 subjects</strong> · <strong>~180 questions</strong> · <strong>2 hours</strong>
          </div>

          <Button
            onClick={startExam}
            disabled={selectedSubjects.length !== 3}
            className="w-full h-12 text-base font-bold border-0"
            style={{ backgroundColor: '#1B5E20', color: 'white' }}
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto" style={{ color: '#1B5E20' }} />
          <p style={{ color: '#666' }}>Preparing your JAMB exam...</p>
          <p className="text-xs" style={{ color: '#999' }}>Fetching questions from question bank</p>
        </div>
      </div>
    );
  }

  // ── REVIEW BEFORE SUBMIT ──
  if (phase === 'review') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="sticky top-0 z-50 border-b px-4 py-3" style={{ backgroundColor: '#1B5E20', color: 'white' }}>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setPhase('exam')} className="text-white hover:bg-white/20">
              <ArrowLeft size={18} />
            </Button>
            <span className="font-bold text-lg">Review Submission</span>
            <div className="w-9" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-5 text-center space-y-2">
              <Clock size={24} className="mx-auto" style={{ color: '#1B5E20' }} />
              <p className="font-bold text-lg">Time Remaining: {formatTime(timeLeft)}</p>
              {totalUnanswered > 0 && (
                <p className="text-sm" style={{ color: '#D32F2F' }}>
                  ⚠️ You have <strong>{totalUnanswered}</strong> unanswered question{totalUnanswered > 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {reviewData.map((rd, idx) => (
            <Card key={rd.subject} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">{rd.label}</p>
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{
                    backgroundColor: rd.unanswered === 0 ? '#E8F5E9' : '#FFF3E0',
                    color: rd.unanswered === 0 ? '#2E7D32' : '#E65100',
                  }}>
                    {rd.answered}/{rd.total} answered
                  </span>
                </div>
                {rd.unansweredNumbers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs mb-1" style={{ color: '#999' }}>Unanswered:</p>
                    <div className="flex flex-wrap gap-1">
                      {rd.unansweredNumbers.slice(0, 20).map(n => (
                        <button
                          key={n}
                          onClick={() => {
                            setActiveSubjectIndex(idx);
                            setCurrentQuestionIndex(n - 1);
                            setPhase('exam');
                          }}
                          className="w-7 h-7 text-xs rounded font-medium border"
                          style={{ borderColor: '#E65100', color: '#E65100' }}
                        >
                          {n}
                        </button>
                      ))}
                      {rd.unansweredNumbers.length > 20 && (
                        <span className="text-xs self-center" style={{ color: '#999' }}>+{rd.unansweredNumbers.length - 20} more</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="space-y-2 pt-2">
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-bold border-0"
              style={{ backgroundColor: '#D32F2F', color: 'white' }}
            >
              Submit Exam
            </Button>
            <Button
              onClick={() => setPhase('exam')}
              variant="outline"
              className="w-full"
            >
              Continue Answering
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === 'results') {
    const jambScorePerSubject = subjectQuestions.map(sq => {
      const s = scores[sq.subject];
      if (!s) return { label: sq.label, subject: sq.subject, score: 0, correct: 0, total: 0 };
      const subjectScore = Math.round((s.correct / s.total) * 100);
      return { label: sq.label, subject: sq.subject, score: subjectScore, correct: s.correct, total: s.total };
    });
    const totalJambScore = jambScorePerSubject.reduce((sum, s) => sum + s.score, 0);

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="sticky top-0 z-50 border-b px-4 py-3" style={{ backgroundColor: '#1B5E20', color: 'white' }}>
          <div className="flex items-center justify-center">
            <span className="font-bold text-lg">JAMB Results</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-6xl font-black" style={{ color: '#1B5E20' }}>{totalJambScore}</p>
              <p className="text-lg font-medium" style={{ color: '#666' }}>out of 400</p>
              <div className="w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: '#E0E0E0' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(totalJambScore / 400) * 100}%`,
                    backgroundColor: totalJambScore >= 200 ? '#4CAF50' : '#F44336',
                  }}
                />
              </div>
              <span
                className="inline-block text-sm font-bold px-4 py-1.5 rounded-full"
                style={{
                  backgroundColor: totalJambScore >= 200 ? '#E8F5E9' : '#FFEBEE',
                  color: totalJambScore >= 200 ? '#2E7D32' : '#C62828',
                }}
              >
                {totalJambScore >= 200 ? 'PASS' : 'BELOW CUT-OFF'}
              </span>
            </CardContent>
          </Card>

          {jambScorePerSubject.map(s => (
            <Card key={s.subject} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{s.label}</p>
                  <p className="text-xs" style={{ color: '#999' }}>{s.correct}/{s.total} correct</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-xl" style={{ color: '#1B5E20' }}>{s.score}</span>
                  <span className="text-xs" style={{ color: '#999' }}>/100</span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={() => { setActiveSubjectIndex(0); setPhase('explanations'); }}
            className="w-full h-11 font-semibold border-0"
            style={{ backgroundColor: '#1565C0', color: 'white' }}
          >
            <Eye size={16} className="mr-2" /> View Explanations
          </Button>

          <Card className="border-2 shadow-sm" style={{ borderColor: '#FFA000', backgroundColor: '#FFF8E1' }}>
            <CardContent className="p-4 text-center space-y-2">
              <Trophy size={20} className="mx-auto" style={{ color: '#F57F17' }} />
              <p className="font-semibold text-sm">
                🔥 You earned <span className="font-black" style={{ color: '#1B5E20' }}>{totalJambScore} points</span> in the JAMB Challenge!
              </p>
              <Button
                onClick={() => navigate('/cbt/jamb-challenge')}
                className="w-full border-0 font-semibold"
                style={{ backgroundColor: '#F57F17', color: 'white' }}
              >
                View Challenge Leaderboard
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

  // ── EXPLANATIONS ──
  if (phase === 'explanations') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#1B5E20', color: 'white' }}>
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => setPhase('results')} className="text-white hover:bg-white/20">
              <ArrowLeft size={18} />
            </Button>
            <span className="font-bold text-lg">Answer Review</span>
            <div className="w-9" />
          </div>
          <div className="flex overflow-x-auto px-2 pb-2 gap-1">
            {subjectQuestions.map((sq, i) => {
              const s = scores[sq.subject];
              const subjectScore = s ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <button
                  key={sq.subject}
                  onClick={() => { setActiveSubjectIndex(i); }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: i === activeSubjectIndex ? 'white' : 'rgba(255,255,255,0.2)',
                    color: i === activeSubjectIndex ? '#1B5E20' : 'white',
                  }}
                >
                  {sq.label} ({subjectScore}/100)
                </button>
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-3 pb-8">
          {activeSubject?.questions.map((q, qIndex) => {
            const userAnswer = answers[activeSubject.subject]?.[qIndex];
            const correctAnswer = q.answer?.toLowerCase();
            const isCorrect = userAnswer?.toLowerCase() === correctAnswer;
            const optionLabels = ['a', 'b', 'c', 'd'];
            const wasSkipped = !userAnswer;

            return (
              <Card key={qIndex} className="border-0 shadow-sm overflow-hidden">
                {q.section && (
                  <div className="px-4 pt-3 pb-2 text-xs italic border-b" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>
                    <div dangerouslySetInnerHTML={{ __html: q.section }} />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                      backgroundColor: wasSkipped ? '#FFF3E0' : isCorrect ? '#E8F5E9' : '#FFEBEE',
                      color: wasSkipped ? '#E65100' : isCorrect ? '#2E7D32' : '#C62828',
                    }}>
                      {qIndex + 1}
                    </span>
                    <p className="text-sm flex-1" dangerouslySetInnerHTML={{ __html: q.question }} />
                  </div>
                  {q.image && <img src={q.image} alt="question" className="max-w-full rounded" />}
                  <div className="space-y-1.5 ml-8">
                    {optionLabels.map(key => {
                      const val = q.option[key as keyof typeof q.option];
                      if (!val) return null;
                      const isThisCorrect = key === correctAnswer;
                      const isThisSelected = userAnswer?.toLowerCase() === key;
                      let bg = 'white';
                      let border = '#E0E0E0';
                      let textColor = '#333';
                      if (isThisCorrect) { bg = '#E8F5E9'; border = '#4CAF50'; textColor = '#1B5E20'; }
                      else if (isThisSelected && !isThisCorrect) { bg = '#FFEBEE'; border = '#F44336'; textColor = '#C62828'; }

                      return (
                        <div key={key} className="p-2.5 rounded-lg text-sm border" style={{ backgroundColor: bg, borderColor: border, color: textColor }}>
                          <span className="font-bold mr-2 uppercase">{key}.</span>
                          <span dangerouslySetInnerHTML={{ __html: val }} />
                          {isThisCorrect && <Check size={14} className="inline ml-2" style={{ color: '#2E7D32' }} />}
                          {isThisSelected && !isThisCorrect && <X size={14} className="inline ml-2" style={{ color: '#C62828' }} />}
                        </div>
                      );
                    })}
                  </div>
                  {wasSkipped && (
                    <p className="ml-8 text-xs font-medium" style={{ color: '#E65100' }}>⚠️ You skipped this question</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── EXAM INTERFACE ──
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#1B5E20' }}>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-mono font-bold flex items-center gap-1 text-white">
            <Clock size={14} />
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-white/80 font-medium">JAMB UTME CBT</span>
          <Button
            size="sm"
            onClick={() => setPhase('review')}
            className="text-xs h-7 border-0 font-semibold"
            style={{ backgroundColor: '#D32F2F', color: 'white' }}
          >
            Submit
          </Button>
        </div>
        {/* Subject tabs */}
        <div className="flex overflow-x-auto px-2 pb-2 gap-1">
          {subjectQuestions.map((sq, i) => {
            const answered = getAnsweredCount(sq.subject);
            return (
              <button
                key={sq.subject}
                onClick={() => switchSubject(i)}
                className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: i === activeSubjectIndex ? 'white' : 'rgba(255,255,255,0.15)',
                  color: i === activeSubjectIndex ? '#1B5E20' : 'white',
                }}
              >
                {sq.label} ({answered}/{sq.questions.length})
              </button>
            );
          })}
        </div>
      </div>

      {activeSubject && activeQuestion && (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Main question area */}
          <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold" style={{ color: '#1B5E20' }}>
                Question {currentQuestionIndex + 1} of {activeSubject.questions.length}
              </span>
              <button
                onClick={() => setShowNavPanel(!showNavPanel)}
                className="md:hidden p-2 rounded-lg border"
                style={{ borderColor: '#1B5E20', color: '#1B5E20' }}
              >
                <Menu size={16} />
              </button>
            </div>

            {/* Section/Passage */}
            {activeQuestion.section && (
              <div className="mb-4 p-3 rounded-lg border text-sm" style={{ backgroundColor: '#F1F8E9', borderColor: '#AED581' }}>
                <p className="text-xs font-semibold mb-1 uppercase" style={{ color: '#558B2F' }}>Passage / Instruction</p>
                <div dangerouslySetInnerHTML={{ __html: activeQuestion.section }} className="prose prose-sm max-w-none" />
              </div>
            )}

            {/* Question */}
            <Card className="border-0 shadow-md mb-4">
              <CardContent className="p-5 space-y-4">
                <p className="text-base font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: activeQuestion.question }} />
                {activeQuestion.image && (
                  <img src={activeQuestion.image} alt="question" className="max-w-full rounded-lg border" />
                )}

                <div className="space-y-2">
                  {(['a', 'b', 'c', 'd'] as const).map(key => {
                    const val = activeQuestion.option[key];
                    if (!val) return null;
                    const isSelected = subjectAnswers[currentQuestionIndex] === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(activeSubject.subject, currentQuestionIndex, key)}
                        className="w-full text-left p-3 rounded-lg text-sm transition-all border flex items-start gap-3"
                        style={{
                          backgroundColor: isSelected ? '#1B5E20' : 'white',
                          color: isSelected ? 'white' : '#333',
                          borderColor: isSelected ? '#1B5E20' : '#E0E0E0',
                        }}
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border" style={{
                          borderColor: isSelected ? 'white' : '#BDBDBD',
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent',
                        }}>
                          {key.toUpperCase()}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: val }} className="pt-0.5" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Prev/Next */}
            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex-1"
              >
                <ChevronLeft size={16} className="mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuestionIndex < activeSubject.questions.length - 1) {
                    setCurrentQuestionIndex(i => i + 1);
                  } else if (activeSubjectIndex < subjectQuestions.length - 1) {
                    switchSubject(activeSubjectIndex + 1);
                  }
                }}
                className="flex-1"
                style={currentQuestionIndex === activeSubject.questions.length - 1 && activeSubjectIndex < subjectQuestions.length - 1 ? { backgroundColor: '#1B5E20', color: 'white' } : {}}
              >
                {currentQuestionIndex === activeSubject.questions.length - 1 && activeSubjectIndex < subjectQuestions.length - 1
                  ? 'Next Subject'
                  : 'Next'} <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>

          {/* Question navigation panel - desktop sidebar */}
          <div className="hidden md:block w-48 border-l p-3 sticky top-24 self-start" style={{ backgroundColor: '#FAFAFA' }}>
            <p className="text-xs font-semibold mb-2 uppercase" style={{ color: '#666' }}>Questions</p>
            <div className="grid grid-cols-5 gap-1.5">
              {activeSubject.questions.map((_, i) => {
                const isAnswered = !!subjectAnswers[i];
                const isCurrent = i === currentQuestionIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className="w-7 h-7 rounded text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isCurrent ? '#1B5E20' : isAnswered ? '#4CAF50' : '#E0E0E0',
                      color: isCurrent || isAnswered ? 'white' : '#666',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 text-xs" style={{ color: '#999' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#4CAF50' }} /> Answered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: '#E0E0E0' }} /> Unanswered
              </div>
            </div>
          </div>

          {/* Mobile question nav overlay */}
          {showNavPanel && (
            <div className="fixed inset-0 z-50 md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowNavPanel(false)}>
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">{activeSubject.label} — Questions</p>
                  <button onClick={() => setShowNavPanel(false)}><X size={18} /></button>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {activeSubject.questions.map((_, i) => {
                    const isAnswered = !!subjectAnswers[i];
                    const isCurrent = i === currentQuestionIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => { setCurrentQuestionIndex(i); setShowNavPanel(false); }}
                        className="w-8 h-8 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: isCurrent ? '#1B5E20' : isAnswered ? '#4CAF50' : '#E0E0E0',
                          color: isCurrent || isAnswered ? 'white' : '#666',
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-4 text-xs" style={{ color: '#999' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#4CAF50' }} /> Answered
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: '#E0E0E0' }} /> Unanswered
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JambMode;
