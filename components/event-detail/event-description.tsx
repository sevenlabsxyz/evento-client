'use client';

import { Event } from '@/lib/types/event';
import { useEffect, useRef, useState } from 'react';

interface EventDescriptionProps {
  event: Event;
}

export default function EventDescription({ event }: EventDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      // When collapsed, the container enforces a max-height. Compare scroll vs client height.
      setIsOverflowing(el.scrollHeight > el.clientHeight + 4); // small tolerance
    };

    // Run after mount and on resize
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    window.addEventListener('resize', checkOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [event?.description]);

  if (!event.description || event.description === '<p></p>') return null;

  return (
    <div className='border-t border-gray-100 py-6'>
      <h2 className='mb-4 text-lg font-semibold text-gray-900'>About Event</h2>

      {/* Description with collapsible behavior */}
      <div className='space-y-4 leading-relaxed text-gray-700'>
        <div className='relative'>
          <div
            ref={contentRef}
            className={
              'prose prose-gray max-w-none overflow-hidden break-words transition-[max-height] duration-300 ease-in-out' +
              (expanded ? '' : ' max-h-56')
            }
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: event.description }}
          />

          {/* Fade-out gradient when collapsed and overflowing */}
          {!expanded && isOverflowing && (
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent' />
          )}
        </div>

        {/* Centered compact Read more button */}
        {!expanded && isOverflowing && (
          <div className='flex justify-center'>
            <button
              type='button'
              onClick={() => setExpanded(true)}
              className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200'
            >
              Read more
            </button>
          </div>
        )}

        {/* Optional collapse action when expanded */}
        {expanded && (
          <div className='flex justify-center'>
            <button
              type='button'
              onClick={() => setExpanded(false)}
              className='rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200'
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
