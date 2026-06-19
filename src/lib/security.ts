import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving MathML for KaTeX.
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: [
      'math', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace', 'mfrac', 'msqrt', 'mroot',
      'mstyle', 'merror', 'mpadded', 'mphantom', 'mfenced', 'menclose', 'msub', 'msup',
      'msubsup', 'munder', 'mover', 'munderover', 'mmultiscripts', 'none', 'mprescripts',
      'semantics', 'annotation', 'annotation-xml'
    ],
    ADD_ATTR: ['display']
  });
};
