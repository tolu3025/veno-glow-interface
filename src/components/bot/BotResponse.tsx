
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
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
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
                className={`${className} rounded bg-gray-200 px-[0.3rem] py-[0.2rem] font-mono text-sm`} 
                {...props}
              >
                {children}
              </code>
            );
          },
          p: ({children}) => (
            <p className="mb-2 leading-relaxed">{children}</p>
          ),
          ul: ({children}) => (
            <ul className="list-disc pl-5 mb-2 text-sm">{children}</ul>
          ),
          ol: ({children}) => (
            <ol className="list-decimal pl-5 mb-2 text-sm">{children}</ol>
          ),
          blockquote: ({children}) => (
            <blockquote className="border-l-2 border-gray-300 pl-3 italic my-2 text-sm">
              {children}
            </blockquote>
          ),
          table: ({children}) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({children}) => (
            <thead className="bg-gray-100">
              {children}
            </thead>
          ),
          th: ({children}) => (
            <th className="border border-gray-300 bg-gray-50 px-2 py-1.5 text-left font-medium text-sm">
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className="border border-gray-300 px-2 py-1.5 text-sm">
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
