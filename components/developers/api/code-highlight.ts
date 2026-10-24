export type CodeLanguage = 'bash' | 'javascript' | 'python' | 'json' | 'http';

export type CodeTokenKind =
  | 'plain'
  | 'keyword'
  | 'function'
  | 'string'
  | 'number'
  | 'literal'
  | 'property'
  | 'comment'
  | 'command'
  | 'flag'
  | 'url'
  | 'punctuation';

export interface CodeToken {
  kind: CodeTokenKind;
  text: string;
}

type TokenRule = readonly [pattern: RegExp, kind: CodeTokenKind];

const DOUBLE_QUOTED = /"(?:[^"\\]|\\.)*"/y;
const NUMBER = /-?\d+(?:\.\d+)?/y;

/**
 * Ordered sticky rules per language; the first rule matching at the cursor wins.
 * Identifier rules emit `plain` so keywords never match inside longer words.
 */
const LANGUAGE_RULES: Record<CodeLanguage, readonly TokenRule[]> = {
  json: [
    [/"(?:[^"\\]|\\.)*"(?=\s*:)/y, 'property'],
    [DOUBLE_QUOTED, 'string'],
    [NUMBER, 'number'],
    [/\b(?:true|false|null)\b/y, 'literal'],
    [/[{}[\],:]/y, 'punctuation'],
  ],
  bash: [
    [/\bcurl\b/y, 'command'],
    [DOUBLE_QUOTED, 'string'],
    [/https?:\/\/[^\s"\\]+/y, 'url'],
    [/-{1,2}[A-Za-z][\w-]*/y, 'flag'],
    [/[A-Za-z_][\w-]*/y, 'plain'],
    [/\\/y, 'punctuation'],
  ],
  javascript: [
    [/\/\/.*/y, 'comment'],
    [/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/y, 'string'],
    [
      /\b(?:const|let|await|async|function|return|new|import|from|export|if|for|while|of)\b/y,
      'keyword',
    ],
    [/\b(?:true|false|null|undefined)\b/y, 'literal'],
    [/[A-Za-z_$][\w$]*(?=\()/y, 'function'],
    [/[A-Za-z_$][\w$]*/y, 'plain'],
    [/\d+(?:\.\d+)?/y, 'number'],
    [/[{}()[\],;.:]/y, 'punctuation'],
  ],
  python: [
    [/#.*/y, 'comment'],
    [/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/y, 'string'],
    [/\b(?:import|from|def|return|for|in|if|while|with|as)\b/y, 'keyword'],
    [/\b(?:True|False|None)\b/y, 'literal'],
    [/[A-Za-z_]\w*(?=\()/y, 'function'],
    [/[A-Za-z_]\w*/y, 'plain'],
    [/\d+(?:\.\d+)?/y, 'number'],
    [/[{}()[\],.:]/y, 'punctuation'],
  ],
  http: [
    [/^[A-Za-z][\w-]*(?=:)/y, 'property'],
    [/:\s*/y, 'punctuation'],
    [/.+/y, 'string'],
  ],
};

function tokenizeLine(line: string, rules: readonly TokenRule[]): CodeToken[] {
  const tokens: CodeToken[] = [];
  let plain = '';
  let cursor = 0;

  const flushPlain = () => {
    if (plain) {
      tokens.push({ kind: 'plain', text: plain });
      plain = '';
    }
  };

  while (cursor < line.length) {
    let matched = false;

    for (const [pattern, kind] of rules) {
      pattern.lastIndex = cursor;
      const match = pattern.exec(line);
      if (!match || match[0].length === 0) continue;

      if (kind === 'plain') {
        plain += match[0];
      } else {
        flushPlain();
        tokens.push({ kind, text: match[0] });
      }
      cursor += match[0].length;
      matched = true;
      break;
    }

    if (!matched) {
      plain += line[cursor];
      cursor += 1;
    }
  }

  flushPlain();
  return tokens;
}

/** Splits a snippet into lines of syntax tokens for lightweight, dependency-free highlighting. */
export function highlightCode(code: string, language: CodeLanguage): CodeToken[][] {
  const rules = LANGUAGE_RULES[language];
  return code.split('\n').map((line) => tokenizeLine(line, rules));
}
