import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, Swords, Brain, Send } from 'lucide-react';

interface SuspenseCountdownProps {
  onComplete: () => void;
  subject: string;
}

const SUSPENSE_MESSAGES = [
  { icon: Zap, text: "⚡ High-Risk Battle Selected...", color: "text-yellow-500" },
  { icon: Target, text: "🎯 Calibrating AI Difficulty...", color: "text-blue-500" },
  { icon: Swords, text: "🏟️ Preparing Combat Arena...", color: "text-red-500" },
  { icon: Brain, text: "🧠 Generating High-Pressure Questions...", color: "text-purple-500" },
  { icon: Send, text: "📡 Sending Challenge Request...", color: "text-green-500" },
];

export const SuspenseCountdown: React.FC<SuspenseCountdownProps> = ({ onComplete, subject }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < SUSPENSE_MESSAGES.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      const completeTimer = setTimeout(onComplete, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, onComplete]);

  const currentMessage = SUSPENSE_MESSAGES[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        className="relative p-8 rounded-2xl bg-gradient-to-br from-card via-destructive/10 to-card border-2 border-destructive/50 max-w-md mx-4"
        animate={{
          boxShadow: [
            "0 0 20px rgba(239, 68, 68, 0.3)",
            "0 0 60px rgba(239, 68, 68, 0.6)",
            "0 0 20px rgba(239, 68, 68, 0.3)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Background pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-destructive/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />

        <div className="relative z-10 text-center">
          {/* Subject badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block px-4 py-1 mb-6 text-sm font-medium rounded-full bg-destructive/20 text-destructive border border-destructive/30"
          >
            {subject}
          </motion.div>

          {/* 4 Minute Challenge indicator */}
          <motion.h2
            className="text-2xl font-bold mb-8 text-foreground"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ⚔️ 4-MINUTE CHALLENGE ⚔️
          </motion.h2>

          {/* Messages */}
          <div className="h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentMessage && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <currentMessage.icon className={`w-8 h-8 ${currentMessage.color}`} />
                  </motion.div>
                  <span className={`text-lg font-semibold ${currentMessage.color}`}>
                    {currentMessage.text}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {SUSPENSE_MESSAGES.map((_, idx) => (
              <motion.div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx <= currentIndex ? 'bg-destructive' : 'bg-muted'
                }`}
                animate={idx === currentIndex ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
