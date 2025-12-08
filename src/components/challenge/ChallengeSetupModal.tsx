import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Zap, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { SuspenseCountdown } from './SuspenseCountdown';

interface ChallengeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponentId: string;
  opponentUsername: string;
  onChallengeCreated: (challengeId: string) => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 seconds', questions: 3 },
  { value: 60, label: '1 minute', questions: 5 },
  { value: 120, label: '2 minutes', questions: 10 },
  { value: 240, label: '4 minutes ⚡', questions: 15, isHighStakes: true },
];

export const ChallengeSetupModal: React.FC<ChallengeSetupModalProps> = ({
  isOpen,
  onClose,
  opponentId,
  opponentUsername,
  onChallengeCreated,
}) => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuspense, setShowSuspense] = useState(false);
  const [userStreak, setUserStreak] = useState(0);

  // Fetch available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.rpc('get_subjects_from_questions');
      if (data) {
        setSubjects(data.map((s: any) => s.name));
      }
    };
    fetchSubjects();
  }, []);

  // Fetch user's current streak
  useEffect(() => {
    const fetchStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_challenge_stats')
          .select('current_streak')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setUserStreak(data.current_streak);
        }
      }
    };
    fetchStreak();
  }, []);

  const handleSendChallenge = async () => {
    if (!selectedSubject) return;

    // Show suspense animation for 4-minute mode
    if (selectedDuration === 240) {
      setShowSuspense(true);
      return;
    }

    await createChallenge();
  };

  const createChallenge = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate questions using AI
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
        'generate-challenge-questions',
        {
          body: {
            subject: selectedSubject,
            durationSeconds: selectedDuration,
            hostStreak: userStreak,
          },
        }
      );

      if (questionsError) throw questionsError;

      // Create challenge record
      const { data: challenge, error: challengeError } = await supabase
        .from('streak_challenges')
        .insert({
          host_id: user.id,
          opponent_id: opponentId,
          subject: selectedSubject,
          duration_seconds: selectedDuration,
          difficulty: questionsData.difficulty,
          questions: questionsData.questions,
          status: 'pending',
          expires_at: new Date(Date.now() + 30000).toISOString(), // 30 second timeout
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      onChallengeCreated(challenge.id);
      onClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
    } finally {
      setIsLoading(false);
      setShowSuspense(false);
    }
  };

  const is4MinMode = selectedDuration === 240;

  if (showSuspense) {
    return (
      <SuspenseCountdown
        subject={selectedSubject}
        onComplete={createChallenge}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${is4MinMode ? 'border-destructive/50' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${is4MinMode ? 'text-destructive' : 'text-veno-primary'}`} />
            Challenge {opponentUsername}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subject Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Select Subject
            </label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Battle Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDuration(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedDuration === option.value
                      ? option.isHighStakes
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-veno-primary bg-veno-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.questions} questions
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {is4MinMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                High-Stakes Mode Active!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI difficulty will be boosted by +1 level
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSendChallenge}
              disabled={!selectedSubject || isLoading}
              className={`flex-1 ${
                is4MinMode
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-veno-primary hover:bg-veno-primary/90'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Send Challenge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
