
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface BotResponseProps {
  message: string;
}

const BotResponse: React.FC<BotResponseProps> = ({ message }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // Custom rendering for code blocks
        code: ({className, children, ...props}) => {
          const match = /language-(\w+)/.exec(className || '');
          const isEquation = match && match[1] === 'math';
          
          if (isEquation) {
            return (
              <span className="math math-display">
                {String(children).replace(/\n$/, '')}
              </span>
            );
          }
          
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {message}
    </ReactMarkdown>
  );
};

export default BotResponse;
