
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
            <p className="mb-2 leading-relaxed">{children}</p>
          ),
          // Enhanced list rendering
          ul: ({children}) => (
            <ul className="list-disc pl-5 mb-2 text-sm">{children}</ul>
          ),
          ol: ({children}) => (
            <ol className="list-decimal pl-5 mb-2 text-sm">{children}</ol>
          ),
          // Enhanced blockquote rendering
          blockquote: ({children}) => (
            <blockquote className="border-l-2 border-primary pl-3 italic my-2 text-sm">
              {children}
            </blockquote>
          ),
          // Enhanced table rendering for Excel-like appearance
          table: ({children}) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({children}) => (
            <thead className="bg-secondary/10">
              {children}
            </thead>
          ),
          th: ({children}) => (
            <th className="border border-border bg-muted px-2 py-1.5 text-left font-medium text-sm">
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className="border border-border px-2 py-1.5 text-sm">
              {children}
            </td>
          ),
          // Improve inline math rendering
          inlineMath: ({value}) => (
            <span className="math math-inline">{value}</span>
          ),
          // Display math blocks
          math: ({value}) => (
            <div className="math math-display py-1">{value}</div>
          ),
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};

export default BotResponse;
