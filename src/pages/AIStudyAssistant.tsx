import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import WelcomeAnimator from '@/components/ai-assistant/WelcomeAnimator';
import ChatMessage from '@/components/ai-assistant/ChatMessage';
import FileUploader from '@/components/ai-assistant/FileUploader';
import ChatHistorySidebar from '@/components/ai-assistant/ChatHistorySidebar';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [documentContext, setDocumentContext] = useState('');
  const [imageContext, setImageContext] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    loading: sessionsLoading,
    createSession,
    loadSessionMessages,
    saveMessage,
    deleteSession,
  } = useChatHistory();

  const userName = user?.user_metadata?.display_name || 
                   user?.email?.split('@')[0] || 
                   'Learner';

  // Scroll to bottom without animation to prevent shaking
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load messages when session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentSessionId) {
        const msgs = await loadSessionMessages(currentSessionId);
        setMessages(msgs);
        setShowWelcome(msgs.length === 0);
      }
    };
    loadMessages();
  }, [currentSessionId, loadSessionMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    }
  };

  const handleFilesProcessed = useCallback((docContext: string, imgContext: string) => {
    setDocumentContext(docContext);
    setImageContext(imgContext);
    console.log('Document context updated:', docContext.length, 'characters');
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setShowWelcome(true);
    setInput('');
    setUploadedFiles([]);
    setDocumentContext('');
    setImageContext('');
  };

  const handleSelectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    const userMessage = input.trim();
    setInput('');
    setShowWelcome(false);
    setIsTyping(false);

    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession(userMessage);
      if (!sessionId) {
        toast.error('Failed to create chat session');
        return;
      }
    }

    // Add file context to the message if files are uploaded
    let fullMessage = userMessage;
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map(f => f.name).join(', ');
      fullMessage = `${userMessage}\n\n[Files attached: ${fileNames}]`;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: fullMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Save user message to database
    await saveMessage(sessionId, 'user', fullMessage);

    try {
      // Log the context being sent
      console.log('Sending to AI with document context:', documentContext.length, 'characters');
      
      const response = await fetch(
        `https://oavauprgngpftanumlzs.supabase.co/functions/v1/ai-study-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdmF1cHJnbmdwZnRhbnVtbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NjAwNzcsImV4cCI6MjA1MDIzNjA3N30.KSCyROzMVdoW0_lrknnbx6TmabgZTEdsDNVZ67zuKyg`,
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

      // Save assistant message to database
      if (assistantMessage) {
        await saveMessage(sessionId, 'assistant', assistantMessage);
      }

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

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {user && sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Chat History */}
      {user && sidebarOpen && (
        <ChatHistorySidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          loading={sessionsLoading}
          onSelectSession={(id) => {
            handleSelectSession(id);
            if (isMobile) setSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            if (isMobile) setSidebarOpen(false);
          }}
          onDeleteSession={deleteSession}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Header - Fixed height */}
      <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            )}
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
              <h1 className="font-heading font-semibold text-lg">AI Study Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area - Scrollable, takes remaining space */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
      >
        <div className="w-full px-4 py-4">
          {/* Welcome Animation */}
          {showWelcome && messages.length === 0 && (
            <div className="flex justify-center py-8">
              <WelcomeAnimator
                userName={userName}
                onComplete={handleWelcomeComplete}
                isTyping={isTyping}
              />
            </div>
          )}

          {/* Messages - Full width */}
          <div className="space-y-4">
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
              <div className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
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
          </div>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area - Fixed at very bottom */}
      <div className="flex-shrink-0 border-t border-border bg-background p-3 pb-[env(safe-area-inset-bottom,12px)]">
        <div className="w-full space-y-2">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="min-h-[44px] max-h-[120px] resize-none text-sm flex-1"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIStudyAssistant;
