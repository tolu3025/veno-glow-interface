import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RealtimeVoiceChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface VoiceTutorProps {
  subject?: string;
  topic?: string;
  sessionId?: string | null;
  initialTranscript?: TranscriptEntry[];
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const VoiceTutor: React.FC<VoiceTutorProps> = ({ 
  subject, 
  topic, 
  sessionId,
  initialTranscript = [],
  onTranscriptUpdate 
}) => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(initialTranscript);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [currentAssistantTranscript, setCurrentAssistantTranscript] = useState('');
  
  const chatRef = useRef<RealtimeVoiceChat | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, currentAssistantTranscript, currentUserTranscript]);

  const handleMessage = useCallback((event: any) => {
    switch (event.type) {
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        break;

      case 'response.audio_transcript.delta':
        setCurrentAssistantTranscript(prev => prev + (event.delta || ''));
        break;

      case 'response.audio_transcript.done':
        if (currentAssistantTranscript || event.transcript) {
          setTranscript(prev => [...prev, {
            role: 'assistant',
            text: event.transcript || currentAssistantTranscript,
            timestamp: new Date().toISOString()
          }]);
          setCurrentAssistantTranscript('');
        }
        break;

      case 'input_audio_buffer.speech_started':
        setIsUserSpeaking(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsUserSpeaking(false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          setTranscript(prev => [...prev, {
            role: 'user',
            text: event.transcript,
            timestamp: new Date().toISOString()
          }]);
        }
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        toast({
          title: "Error",
          description: event.error?.message || "An error occurred",
          variant: "destructive"
        });
        break;
    }
  }, [currentAssistantTranscript, toast]);

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      chatRef.current = new RealtimeVoiceChat(
        handleMessage,
        setConnectionStatus
      );

      await chatRef.current.init(subject, topic);

      toast({
        title: "Connected",
        description: "VenoBot voice tutor is ready. Start speaking!",
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not connect to voice tutor",
        variant: "destructive",
      });
    }
  }, [handleMessage, subject, topic, toast]);

  const endConversation = useCallback(() => {
    // Save transcript before disconnecting
    if (onTranscriptUpdate && transcript.length > 0) {
      onTranscriptUpdate(transcript);
    }
    chatRef.current?.disconnect();
    chatRef.current = null;
    setCurrentAssistantTranscript('');
    setCurrentUserTranscript('');
  }, [onTranscriptUpdate, transcript]);

  // Save transcript when it changes
  useEffect(() => {
    if (sessionId && onTranscriptUpdate && transcript.length > 0) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, sessionId, onTranscriptUpdate]);

  // Load initial transcript when provided
  useEffect(() => {
    if (initialTranscript.length > 0) {
      setTranscript(initialTranscript);
    }
  }, [initialTranscript]);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-muted'
          }`} />
          <span className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             'Disconnected'}
          </span>
        </div>
        
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-primary"
                >
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">VenoBot speaking...</span>
                </motion.div>
              )}
              {isUserSpeaking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-accent"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Listening...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.length === 0 && connectionStatus === 'disconnected' && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Mic className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Start a Voice Session</p>
            <p className="text-sm mt-2">
              {subject ? `Topic: ${subject}${topic ? ` - ${topic}` : ''}` : 'Click the button below to connect with VenoBot'}
            </p>
          </div>
        )}

        {transcript.length === 0 && connectionStatus === 'connected' && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Mic className="w-16 h-16 mb-4 text-primary" />
            </motion.div>
            <p className="text-lg font-medium">VenoBot is listening</p>
            <p className="text-sm mt-2">Start speaking to begin your tutoring session</p>
          </div>
        )}

        {transcript.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] ${
              entry.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <CardContent className="p-3">
                <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Current streaming transcripts */}
        {currentAssistantTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <Card className="max-w-[80%] bg-muted">
              <CardContent className="p-3">
                <p className="text-sm whitespace-pre-wrap">{currentAssistantTranscript}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div ref={transcriptEndRef} />
      </div>

      {/* Control Buttons */}
      <div className="p-4 border-t border-border">
        <div className="flex justify-center gap-4">
          {connectionStatus === 'disconnected' ? (
            <Button
              onClick={startConversation}
              size="lg"
              className="gap-2 px-8"
            >
              <Phone className="w-5 h-5" />
              Start Voice Session
            </Button>
          ) : connectionStatus === 'connecting' ? (
            <Button disabled size="lg" className="gap-2 px-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </Button>
          ) : (
            <Button
              onClick={endConversation}
              variant="destructive"
              size="lg"
              className="gap-2 px-8"
            >
              <PhoneOff className="w-5 h-5" />
              End Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTutor;
