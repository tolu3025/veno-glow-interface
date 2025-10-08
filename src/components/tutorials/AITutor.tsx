import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  timestamp: Date;
}

interface AITutorProps {
  subject: string;
  topic?: string;
  onBack?: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ subject, topic, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI tutor for **${subject}**${topic ? ` - ${topic}` : ''}. I can help you understand concepts with images and detailed explanations.\n\nWhat would you like to learn today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load existing chat or create new one
  useEffect(() => {
    if (!user) return;
    
    const loadOrCreateChat = async () => {
      try {
        // Try to load existing chat for this subject/topic
        const { data: existingChats, error } = await supabase
          .from('ai_tutor_chats')
          .select('*')
          .eq('subject', subject)
          .eq('topic', topic || '')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (existingChats && existingChats.length > 0) {
          const chat = existingChats[0];
          setChatId(chat.id);
          if (chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0) {
            setMessages(chat.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };

    loadOrCreateChat();
  }, [user, subject, topic]);

  // Save messages to database
  const saveMessages = async (newMessages: Message[]) => {
    if (!user || isSaving) return;
    
    setIsSaving(true);
    try {
      // Convert messages to plain objects for JSON storage
      const messagesForDb = newMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        image_url: m.image_url,
        timestamp: m.timestamp.toISOString()
      }));

      if (chatId) {
        // Update existing chat
        const { error } = await supabase
          .from('ai_tutor_chats')
          .update({
            messages: messagesForDb as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', chatId);

        if (error) throw error;
      } else {
        // Create new chat
        const { data, error } = await supabase
          .from('ai_tutor_chats')
          .insert({
            subject,
            topic: topic || null,
            messages: messagesForDb as any
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setChatId(data.id);
      }
    } catch (error) {
      console.error('Error saving messages:', error);
      toast.error('Failed to save chat history');
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition error');
      };
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: {
          messages: updatedMessages,
          subject,
          topic,
          includeImages: true,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        image_url: data.image_url,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      await saveMessages(finalMessages);

      if (voiceEnabled && data.message) {
        speakText(data.message);
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      toast.error('Failed to get response from AI tutor');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!user) return;
    
    try {
      if (chatId) {
        await supabase
          .from('ai_tutor_chats')
          .delete()
          .eq('id', chatId);
      }
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hello! I'm your AI tutor for **${subject}**${topic ? ` - ${topic}` : ''}. I can help you understand concepts with images and detailed explanations.\n\nWhat would you like to learn today?`,
        timestamp: new Date(),
      }]);
      setChatId(null);
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback>
                <Bot className="h-5 w-5 text-primary-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-base md:text-lg">{subject}</h2>
              {topic && (
                <p className="text-xs text-muted-foreground">{topic}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {messages.length - 1} messages
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className={`h-8 w-8 shrink-0 ${message.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <span className="text-sm font-semibold text-primary-foreground">U</span>
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[85%] sm:max-w-[75%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div
                      className={`rounded-2xl px-4 py-3 break-words ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      
                      {message.image_url && (
                        <div className="mt-3">
                          <img
                            src={message.image_url}
                            alt="Educational diagram"
                            className="rounded-lg max-w-full h-auto border"
                          />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs text-muted-foreground mt-1 block ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar className="h-8 w-8 bg-secondary">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-card shadow-lg">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex gap-2 items-end">
            <Button
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className="shrink-0"
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your question..."
                disabled={isLoading || isListening}
                className="pr-12 min-h-[44px] resize-none"
              />
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
            
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
            
            {isSpeaking && (
              <Button
                variant="outline"
                size="icon"
                onClick={stopSpeaking}
                className="shrink-0"
              >
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
