import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mic, BookOpen, Sparkles, Plus, ArrowLeft } from 'lucide-react';
import VoiceTutor from '@/components/voice-tutor/VoiceTutor';
import VoiceChatHistorySidebar from '@/components/voice-tutor/VoiceChatHistorySidebar';
import { useVoiceChatHistory } from '@/hooks/useVoiceChatHistory';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const VoiceTutorPage: React.FC = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptEntry[]>([]);
  
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
