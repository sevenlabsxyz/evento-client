import DOMPurify from 'dompurify';

/**
 * Isomorphic rich-text HTML sanitizer.
 *
 * DOMPurify needs a real DOM to work. On the server (SSR of client
 * components) it silently returns the dirty input unchanged, so unsanitized
 * HTML could reach innerHTML / dangerouslySetInnerHTML on first paint.
 *
 * This wrapper fails closed instead: without a `window` it returns an empty
 * string and never leaks raw HTML. Callers follow the "sanitized after
 * mount" pattern — they render an empty container during SSR/hydration and
 * only set innerHTML / dangerouslySetInnerHTML with the sanitized value from
 * a useEffect, so the browser path (real DOMPurify) is the only one that
 * ever produces markup. No extra dependency (no jsdom) is required.
 */

/** Tiptap-compatible element allowlist. Everything else is stripped. */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'pre',
  'img',
  'span',
  'div',
];

/** Tiptap-compatible attribute allowlist. Everything else is stripped. */
const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'class', 'title'];

let hooksRegistered = false;

function registerHooks(): void {
  if (hooksRegistered) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Harden every new-tab anchor against reverse tabnabbing.
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  hooksRegistered = true;
}

/**
 * Sanitize untrusted rich-text HTML (Ghost CMS articles, event descriptions,
 * email blast messages) down to the allowlist above.
 *
 * Returns '' on the server or for empty input (fail closed); components
 * render the result only after mount.
 */
export function sanitizeRichText(html: string): string {
  if (typeof window === 'undefined' || !html) {
    return '';
  }

  registerHooks();
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/**
 * Ghost CMS articles additionally use structural elements (captioned figures,
 * dividers, tables). Still no scripts, styles, iframes, forms, or event
 * handler attributes.
 */
const ARTICLE_ALLOWED_TAGS = [
  ...ALLOWED_TAGS,
  'h5',
  'h6',
  'figure',
  'figcaption',
  'hr',
  'mark',
  'sup',
  'sub',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

/** Sanitize first-party Ghost article HTML. Same fail-closed contract as sanitizeRichText. */
export function sanitizeArticleHtml(html: string): string {
  if (typeof window === 'undefined' || !html) {
    return '';
  }

  registerHooks();
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS, ALLOWED_ATTR });
}
