import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mic, BookOpen, Sparkles } from 'lucide-react';
import VoiceTutor from '@/components/voice-tutor/VoiceTutor';
import { motion } from 'framer-motion';

const VoiceTutorPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleStartSession = () => {
    setSessionStarted(true);
  };

  const handleBack = () => {
    setSessionStarted(false);
  };

  if (sessionStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">VenoBot Voice Tutor</h1>
              {subject && (
                <p className="text-sm text-muted-foreground">
                  Subject: {subject}{topic ? ` - ${topic}` : ''}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleBack}>
              Back to Setup
            </Button>
          </div>
          
          <Card className="h-[calc(100vh-140px)]">
            <VoiceTutor subject={subject} topic={topic} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-10 h-10 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-3 h-3 text-accent-foreground" />
                </motion.div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              VenoBot Voice Tutor
            </h1>
            <p className="text-muted-foreground">
              Real-time AI-powered voice tutoring for your exam preparation
            </p>
          </div>

          {/* Setup Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Session Setup
              </CardTitle>
              <CardDescription>
                Optionally specify a subject and topic for focused tutoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, Physics, Chemistry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Quadratic Equations, Newton's Laws"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <Button
                onClick={handleStartSession}
                className="w-full gap-2"
                size="lg"
              >
                <Mic className="w-5 h-5" />
                Start Voice Session
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>What VenoBot Can Do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Explain complex concepts in simple, understandable terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Generate practice questions and provide instant feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Help with JAMB, WAEC, NECO, POST-UTME, and university exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Cover subjects including Math, Science, Business, Arts, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
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
