import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

import { McpCopyButton } from './mcp-copy-button';

export type McpCodeLanguage = 'json' | 'bash';

const JSON_STRING_PATTERN = /("(?:[^"\\]|\\.)*")(\s*:)?/g;
const BASH_LINE_PATTERN = /^((?:[A-Z_]+=\S+\s+)*)(\S+)(.*)$/;

function highlightJson(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of code.matchAll(JSON_STRING_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(code.slice(cursor, index));
    const isKey = Boolean(match[2]);
    nodes.push(
      <span key={index} className={isKey ? 'text-sky-300' : 'text-emerald-300'}>
        {match[1]}
      </span>
    );
    if (match[2]) nodes.push(match[2]);
    cursor = index + match[0].length;
  }

  if (cursor < code.length) nodes.push(code.slice(cursor));
  return nodes;
}

function highlightBash(code: string): ReactNode[] {
  return code.split('\n').map((line, lineIndex) => {
    const match = BASH_LINE_PATTERN.exec(line);
    return (
      <span key={lineIndex} className='block'>
        <span className='select-none text-neutral-600'>$ </span>
        {match ? (
          <>
            {match[1] && <span className='text-amber-300'>{match[1]}</span>}
            <span className='text-sky-300'>{match[2]}</span>
            {match[3]}
          </>
        ) : (
          line
        )}
      </span>
    );
  });
}

interface McpCodeBlockProps {
  code: string;
  language: McpCodeLanguage;
  /** Shown in the panel header, e.g. a filename or "Terminal". */
  title: string;
  /** Names the snippet for the copy button label and toast. */
  copyLabel: string;
  className?: string;
}

export function McpCodeBlock({ code, language, title, copyLabel, className }: McpCodeBlockProps) {
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-sm dark:shadow-none',
        className
      )}
    >
      <figcaption className='flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='flex shrink-0 gap-1.5' aria-hidden='true'>
            <span className='h-2.5 w-2.5 rounded-full bg-neutral-700' />
            <span className='h-2.5 w-2.5 rounded-full bg-neutral-700' />
            <span className='h-2.5 w-2.5 rounded-full bg-neutral-700' />
          </span>
          <span className='truncate font-mono text-xs text-neutral-400'>{title}</span>
        </div>
        <McpCopyButton value={code} label={copyLabel} />
      </figcaption>
      <pre className='overflow-x-auto p-4 text-[13px] leading-relaxed text-neutral-200'>
        <code className='font-mono'>
          {language === 'json' ? highlightJson(code) : highlightBash(code)}
        </code>
      </pre>
    </figure>
  );
}
