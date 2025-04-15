
import { motion } from "framer-motion";

const BackgroundBubbles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div 
        className="bubble w-48 h-48 rounded-full absolute -top-12 left-1/4 opacity-60"
        style={{ 
          background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))",
          boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}
        animate={{ 
          y: [0, -40, -10, 0],
          x: [0, 30, -20, 0],
          rotate: [0, 10, -5, 0],
          scale: [1, 1.05, 0.98, 1]
        }}
        transition={{ 
          duration: 15, 
          ease: "easeInOut", 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      <motion.div
        className="bubble w-32 h-32 rounded-full absolute top-1/3 -right-10 opacity-50"
        style={{ 
          background: "radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1))",
          boxShadow: "inset 0 0 15px rgba(255, 255, 255, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}
        animate={{
          y: [0, 30, -20, 0],
          x: [0, -20, 10, 0],
          rotate: [0, -5, 10, 0],
          scale: [1, 0.95, 1.02, 1]
        }}
        transition={{
          duration: 18,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2
        }}
      />
      
      <motion.div
        className="bubble w-40 h-40 rounded-full absolute bottom-20 left-10 opacity-40"
        style={{ 
          background: "radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))",
          boxShadow: "inset 0 0 18px rgba(255, 255, 255, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}
        animate={{
          y: [0, -30, 20, 0],
          x: [0, 20, -30, 0],
          rotate: [0, -10, 5, 0],
          scale: [1, 1.04, 0.97, 1]
        }}
        transition={{
          duration: 20,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1
        }}
      />
      
      <motion.div
        className="bubble w-24 h-24 rounded-full absolute top-1/2 left-1/4 opacity-30"
        style={{ 
          background: "radial-gradient(circle at 60% 60%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05))",
          boxShadow: "inset 0 0 10px rgba(255, 255, 255, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}
        animate={{
          y: [0, 20, -15, 0],
          x: [0, -15, 25, 0],
          rotate: [0, 8, -12, 0],
          scale: [1, 0.98, 1.03, 1]
        }}
        transition={{
          duration: 17,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
          delay: 3
        }}
      />
    </div>
  );
};

export default BackgroundBubbles;
