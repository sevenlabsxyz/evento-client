/**
 * Security regression tests for the URL-sink and rich-text sanitization
 * helpers added in the 2026-10 security audit.
 *
 * jsdom provides the window/DOM that DOMPurify requires (the same setup the
 * wallet-storage tests use for Node webcrypto), so the client-side
 * sanitizeRichText path is exercised here for real.
 */
import { sanitizeArticleHtml, sanitizeRichText } from '@/lib/utils/sanitize';
import { safeExternalUrl } from '@/lib/utils/url';

describe('safeExternalUrl (URL-sink hardening)', () => {
  it('passes through http/https URLs', () => {
    expect(safeExternalUrl('https://evento.so')).toBe('https://evento.so');
    expect(safeExternalUrl('http://example.com/page?a=1')).toBe('http://example.com/page?a=1');
  });

  it('blocks javascript: and data: URLs', () => {
    expect(safeExternalUrl('javascript:alert(document.cookie)')).toBe('#');
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('blocks other non-http schemes and unparseable values', () => {
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBe('#');
    expect(safeExternalUrl(undefined as unknown as string)).toBe('#');
    expect(safeExternalUrl('not a url')).toBe('#');
  });

  it('returns # for null/undefined/empty', () => {
    expect(safeExternalUrl(null)).toBe('#');
    expect(safeExternalUrl(undefined)).toBe('#');
    expect(safeExternalUrl('')).toBe('#');
  });
});

describe('sanitizeRichText (XSS allowlist sanitization)', () => {
  it('strips event handler attributes', () => {
    const clean = sanitizeRichText('<img src="x.png" onerror="alert(1)">');
    expect(clean).toContain('x.png');
    expect(clean).not.toContain('onerror');
  });

  it('strips script tags and javascript: URLs', () => {
    expect(sanitizeRichText('<script>alert(1)</script><p>hi</p>')).toBe('<p>hi</p>');
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('keeps the Tiptap-allowed tag/attribute set', () => {
    const html =
      '<p class="a">x</p><strong>y</strong><em>z</em><ul><li>1</li></ul><h2>t</h2><img src="s.png" alt="a">';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it('keeps safe anchors and hrefs', () => {
    expect(sanitizeRichText('<a href="https://evento.com">e</a>')).toBe(
      '<a href="https://evento.com">e</a>'
    );
  });

  it('returns empty string for empty/null input', () => {
    expect(sanitizeRichText('')).toBe('');
    expect(sanitizeRichText(null as unknown as string)).toBe('');
  });
});

describe('sanitizeArticleHtml (Ghost article allowlist)', () => {
  it('keeps captioned figures, dividers and tables', () => {
    const html =
      '<figure><img src="a.png" alt="a"><figcaption>Caption</figcaption></figure><hr><table><tbody><tr><td>1</td></tr></tbody></table>';
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it('still strips scripts, iframes and handlers', () => {
    const clean = sanitizeArticleHtml(
      '<figure onclick="alert(1)"><iframe src="https://x"></iframe><script>alert(1)</script></figure>'
    );
    expect(clean).toBe('<figure></figure>');
  });

  it('does not widen the user rich-text allowlist', () => {
    expect(sanitizeRichText('<figure><figcaption>c</figcaption></figure><hr>')).toBe('c');
  });
});
