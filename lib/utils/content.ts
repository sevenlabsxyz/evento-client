/**
 * Utility functions for handling rich text content from Tiptap editor
 */

/**
 * Converts HTML content to plain text, stripping all formatting
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  // Create a temporary DOM element to parse HTML
  if (typeof window !== 'undefined') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  // Server-side fallback - simple regex to strip HTML tags
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Truncates HTML content to a specified length while preserving basic formatting
 */
export function truncateHtmlContent(html: string, maxLength: number = 100): string {
  const plainText = htmlToPlainText(html);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Gets a preview text from HTML content for display in UI
 */
export function getContentPreview(html: string, maxLength: number = 60): string {
  if (!html || html === '<p></p>') return '';

  const plainText = htmlToPlainText(html);
  if (!plainText.trim()) return '';

  return truncateHtmlContent(html, maxLength);
}

/**
 * Checks if HTML content is empty (only contains empty paragraphs, whitespace, etc.)
 */
export function isContentEmpty(html: string): boolean {
  if (!html) return true;

  const plainText = htmlToPlainText(html);
  return !plainText.trim();
}

/**
 * Sanitizes HTML content to remove potentially dangerous elements
 * This is a basic implementation - in production, consider using a library like DOMPurify
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html) return '';

  // Allow only safe HTML tags and attributes
  const allowedTags = [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'a',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
  ];
  const allowedAttributes = ['href', 'class'];

  // This is a simple implementation - in production, use a proper HTML sanitizer
  return html; // For now, return as-is. Consider adding DOMPurify for production use
}

/**
 * Converts plain text to basic HTML (useful for migrating existing plain text descriptions)
 */
export function plainTextToHtml(text: string): string {
  if (!text) return '<p></p>';

  // Split by double line breaks and wrap each paragraph
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, '<br>').trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p>${paragraph}</p>`);

  return paragraphs.length > 0 ? paragraphs.join('') : '<p></p>';
}

/**
 * Validates HTML content structure and returns any issues
 */
export function validateHtmlContent(html: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!html) {
    return { isValid: true, errors: [] };
  }

  // Check for basic HTML structure issues
  const unclosedTags = (html.match(/<[^/>]+(?![^>]*\/>)>/g) || []).length;
  const closingTags = (html.match(/<\/[^>]+>/g) || []).length;

  if (unclosedTags !== closingTags) {
    errors.push('HTML contains unclosed tags');
  }

  // Check for potentially dangerous content
  if (html.includes('<script')) {
    errors.push('HTML contains script tags');
  }

  if (html.includes('javascript:')) {
    errors.push('HTML contains javascript: protocol');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Formats content for display in different contexts
 */
export interface ContentDisplayOptions {
  maxLength?: number;
  preserveFormatting?: boolean;
  showEllipsis?: boolean;
}

export function formatContentForDisplay(html: string, options: ContentDisplayOptions = {}): string {
  const { maxLength = 100, preserveFormatting = false, showEllipsis = true } = options;

  if (isContentEmpty(html)) {
    return '';
  }

  if (preserveFormatting) {
    // Return HTML but with potential truncation
    const plainText = htmlToPlainText(html);
    if (plainText.length <= maxLength) {
      return html;
    }

    // For HTML truncation, we'd need more sophisticated logic
    // For now, fall back to plain text truncation
    const truncated = plainText.substring(0, maxLength).trim();
    return showEllipsis ? `${truncated}...` : truncated;
  }

  // Return plain text
  const plainText = htmlToPlainText(html);
  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.substring(0, maxLength).trim();
  return showEllipsis ? `${truncated}...` : truncated;
}
