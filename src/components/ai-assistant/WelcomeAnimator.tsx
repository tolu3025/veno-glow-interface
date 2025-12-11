import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeAnimatorProps {
  userName: string;
  onComplete: () => void;
  isTyping: boolean;
}

const WelcomeAnimator: React.FC<WelcomeAnimatorProps> = ({ userName, onComplete, isTyping }) => {
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing-welcome' | 'pause' | 'erasing' | 'typing-question' | 'done'>('typing-welcome');
  const [showCursor, setShowCursor] = useState(true);

  const welcomeText = `Welcome ${userName}`;
  const questionText = "What would you love to learn?";

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // If user starts typing, complete immediately
  useEffect(() => {
    if (isTyping && phase !== 'done') {
      setPhase('done');
      onComplete();
    }
  }, [isTyping, phase, onComplete]);

  // Animation sequence
  useEffect(() => {
    if (phase === 'done') return;

    let timeout: NodeJS.Timeout;

    if (phase === 'typing-welcome') {
      if (displayText.length < welcomeText.length) {
        timeout = setTimeout(() => {
          setDisplayText(welcomeText.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timeout = setTimeout(() => setPhase('pause'), 1000);
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('erasing'), 100);
    } else if (phase === 'erasing') {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        setPhase('typing-question');
      }
    } else if (phase === 'typing-question') {
      if (displayText.length < questionText.length) {
        timeout = setTimeout(() => {
          setDisplayText(questionText.slice(0, displayText.length + 1));
        }, 60);
      }
    }

    return () => clearTimeout(timeout);
  }, [phase, displayText, welcomeText, questionText]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-12 px-4"
      >
        <div className="text-center">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold text-primary">
            {displayText}
            <span 
              className={`inline-block w-0.5 h-8 md:h-10 bg-primary ml-1 align-middle transition-opacity duration-100 ${
                showCursor ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </h2>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {['📚 Study Notes', '❓ Generate Questions', '🔬 Research', '📝 Solve Problems'].map((suggestion, index) => (
            <motion.span
              key={suggestion}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{ delay: 1.5 + index * 0.1 }}
              className="px-3 py-1.5 text-xs md:text-sm bg-muted rounded-full text-muted-foreground"
            >
              {suggestion}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeAnimator;
