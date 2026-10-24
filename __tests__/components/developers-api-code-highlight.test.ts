import { type CodeToken, highlightCode } from '@/components/developers/api/code-highlight';

const kindsOf = (line: CodeToken[]) =>
  line.filter((token) => token.kind !== 'plain').map((token) => [token.kind, token.text]);

describe('highlightCode', () => {
  it('preserves the original text of every line', () => {
    const code = 'curl https://evento.so/api/embed/v1/events/evt_abc123 \\\n  -H "x: y"';
    const lines = highlightCode(code, 'bash');

    expect(lines.map((line) => line.map((token) => token.text).join(''))).toEqual(code.split('\n'));
  });

  it('highlights curl commands, urls, flags, and strings', () => {
    const [first, second] = highlightCode(
      'curl https://evento.so/api/public/v1/events/evt_abc123 \\\n  -H "x-evento-api-key: YOUR_API_KEY"',
      'bash'
    );

    expect(kindsOf(first)).toEqual([
      ['command', 'curl'],
      ['url', 'https://evento.so/api/public/v1/events/evt_abc123'],
      ['punctuation', '\\'],
    ]);
    expect(kindsOf(second)).toEqual([
      ['flag', '-H'],
      ['string', '"x-evento-api-key: YOUR_API_KEY"'],
    ]);
  });

  it('distinguishes JSON keys from string values', () => {
    const [line] = highlightCode('"message": "a: b", "ok": true, "n": -1.5', 'json');

    expect(kindsOf(line)).toEqual([
      ['property', '"message"'],
      ['punctuation', ':'],
      ['string', '"a: b"'],
      ['punctuation', ','],
      ['property', '"ok"'],
      ['punctuation', ':'],
      ['literal', 'true'],
      ['punctuation', ','],
      ['property', '"n"'],
      ['punctuation', ':'],
      ['number', '-1.5'],
    ]);
  });

  it('does not match keywords inside longer identifiers', () => {
    const [line] = highlightCode('const constant = await fetch(url);', 'javascript');

    expect(kindsOf(line)).toEqual([
      ['keyword', 'const'],
      ['keyword', 'await'],
      ['function', 'fetch'],
      ['punctuation', '('],
      ['punctuation', ')'],
      ['punctuation', ';'],
    ]);
  });

  it('splits HTTP headers into name and value', () => {
    const [line] = highlightCode('X-RateLimit-Limit: 1000', 'http');

    expect(kindsOf(line)).toEqual([
      ['property', 'X-RateLimit-Limit'],
      ['punctuation', ': '],
      ['string', '1000'],
    ]);
  });
});
