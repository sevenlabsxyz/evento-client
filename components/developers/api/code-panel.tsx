'use client';

import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type CodeLanguage, type CodeTokenKind, highlightCode } from './code-highlight';

export interface CodeSnippet {
  id: string;
  label: string;
  language: CodeLanguage;
  code: string;
}

interface CodePanelProps {
  snippets: CodeSnippet[];
  /** Caption shown in the window chrome when there is a single snippet. */
  caption?: string;
  /** Trailing header content, e.g. a status badge. */
  badge?: ReactNode;
  copyable?: boolean;
  className?: string;
  bodyClassName?: string;
}

const TOKEN_CLASS: Record<CodeTokenKind, string> = {
  plain: 'text-neutral-200',
  keyword: 'text-rose-300',
  function: 'text-sky-300',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  literal: 'text-violet-300',
  property: 'text-sky-300',
  comment: 'italic text-neutral-500',
  command: 'font-semibold text-red-400',
  flag: 'text-amber-300',
  url: 'text-sky-300',
  punctuation: 'text-neutral-500',
};

const COPY_RESET_MS = 2000;

function HighlightedCode({ snippet }: { snippet: CodeSnippet }) {
  const lines = useMemo(
    () => highlightCode(snippet.code, snippet.language),
    [snippet.code, snippet.language]
  );

  return (
    <code className='block min-w-fit'>
      {lines.map((tokens, lineIndex) => (
        <span key={lineIndex} className='block whitespace-pre'>
          {tokens.length === 0
            ? '\u00a0'
            : tokens.map((token, tokenIndex) => (
                <span key={tokenIndex} className={TOKEN_CLASS[token.kind]}>
                  {token.text}
                </span>
              ))}
        </span>
      ))}
    </code>
  );
}

/** Dark, window-chrome code block with optional language tabs and copy-to-clipboard. */
export function CodePanel({
  snippets,
  caption,
  badge,
  copyable = true,
  className,
  bodyClassName,
}: CodePanelProps) {
  const t = useTranslations('developers.api.codePanel');
  const tCommon = useTranslations('common');
  const baseId = useId();
  const [activeId, setActiveId] = useState(snippets[0]?.id);
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const resetTimerRef = useRef<number>();

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  const activeSnippet = snippets.find((snippet) => snippet.id === activeId) ?? snippets[0];
  if (!activeSnippet) return null;

  const hasTabs = snippets.length > 1;
  const panelId = `${baseId}-panel`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet.code);
      setCopied(true);
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      toast.error(t('copyFailedDescription'), t('copyFailedTitle'));
    }
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = snippets.length - 1;
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === null) return;

    event.preventDefault();
    setActiveId(snippets[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl shadow-gray-900/10 dark:shadow-black/30',
        className
      )}
    >
      <div className='flex min-h-11 items-center gap-3 border-b border-neutral-800 bg-neutral-900/70 px-4'>
        <div className='flex shrink-0 gap-1.5' aria-hidden='true'>
          <span className='h-2.5 w-2.5 rounded-full bg-neutral-700' />
          <span className='h-2.5 w-2.5 rounded-full bg-neutral-700' />
          <span className='h-2.5 w-2.5 rounded-full bg-neutral-700' />
        </div>

        {hasTabs ? (
          <div
            role='tablist'
            aria-label={t('codeLanguage')}
            className='scrollbar-hide -my-px flex min-w-0 flex-1 gap-1 overflow-x-auto'
          >
            {snippets.map((snippet, index) => {
              const isActive = snippet.id === activeSnippet.id;
              return (
                <button
                  key={snippet.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type='button'
                  role='tab'
                  id={`${baseId}-tab-${snippet.id}`}
                  aria-selected={isActive}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveId(snippet.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={cn(
                    'whitespace-nowrap border-b-2 px-2.5 py-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500',
                    isActive
                      ? 'border-red-500 text-neutral-100'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  {snippet.label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className='min-w-0 flex-1 truncate font-mono text-xs text-neutral-400'>
            {caption ?? activeSnippet.label}
          </p>
        )}

        {badge}

        {copyable && (
          <button
            type='button'
            onClick={handleCopy}
            aria-label={
              copied ? tCommon('actions.copied') : t('copySnippet', { label: activeSnippet.label })
            }
            className='-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
          >
            {copied ? (
              <Check className='h-4 w-4 text-emerald-400' aria-hidden='true' />
            ) : (
              <Copy className='h-4 w-4' aria-hidden='true' />
            )}
          </button>
        )}
      </div>

      <pre
        id={panelId}
        role={hasTabs ? 'tabpanel' : undefined}
        aria-labelledby={hasTabs ? `${baseId}-tab-${activeSnippet.id}` : undefined}
        tabIndex={0}
        className={cn(
          'overflow-x-auto p-4 font-mono text-[12.5px] leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/60 md:text-[13px]',
          bodyClassName
        )}
      >
        <HighlightedCode snippet={activeSnippet} />
      </pre>
      <span className='sr-only' aria-live='polite'>
        {copied ? t('copiedAnnouncement') : ''}
      </span>
    </div>
  );
}
