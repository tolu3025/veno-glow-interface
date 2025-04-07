
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
        // Custom rendering for math blocks
        math: ({ value }) => (
          <span className="math math-display">
            {`$$${value}$$`}
          </span>
        ),
        // Custom rendering for inline math
        inlineMath: ({ value }) => (
          <span className="math math-inline">
            {`$${value}$`}
          </span>
        )
      }}
    >
      {message}
    </ReactMarkdown>
  );
};

export default BotResponse;
