import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mic, BookOpen, Sparkles, Plus, ArrowLeft, Lock, Coins, Crown } from 'lucide-react';
import VoiceTutor from '@/components/voice-tutor/VoiceTutor';
import VoiceChatHistorySidebar from '@/components/voice-tutor/VoiceChatHistorySidebar';
import { useVoiceChatHistory } from '@/hooks/useVoiceChatHistory';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { BillingService } from '@/services/billingService';
import { CoinService, FEATURE_COSTS } from '@/services/coinService';
import PaymentDialog from '@/components/billing/PaymentDialog';
import { UnlockCountdown } from '@/components/coins/UnlockCountdown';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const VoiceTutorPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptEntry[]>([]);
  
  // Access control states
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinUnlockExpiry, setCoinUnlockExpiry] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    loading,
    createSession,
    updateTranscript,
    deleteSession,
    loadSessionTranscript
  } = useVoiceChatHistory();

  // Check access on mount
  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    // Check subscription access
    const subscribed = await BillingService.hasFeatureAccess('voice_tutor');
    if (subscribed) {
      setHasAccess(true);
      return;
    }

    // Check coin unlock
    const coinUnlock = await CoinService.getActiveUnlock('voice_tutor');
    if (coinUnlock) {
      setHasAccess(true);
      setCoinUnlockExpiry(coinUnlock.expires_at);
      return;
    }

    // No access
    setHasAccess(false);
    
    // Get coin balance for display
    const balance = await CoinService.getCoinBalance();
    setCoinBalance(balance);
  };

  const handleUnlockWithCoins = async () => {
    setIsUnlocking(true);
    const result = await CoinService.unlockFeatureWithCoins('voice_tutor');
    setIsUnlocking(false);

    if (result.success) {
      toast({
        title: "Voice Tutor Unlocked! 🎉",
        description: "You now have 24-hour access to the AI Voice Tutor.",
      });
      setHasAccess(true);
      setCoinUnlockExpiry(result.expiresAt || null);
    } else {
      toast({
        title: "Unlock Failed",
        description: result.error || "Not enough coins",
        variant: "destructive",
      });
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentDialog(false);
    checkAccess();
  };

  const handleStartSession = async () => {
    const sessionId = await createSession(subject || undefined, topic || undefined);
    if (sessionId) {
      setCurrentTranscript([]);
      setSessionStarted(true);
    } else {
      toast({
        title: "Error",
        description: "Failed to create voice session",
        variant: "destructive"
      });
    }
  };

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const transcript = await loadSessionTranscript(sessionId);
    setCurrentTranscript(transcript);
    
    // Find session to get subject/topic
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSubject(session.subject || '');
      setTopic(session.topic || '');
    }
    setSessionStarted(true);
  }, [loadSessionTranscript, setCurrentSessionId, sessions]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    toast({
      title: "Session deleted",
      description: "Voice chat history has been removed"
    });
  }, [deleteSession, toast]);

  const handleTranscriptUpdate = useCallback((transcript: TranscriptEntry[]) => {
    if (currentSessionId) {
      updateTranscript(currentSessionId, transcript);
    }
  }, [currentSessionId, updateTranscript]);

  const handleBack = () => {
    setSessionStarted(false);
    setCurrentSessionId(null);
    setCurrentTranscript([]);
  };

  const handleNewSession = async () => {
    setSubject('');
    setTopic('');
    const sessionId = await createSession();
    if (sessionId) {
      setCurrentTranscript([]);
    }
  };

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Gated view - no access
  if (!hasAccess) {
    const cost = FEATURE_COSTS.voice_tutor;
    const hasEnoughCoins = coinBalance >= cost;

    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-lg mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-2xl">AI Voice Tutor</CardTitle>
                <CardDescription className="text-base">
                  Premium feature for personalized voice-based exam preparation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                  <p className="text-sm text-muted-foreground">With Voice Tutor, you can:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Have real-time voice conversations with AI
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Get explanations adapted to your level
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Practice with AI-generated questions
                    </li>
                  </ul>
                </div>

                {/* Subscribe Button */}
                <Button
                  onClick={() => setShowPaymentDialog(true)}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Crown className="w-4 h-4" />
                  Subscribe - ₦5,000/month
                </Button>

                {/* Coin Unlock */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  onClick={handleUnlockWithCoins}
                  variant={hasEnoughCoins ? "outline" : "ghost"}
                  className={`w-full gap-2 ${!hasEnoughCoins ? 'opacity-60' : ''}`}
                  size="lg"
                  disabled={!hasEnoughCoins || isUnlocking}
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  Unlock with {cost} Coins (24h access)
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-muted-foreground">
                    Your balance: <span className={hasEnoughCoins ? 'text-amber-500 font-semibold' : 'text-destructive font-semibold'}>{coinBalance}</span>
                  </span>
                </div>

                {!hasEnoughCoins && (
                  <p className="text-sm text-muted-foreground">
                    🏆 Win streak challenges and finish in the top 10 to earn coins!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <PaymentDialog
          isOpen={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          featureType="voice_tutor"
          onPaymentComplete={handlePaymentComplete}
        />
      </div>
    );
  }

  // Active session view
  if (sessionStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
          {/* Header - Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Back button on mobile */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="sm:hidden p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <VoiceChatHistorySidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                loading={loading}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">VenoBot Voice Tutor</h1>
                {subject && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Subject: {subject}{topic ? ` - ${topic}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {coinUnlockExpiry && (
                <UnlockCountdown expiresAt={coinUnlockExpiry} onExpire={checkAccess} />
              )}
              <Button variant="outline" size="sm" onClick={handleNewSession} className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">New</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleBack} className="hidden sm:flex text-xs sm:text-sm">
                Back to Setup
              </Button>
            </div>
          </div>
          
          <Card className="h-[calc(100vh-100px)] sm:h-[calc(100vh-140px)]">
            <VoiceTutor 
              subject={subject} 
              topic={topic}
              sessionId={currentSessionId}
              initialTranscript={currentTranscript}
              onTranscriptUpdate={handleTranscriptUpdate}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Setup view (has access)
  return (
    <div className="min-h-screen bg-background py-4 sm:py-6 md:py-8">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header - Responsive */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent-foreground" />
                </motion.div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              VenoBot Voice Tutor
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              Real-time AI-powered voice tutoring for your exam preparation
            </p>
            
            {/* Show unlock countdown if using coin access */}
            {coinUnlockExpiry && (
              <div className="flex justify-center mt-3">
                <UnlockCountdown expiresAt={coinUnlockExpiry} onExpire={checkAccess} />
              </div>
            )}
          </div>

          {/* History Button */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <VoiceChatHistorySidebar
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              loading={loading}
            />
          </div>

          {/* Setup Card - Responsive */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                Session Setup
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Optionally specify a subject and topic for focused tutoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="subject" className="text-xs sm:text-sm">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics, Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="topic" className="text-xs sm:text-sm">Topic (Optional)</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Quadratic Equations"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleStartSession}
                className="w-full gap-2 py-4 sm:py-5 text-sm sm:text-base"
                size="lg"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Voice Session
              </Button>
            </CardContent>
          </Card>

          {/* Features - Responsive */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">What VenoBot Can Do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 sm:mt-1">•</span>
                  <span>Explain complex concepts in simple, understandable terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 sm:mt-1">•</span>
                  <span>Generate practice questions and provide instant feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 sm:mt-1">•</span>
                  <span>Help with JAMB, WAEC, NECO, POST-UTME, and university exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 sm:mt-1">•</span>
                  <span>Cover subjects including Math, Science, Business, Arts, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 sm:mt-1">•</span>
                  <span>Adapt explanations based on your understanding level</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceTutorPage;
