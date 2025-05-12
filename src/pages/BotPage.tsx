
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, X, Sparkles, Bot, Download, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { VenoLogo } from "@/components/ui/logo";
import BotResponse from "@/components/bot/BotResponse";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatHistoryRecord {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface OpenAIConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
}

const BotPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiConfig, setAiConfig] = useState<OpenAIConfig | null>(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error("Error loading chat history:", error);
          return;
        }
        
        if (data && data.length > 0) {
          const formattedMessages = data.map((item: ChatHistoryRecord) => ({
            role: item.role as "user" | "assistant",
            content: item.content,
            timestamp: new Date(item.created_at)
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadChatHistory();
  }, [user]);

  const saveMessageToHistory = async (message: Message) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          created_at: message.timestamp.toISOString()
        });
        
      if (error) {
        console.error("Error saving message:", error);
      }
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const getOpenAIConfig = async (): Promise<OpenAIConfig> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-openai-key');
      
      if (error) {
        console.error("Error fetching OpenAI config:", error);
        throw error;
      }
      
      if (!data || !data.apiKey) {
        throw new Error("No API key returned from server");
      }
      
      return {
        apiKey: data.apiKey,
        model: data.model || "gpt-4o",
        systemPrompt: data.systemPrompt || "You are a helpful, friendly assistant. Format mathematical expressions and equations using LaTeX notation (like $\\frac{1}{2}$ for fractions). When creating tables, use markdown format. Always provide well-formatted responses with proper spacing and organization. Use your full capabilities to give the best possible answers."
      };
    } catch (error) {
      console.error("Failed to get OpenAI API config:", error);
      toast.error("Failed to connect to AI service");
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to use the chatbot");
      navigate("/auth");
      return;
    }
    
    if (!prompt.trim()) return;
    
    const userMessage = { 
      role: "user" as const, 
      content: prompt,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage("");
    
    await saveMessageToHistory(userMessage);
    
    try {
      if (!aiConfig) {
        const config = await getOpenAIConfig();
        setAiConfig(config);
      }
      
      const config = aiConfig || await getOpenAIConfig();
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model, 
          messages: [
            {
              role: "system",
              content: config.systemPrompt
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: "user", content: prompt }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to get a response");
      }
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  fullContent += data.choices[0].delta.content;
                  setStreamingMessage(fullContent);
                }
              } catch (e) {
                // Skip parsing errors in stream chunks
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error);
      } finally {
        const botMessage = { 
          role: "assistant" as const, 
          content: fullContent,
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsStreaming(false);
        
        await saveMessageToHistory(botMessage);
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      toast.error("Failed to get a response. Please try again.");
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('chat_history')
          .delete()
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error clearing chat history:", error);
          toast.error("Failed to clear chat history");
          return;
        }
        
        toast.success("Chat history cleared");
      } catch (error) {
        console.error("Failed to clear chat history:", error);
        toast.error("Failed to clear chat history");
      }
    }
    
    setMessages([{
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
    setStreamingMessage("");
    setIsStreaming(false);
  };

  const handleDownloadChat = () => {
    const chatContent = messages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg">Loading your chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Mobile-friendly header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-full bg-secondary/70 hover:bg-secondary"
          >
            <ArrowLeft size={isMobile ? 16 : 18} />
          </button>
          <Avatar className="h-8 w-8 border-2 border-primary">
            <VenoLogo className="h-full w-full rounded-full" alt="Veno AI" />
          </Avatar>
          <div>
            <h1 className="text-base md:text-lg font-medium flex items-center gap-1">
              AI Assistant <Bot className="text-primary h-3 w-3 md:h-4 md:w-4" />
            </h1>
            <p className="text-xs text-muted-foreground">
              {aiConfig?.model || 'GPT-4o'} • Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-7 w-7 bg-secondary/40"
            onClick={handleClearChat}
            title="Clear conversation"
          >
            <X size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-7 w-7 bg-secondary/40"
            onClick={handleDownloadChat}
            title="Download conversation"
          >
            <Download size={14} />
          </Button>
        </div>
      </div>

      {/* Chat messages area */}
      <ScrollArea className="flex-1 py-2 px-1 md:py-4 md:px-2 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-3 md:space-y-5 px-1.5">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-2 max-w-[85%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {message.role === "assistant" ? (
                  <Avatar className="h-8 w-8 border-2 border-primary shadow-sm mt-0.5">
                    <VenoLogo className="h-full w-full rounded-full" alt="Veno AI" />
                  </Avatar>
                ) : (
                  <Avatar className="h-7 w-7 shadow-sm mt-0.5">
                    {user.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ""} />
                    ) : (
                      <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    )}
                  </Avatar>
                )}
                
                <div
                  className={`rounded-xl py-2 px-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted border border-muted-foreground/10 rounded-tl-sm"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.role === "assistant" ? (
                      <BotResponse message={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex justify-end">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[85%]">
                <Avatar className="h-8 w-8 border-2 border-primary shadow-sm mt-0.5">
                  <VenoLogo className="h-full w-full rounded-full" alt="Veno AI" />
                </Avatar>
                <div className="rounded-xl py-2 px-3 bg-muted border border-muted-foreground/10 rounded-tl-sm shadow-sm">
                  <div className="text-sm whitespace-pre-wrap">
                    <BotResponse message={streamingMessage} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Typing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="bg-background border-t p-2 md:p-3">
        <form 
          onSubmit={handleSendMessage} 
          className="flex gap-1 items-center max-w-3xl mx-auto relative bg-muted p-1 rounded-full shadow-sm border border-border"
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 px-3 rounded-full text-sm"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !prompt.trim()} 
            size="icon"
            className="rounded-full h-8 w-8 bg-primary hover:bg-primary/90 shrink-0"
          >
            {isLoading ? 
              <Loader2 className="h-4 w-4 animate-spin" /> : 
              <Send className="h-4 w-4" />
            }
          </Button>
        </form>
        <div className="flex justify-center mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MessageSquare size={10} /> Powered by <Sparkles size={10} className="text-primary" /> {aiConfig?.model || 'GPT-4o'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BotPage;
