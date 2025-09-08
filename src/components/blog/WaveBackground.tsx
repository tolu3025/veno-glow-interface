
import React from 'react';
import { motion } from 'framer-motion';

const WaveBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 opacity-30"
          style={{
            background: `repeating-linear-gradient(
              35deg,
              transparent,
              transparent 40px,
              rgba(66, 153, 225, 0.1) ${40 + i * 20}px,
              rgba(66, 153, 225, 0.1) ${80 + i * 20}px
            )`,
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default WaveBackground;
