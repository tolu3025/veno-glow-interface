
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
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
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
            <p className="mb-2 leading-relaxed break-words">{children}</p>
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
            <div className="overflow-x-auto my-2 border border-border rounded-md">
              <table className="min-w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({children}) => (
            <thead className="bg-muted">
              {children}
            </thead>
          ),
          th: ({children}) => (
            <th className="border-b border-r last:border-r-0 border-border bg-muted/70 px-3 py-2 text-left font-medium text-sm">
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className="border-b border-r last:border-r-0 border-border px-3 py-2 text-sm">
              {children}
            </td>
          ),
          // Make sure inline math is properly formatted
          span: ({className, children, ...props}) => {
            if (className === 'math math-inline') {
              return (
                <span className="math math-inline inline-block align-middle" {...props}>
                  {children}
                </span>
              );
            }
            return <span {...props}>{children}</span>;
          }
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};

export default BotResponse;
