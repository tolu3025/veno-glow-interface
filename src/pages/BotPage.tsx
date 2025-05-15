import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, X, Download, Bot, MessageSquare, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
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
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
      {/* Chat container that mimics the image */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-purple-600">
              <VenoLogo className="h-6 w-6 text-white" alt="Bot" />
            </Avatar>
            <div>
              <h1 className="font-medium">AI Assistant</h1>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => {}}
              aria-label="Refresh"
            >
              <ArrowLeft size={18} className="text-purple-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => navigate("/")}
              aria-label="Close"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mr-2 mt-1 bg-purple-600">
                    <VenoLogo className="h-5 w-5 text-white" alt="Bot" />
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl py-3 px-4 ${
                    message.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="text-sm">
                    {message.role === "assistant" ? (
                      <BotResponse message={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className="text-xs mt-1 text-right opacity-70">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 ml-2 mt-1 bg-purple-600">
                    {user.user_metadata?.avatar_url ? (
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.email || ""} />
                    ) : (
                      <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    )}
                  </Avatar>
                )}
              </div>
            ))}
            
            {isStreaming && (
              <div className="flex justify-start">
                <Avatar className="h-8 w-8 mr-2 mt-1 bg-purple-600">
                  <VenoLogo className="h-5 w-5 text-white" alt="Bot" />
                </Avatar>
                <div className="max-w-[80%] rounded-2xl py-3 px-4 bg-gray-100 text-gray-800 rounded-bl-none">
                  <div className="text-sm">
                    <BotResponse message={streamingMessage} />
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1 text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      
        {/* Option buttons (based on the image) */}
        {messages.length <= 2 && !isStreaming && (
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={() => setPrompt("Tell me more about AI assistants")}
              className="w-full py-3 px-4 rounded-full border border-purple-300 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
            >
              An AI chatbot to suggest products, generate leads, or handle customer inquiries
            </button>
            <button
              onClick={() => setPrompt("Tell me about omnichannel messaging")}
              className="w-full py-3 px-4 rounded-full border border-purple-300 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
            >
              Omnichannel business messaging
            </button>
            <button
              onClick={() => setPrompt("How secure is this chat?")}
              className="w-full py-3 px-4 rounded-full bg-purple-600 text-sm text-white hover:bg-purple-700 transition-colors"
            >
              Secure and scalable in-app chat
            </button>
          </div>
        )}
      
        {/* Input area */}
        <div className="border-t p-4">
          <form 
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center relative"
          >
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 border rounded-full py-2 px-4 focus:ring-0"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !prompt.trim()} 
              size="icon"
              className="rounded-full h-10 w-10 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 
                <Loader2 className="h-5 w-5 animate-spin text-white" /> : 
                <Send className="h-5 w-5 text-white" />
              }
            </Button>
          </form>
          <div className="flex justify-center mt-2">
            <span className="text-xs text-gray-400">Powered by VenoBot</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotPage;
