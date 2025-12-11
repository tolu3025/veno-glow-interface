import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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
    <span className={`latex-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {processedText}
      </ReactMarkdown>
    </span>
  );
};

export default LaTeXText;
