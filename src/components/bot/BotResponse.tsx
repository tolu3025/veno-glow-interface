
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface BotResponseProps {
  message: string;
}

const BotResponse: React.FC<BotResponseProps> = ({ message }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Enhanced code block rendering
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
              <code 
                className={`${className} rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm`} 
                {...props}
              >
                {children}
              </code>
            );
          },
          // Enhanced paragraph rendering
          p: ({children}) => (
            <p className="mb-4 leading-7">{children}</p>
          ),
          // Enhanced list rendering
          ul: ({children}) => (
            <ul className="list-disc pl-6 mb-4">{children}</ul>
          ),
          ol: ({children}) => (
            <ol className="list-decimal pl-6 mb-4">{children}</ol>
          ),
          // Enhanced blockquote rendering
          blockquote: ({children}) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4">
              {children}
            </blockquote>
          ),
          // Enhanced table rendering
          table: ({children}) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({children}) => (
            <th className="border border-border bg-muted px-4 py-2 text-left">
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className="border border-border px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};

export default BotResponse;
