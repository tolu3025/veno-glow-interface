import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks while allowing safe tags and attributes.
 * This is particularly important when using dangerouslySetInnerHTML.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Standard allowed tags plus some common ones for educational content
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div', 'img',
      'sub', 'sup', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li',
      'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // KaTeX/Math-related tags if they happen to be in the source
      'math', 'annotation', 'semantics', 'mrow', 'msub', 'msup', 'msubsup',
      'mover', 'munder', 'munderover', 'mfrac', 'msqrt', 'mroot', 'mtext',
      'mi', 'mn', 'mo', 'mspace', 'mstyle', 'mtable', 'mtr', 'mtd', 'maction'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'target', 'style',
      'id', 'aria-hidden', 'role'
    ],
  });
};
