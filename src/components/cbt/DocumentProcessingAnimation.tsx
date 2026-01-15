import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Brain, CheckCircle, Loader2 } from 'lucide-react';

interface DocumentProcessingAnimationProps {
  stage: 'extracting' | 'analyzing' | 'generating' | 'complete';
  progress?: number;
}

const stages = [
  { id: 'extracting', label: 'Extracting text from document...', icon: FileText },
  { id: 'analyzing', label: 'Analyzing content...', icon: Brain },
  { id: 'generating', label: 'Generating questions...', icon: Sparkles },
  { id: 'complete', label: 'Questions ready!', icon: CheckCircle },
];

const DocumentProcessingAnimation: React.FC<DocumentProcessingAnimationProps> = ({ 
  stage, 
  progress = 0 
}) => {
  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Animated Icon */}
      <div className="relative mb-6">
        <motion.div
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              '0 0 0 0 rgba(var(--primary), 0.2)',
              '0 0 0 20px rgba(var(--primary), 0)',
              '0 0 0 0 rgba(var(--primary), 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {stage === 'complete' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="h-12 w-12 text-green-500" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-12 w-12 text-primary" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Orbiting particles */}
        {stage !== 'complete' && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-primary rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [0, Math.cos(i * 2.094) * 50, 0],
                  y: [0, Math.sin(i * 2.094) * 50, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Current stage text */}
      <motion.h3
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-semibold text-foreground mb-2 text-center"
      >
        {stages[currentIndex]?.label}
      </motion.h3>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mt-4">
        {stages.slice(0, 3).map((s, idx) => {
          const isComplete = idx < currentIndex || stage === 'complete';
          const isCurrent = idx === currentIndex && stage !== 'complete';
          
          return (
            <React.Fragment key={s.id}>
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: isCurrent ? Infinity : 0,
                }}
              >
                <s.icon className="h-4 w-4" />
              </motion.div>
              {idx < 2 && (
                <motion.div
                  className={`w-8 h-1 rounded-full ${
                    idx < currentIndex || stage === 'complete' ? 'bg-green-500' : 'bg-muted'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isComplete ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar */}
      {stage !== 'complete' && (
        <div className="w-full max-w-xs mt-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: stage === 'extracting' ? '33%' : stage === 'analyzing' ? '66%' : '90%' 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Tips while waiting */}
      {stage !== 'complete' && (
        <motion.div
          className="mt-6 p-4 bg-muted/50 rounded-lg max-w-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-muted-foreground">
            {stage === 'extracting' && '📄 Reading your document content...'}
            {stage === 'analyzing' && '🧠 Understanding the key concepts...'}
            {stage === 'generating' && '✨ Creating personalized questions...'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentProcessingAnimation;
