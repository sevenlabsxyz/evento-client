'use client';

import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-message';
import { toast } from '@/lib/utils/toast';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const COPIED_RESET_MS = 2000;

interface McpCopyButtonProps {
  value: string;
  /** Names what was copied, e.g. "Claude Desktop config"; used for the label and toast. */
  label: string;
  className?: string;
}

export function McpCopyButton({ value, label, className }: McpCopyButtonProps) {
  const t = useTranslations('developers.copy');
  const tCommon = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimerRef.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t('copiedToClipboard', { label }), tCommon('actions.copied'));
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (error) {
      toast.error(getErrorMessage(error), t('copyFailed'));
    }
  };

  return (
    <button
      type='button'
      onClick={handleCopy}
      aria-label={copied ? t('copiedAria', { label }) : t('copyAria', { label })}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-neutral-300 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
        className
      )}
    >
      {copied ? (
        <Check className='h-3.5 w-3.5 text-emerald-400' aria-hidden='true' />
      ) : (
        <Copy className='h-3.5 w-3.5' aria-hidden='true' />
      )}
      <span>{copied ? tCommon('actions.copied') : tCommon('actions.copy')}</span>
    </button>
  );
}
