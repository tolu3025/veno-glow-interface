import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Uses a whitelist of allowed tags and attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
      "img", "code", "pre", "blockquote", "hr"
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "style", "target"],
  });
}
