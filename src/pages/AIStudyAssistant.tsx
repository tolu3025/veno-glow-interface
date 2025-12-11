import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import WelcomeAnimator from '@/components/ai-assistant/WelcomeAnimator';
import ChatMessage from '@/components/ai-assistant/ChatMessage';
import FileUploader from '@/components/ai-assistant/FileUploader';
import RichTextPanel from '@/components/ai-assistant/RichTextPanel';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'document' | 'image';
  content?: string;
  preview?: string;
}

const AIStudyAssistant: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [documentContext, setDocumentContext] = useState('');
  const [imageContext, setImageContext] = useState('');
  const [lastAssistantMessage, setLastAssistantMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userName = user?.user_metadata?.display_name || 
                   user?.email?.split('@')[0] || 
                   'Learner';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    }
  };

  const handleFilesProcessed = useCallback((docContext: string, imgContext: string) => {
    setDocumentContext(docContext);
    setImageContext(imgContext);
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    const userMessage = input.trim();
    setInput('');
    setShowWelcome(false);
    setIsTyping(false);

    // Add file context to the message if files are uploaded
    let fullMessage = userMessage;
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map(f => f.name).join(', ');
      fullMessage = `${userMessage}\n\n[Files attached: ${fileNames}]`;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: fullMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-study-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            documentContext,
            imageContext,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMessage = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                return updated;
              });
            }
          } catch {
            // Partial JSON, continue
          }
        }
      }

      setLastAssistantMessage(assistantMessage);

      // Clear files after processing
      if (uploadedFiles.length > 0) {
        setUploadedFiles([]);
        setDocumentContext('');
        setImageContext('');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2) return;
    
    // Remove last assistant message and resend
    const lastUserMessageIndex = messages.length - 2;
    const userMessage = messages[lastUserMessageIndex];
    
    setMessages(prev => prev.slice(0, -1));
    setInput(userMessage.content);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="font-comfortaa font-semibold text-lg">AI Study Assistant</h1>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Welcome Animation */}
            {showWelcome && messages.length === 0 && (
              <WelcomeAnimator
                userName={userName}
                onComplete={handleWelcomeComplete}
                isTyping={isTyping}
              />
            )}

            {/* Messages */}
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
              />
            ))}

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-veno-primary/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Rich Text Panel */}
        {lastAssistantMessage && messages.length > 0 && (
          <div className="px-4 pb-4">
            <div className="max-w-3xl mx-auto">
              <RichTextPanel
                content={lastAssistantMessage}
                onRegenerate={handleRegenerate}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* File Uploader */}
            <FileUploader
              onFilesProcessed={handleFilesProcessed}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />

            {/* Input Box */}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything... Generate questions, solve problems, create study notes..."
                className="min-h-[52px] max-h-[200px] resize-none font-comfortaa text-sm"
                rows={1}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                size="icon"
                className="h-[52px] w-[52px] shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground font-comfortaa">
              VenoBot AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudyAssistant;
