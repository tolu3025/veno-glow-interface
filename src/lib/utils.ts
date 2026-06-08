import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * @param html The unsanitized HTML string.
 * @returns The sanitized HTML string.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
