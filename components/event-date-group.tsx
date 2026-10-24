'use client';

import { EventWithUser } from '@/lib/types/api';
import { format, Locale, parseISO } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { EventCompactItem } from './event-compact-item';

const HEADER_FORMATS: Record<string, { locale: Locale; pattern: string }> = {
  en: { locale: enUS, pattern: 'EEEE, MMMM do' },
  'pt-BR': { locale: ptBR, pattern: "EEEE, d 'de' MMMM" },
  es: { locale: es, pattern: "EEEE, d 'de' MMMM" },
};

interface EventDateGroupProps {
  date: string; // ISO date string for the day
  events: EventWithUser[];
  onBookmark?: (eventId: string) => void;
  bookmarkedEvents?: Set<string>;
}

export function EventDateGroup({
  date,
  events,
  onBookmark,
  bookmarkedEvents = new Set(),
}: EventDateGroupProps) {
  const appLocale = useLocale();
  // Format the date header (e.g., "Tuesday, September 2nd")
  const headerFormat = HEADER_FORMATS[appLocale] ?? HEADER_FORMATS.en;
  const formattedDate = format(parseISO(date), headerFormat.pattern, {
    locale: headerFormat.locale,
  });

  return (
    <div className='mb-5'>
      {/* Date header */}
      <div className='mb-2 px-2'>
        <h2 className='font-medium text-gray-900 dark:text-neutral-100'>{formattedDate}</h2>
      </div>

      {/* Events list for this date */}
      <div className='rounded-lg bg-white p-1 shadow-sm dark:bg-neutral-900 dark:shadow-none dark:ring-1 dark:ring-neutral-800'>
        {events.map((event) => (
          <EventCompactItem
            key={event.id}
            event={event}
            onBookmark={onBookmark}
            isBookmarked={bookmarkedEvents.has(event.id)}
          />
        ))}
      </div>
    </div>
  );
}
