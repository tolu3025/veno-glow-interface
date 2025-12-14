import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface LaTeXTextProps {
  children: string;
  className?: string;
}

/**
 * Component to render text with LaTeX mathematical expressions.
 * Supports both $ and \( \) notation for inline math,
 * and $$ and \[ \] notation for display math.
 */
const LaTeXText: React.FC<LaTeXTextProps> = ({ children, className = '' }) => {
  // Pre-process text to convert \( \) and \[ \] to $ and $$ notation
  // which remark-math expects
  const processedText = children
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$');

  return (
    <div className={`latex-text prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-inherit">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-muted/50 px-1 py-0.5 rounded text-xs sm:text-sm font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted/50 p-2 sm:p-3 rounded-lg overflow-x-auto my-2 text-xs sm:text-sm">{children}</pre>
          ),
          h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary pl-3 sm:pl-4 my-2 italic">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse text-xs sm:text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-2 py-1">{children}</td>
          ),
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

export default LaTeXText;
