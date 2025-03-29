
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

const BotPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  
  const messages = [
    {
      role: "bot",
      content: "Hello! I'm Veno Bot. How can I assist you today?",
      timestamp: "9:30 AM"
    },
    {
      role: "user",
      content: "Hi there! What can you help me with?",
      timestamp: "9:31 AM"
    },
    {
      role: "bot",
      content: "I can help you with learning resources, answer questions about Veno services, provide technical support, and much more!",
      timestamp: "9:31 AM"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle message submission
    console.log("Message submitted:", message);
    setMessage("");
  };

  return (
    <div className="pb-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-secondary/70 hover:bg-secondary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold">Veno Bot</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 pr-2">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user' 
                ? 'bg-veno-primary text-white rounded-br-none' 
                : 'bg-secondary text-foreground rounded-bl-none'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs opacity-70 mt-1 block text-right">{msg.timestamp}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full pl-4 pr-12 py-3 rounded-full border border-border bg-background"
        />
        <button 
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-veno-primary text-white disabled:opacity-50"
          disabled={!message.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default BotPage;
