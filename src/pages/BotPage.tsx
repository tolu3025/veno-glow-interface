
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, X, Sparkles, Bot, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const BotPage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm Veno Bot. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const apiKey = "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";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    try {
      // Call the API directly using fetch
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are Veno Bot, a helpful assistant that provides concise, accurate information. When explaining mathematical concepts, use LaTeX notation wrapped in dollar signs for proper formatting. For example, write fractions as \\frac{numerator}{denominator} inside dollar signs. For inline math use single dollar signs like $\\frac{1}{2}$ and for display math use double dollar signs like $$\\frac{1}{2}$$. Ensure all mathematical expressions are properly formatted with LaTeX. Always provide complete responses gradually rather than all at once."
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: "user", content: prompt }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to get a response");
      }
      
      // Handle the streamed response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          
          // Parse the chunk to extract content
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
        // When streaming is done, add the complete message
        const botMessage = { 
          role: "assistant" as const, 
          content: fullContent,
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsStreaming(false);
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      toast.error("Failed to get a response. Please try again.");
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Hello! I'm Veno Bot. How can I assist you today?",
      timestamp: new Date(),
    }]);
    setStreamingMessage("");
    setIsStreaming(false);
  };

  const handleDownloadChat = () => {
    const chatContent = messages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.role === 'user' ? 'You' : 'Veno Bot'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veno-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Bot className="text-veno-primary" size={24} /> Veno Bot
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary/40"
            onClick={handleClearChat}
            title="Clear conversation"
          >
            <X size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary/40"
            onClick={handleDownloadChat}
            title="Download conversation"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>

      {/* Conversation Area */}
      <Card 
        className="flex-1 overflow-y-auto p-4 mb-4 bg-gradient-to-b from-background to-background/80 backdrop-blur-sm border-1 shadow-md"
        ref={conversationRef}
      >
        <div className="space-y-6">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-3 max-w-[85%] ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {message.role === "assistant" ? (
                  <Avatar className="h-10 w-10 border-2 border-veno-primary shadow-lg">
                    <AvatarImage src="/veno-logo.png" alt="Veno AI" />
                    <AvatarFallback className="bg-veno-primary text-white">V</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8 bg-secondary shadow-sm">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-lg p-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border border-muted-foreground/10"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Streaming message */}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[85%]">
                <Avatar className="h-10 w-10 border-2 border-veno-primary shadow-lg">
                  <AvatarImage src="/veno-logo.png" alt="Veno AI" />
                  <AvatarFallback className="bg-veno-primary text-white">V</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted border border-muted-foreground/10">
                  <div className="text-sm whitespace-pre-wrap">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {streamingMessage}
                    </ReactMarkdown>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Typing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading indicator (only shown when not streaming) */}
          {isLoading && !isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[85%]">
                <Avatar className="h-10 w-10 border-2 border-veno-primary shadow-lg">
                  <AvatarImage src="/veno-logo.png" alt="Veno AI" />
                  <AvatarFallback className="bg-veno-primary text-white">V</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted border border-muted-foreground/10 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="flex gap-2 relative">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Veno Bot something..."
          disabled={isLoading}
          className="flex-1 pr-10 py-6 rounded-full shadow-sm border-muted-foreground/20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <Button 
            type="submit" 
            disabled={isLoading || !prompt.trim()} 
            size="icon"
            className="rounded-full h-8 w-8 bg-veno-primary hover:bg-veno-primary/90"
          >
            {isLoading ? 
              <Loader2 className="h-4 w-4 animate-spin" /> : 
              <Send className="h-4 w-4" />
            }
          </Button>
        </div>
      </form>

      {/* Powered by Indicator */}
      <div className="flex justify-center mt-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          Powered by <Sparkles size={12} className="text-veno-primary" /> OpenAI
        </span>
      </div>
    </div>
  );
};

export default BotPage;
