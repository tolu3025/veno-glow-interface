import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Zap, X, Loader2, Link, Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface CreateChallengeLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 seconds', questions: 3 },
  { value: 60, label: '1 minute', questions: 5 },
  { value: 120, label: '2 minutes', questions: 10 },
  { value: 240, label: '4 minutes ⚡', questions: 15, isHighStakes: true },
];

const generateShareCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const CreateChallengeLinkModal: React.FC<CreateChallengeLinkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStreak = async () => {
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
  }, [user]);

  const handleCreateLink = async () => {
    if (!subjectInput.trim() || !user) return;

    setIsLoading(true);
    try {
      const shareCode = generateShareCode();
      const subject = subjectInput.trim();

      // Generate questions using AI
      const { data: questionsData, error: questionsError } = await supabase.functions.invoke(
        'generate-challenge-questions',
        {
          body: {
            subject: subject,
            durationSeconds: selectedDuration,
            hostStreak: userStreak,
          },
        }
      );

      if (questionsError) throw questionsError;

      // Create challenge record with share_code and no opponent_id
      const { data: challenge, error: challengeError } = await supabase
        .from('streak_challenges')
        .insert({
          host_id: user.id,
          opponent_id: null, // Will be set when someone joins via link
          subject: subject,
          duration_seconds: selectedDuration,
          difficulty: questionsData.difficulty,
          questions: questionsData.questions,
          status: 'pending',
          share_code: shareCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour timeout for link challenges
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      const challengeLink = `${window.location.origin}/cbt/challenge/${shareCode}`;
      setGeneratedLink(challengeLink);

      toast({
        title: 'Challenge link created!',
        description: 'Share this link with anyone to challenge them.',
      });
    } catch (error) {
      console.error('Error creating challenge link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create challenge link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Challenge link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!generatedLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Challenge Me!',
          text: `I challenge you to a ${subjectInput} quiz battle! Click the link to accept.`,
          url: generatedLink,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setSubjectInput('');
    setSelectedDuration(60);
    setCopied(false);
    onClose();
  };

  const is4MinMode = selectedDuration === 240;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-md ${is4MinMode && !generatedLink ? 'border-destructive/50' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-veno-primary" />
            Create Challenge Link
          </DialogTitle>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-veno-primary/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-veno-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Challenge Link Ready!</h3>
              <p className="text-sm text-muted-foreground">
                Share this link with any registered user to challenge them.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Challenge Details</p>
              <p className="font-medium">{subjectInput}</p>
              <p className="text-sm text-muted-foreground">
                {DURATION_OPTIONS.find(d => d.value === selectedDuration)?.label} • 
                {DURATION_OPTIONS.find(d => d.value === selectedDuration)?.questions} questions
              </p>
            </div>

            <div className="flex gap-2">
              <Input 
                value={generatedLink} 
                readOnly 
                className="text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Done
              </Button>
              <Button onClick={handleShare} className="flex-1 bg-veno-primary hover:bg-veno-primary/90">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Link expires in 24 hours
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Enter Subject/Topic
              </label>
              <Input
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="e.g., Physics, Algebra, Nigerian History..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Enter any topic - calculations will be auto-detected
              </p>
            </div>

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

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateLink}
                disabled={!subjectInput.trim() || isLoading}
                className={`flex-1 ${
                  is4MinMode
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-veno-primary hover:bg-veno-primary/90'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Create Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
