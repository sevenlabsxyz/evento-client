'use client';

import { EventDetail } from '@/lib/types/event';
import { sanitizeRichText } from '@/lib/utils/sanitize';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { EventSection } from './event-section';

interface EventDescriptionProps {
  event: EventDetail;
}

export default function EventDescription({ event }: EventDescriptionProps) {
  const t = useTranslations('event');
  const tCommon = useTranslations('common');
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  // Sanitized after mount: DOMPurify can't run during SSR (no window), so raw
  // HTML must never reach dangerouslySetInnerHTML on the server. Empty until
  // the effect below replaces it with the sanitized value.
  const [cleanHtml, setCleanHtml] = useState('');
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCleanHtml(sanitizeRichText(event?.description ?? ''));
  }, [event?.description]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // When collapsed, the container enforces a max-height. Compare scroll vs client height.
      setIsOverflowing(el.scrollHeight > el.clientHeight + 4); // small tolerance
    };

    // Run after mount and on resize (also re-runs when sanitized content lands)
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    window.addEventListener('resize', checkOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [cleanHtml]);

  if (!event.description || event.description === '<p></p>') return null;

  return (
    <EventSection title={t('description.title')}>
      {/* Description with collapsible behavior */}
      <div className='space-y-4'>
        <div className='relative'>
          <div
            ref={contentRef}
            className={
              'prose prose-gray max-w-none overflow-hidden break-words text-[15px] leading-7 text-gray-700 transition-[max-height] duration-300 ease-in-out prose-headings:font-semibold prose-headings:text-gray-900 prose-p:my-3 prose-p:leading-7 prose-a:text-red-600 prose-strong:font-semibold dark:text-neutral-300 dark:prose-headings:text-neutral-100 dark:prose-a:text-red-400 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0' +
              (expanded ? '' : ' max-h-56')
            }
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />

          {/* Fade-out gradient when collapsed and overflowing */}
          {!expanded && isOverflowing && (
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent dark:from-neutral-900' />
          )}
        </div>

        {/* Centered compact Read more button */}
        {!expanded && isOverflowing && (
          <div className='flex justify-center'>
            <Button
              type='button'
              variant={'outline'}
              onClick={() => setExpanded(true)}
              className='h-10 w-full rounded-xl bg-gray-50 dark:bg-neutral-800'
            >
              {tCommon('actions.readMore')}
            </Button>
          </div>
        )}

        {/* Optional collapse action when expanded */}
        {expanded && (
          <div className='flex justify-center'>
            <Button
              type='button'
              variant={'outline'}
              onClick={() => setExpanded(false)}
              className='h-10 w-full rounded-xl bg-gray-50 dark:bg-neutral-800'
            >
              {tCommon('actions.showLess')}
            </Button>
          </div>
        )}
      </div>
    </EventSection>
  );
}
