import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Compass,
  type LucideIcon,
  PanelsTopLeft,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { API_DOCS } from './api-links';
import { ApiSectionHeader, DocsTextLink } from './api-primitives';

interface UseCase {
  /** Title and description live under `developers.api.useCases.items.<key>`. */
  key: 'discovery' | 'widgets' | 'detailViews' | 'community' | 'profiles' | 'sync';
  icon: LucideIcon;
  tint: string;
  endpoints: string[];
  href: string;
}

/** Patterns described in the Use cases guide and the endpoint reference pages. */
const USE_CASES: UseCase[] = [
  {
    key: 'discovery',
    icon: Compass,
    tint: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    endpoints: ['/events/{eventId}', '/users/{username}/events'],
    href: API_DOCS.useCases,
  },
  {
    key: 'widgets',
    icon: CalendarDays,
    tint: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
    endpoints: ['Embed API'],
    href: API_DOCS.reactComponents,
  },
  {
    key: 'detailViews',
    icon: PanelsTopLeft,
    tint: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    endpoints: ['/events/{eventId}'],
    href: API_DOCS.fetchEvent,
  },
  {
    key: 'community',
    icon: ChartColumn,
    tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    endpoints: ['/events/{eventId}/guests'],
    href: API_DOCS.useCases,
  },
  {
    key: 'profiles',
    icon: UserRound,
    tint: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    endpoints: ['/users/{username}/events'],
    href: API_DOCS.fetchUserEvents,
  },
  {
    key: 'sync',
    icon: RefreshCw,
    tint: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    endpoints: ['/users/{username}/events', '/events/{eventId}'],
    href: API_DOCS.fetchUserEvents,
  },
];

export function ApiUseCases() {
  const t = useTranslations('developers.api');

  return (
    <section aria-labelledby='api-use-cases-title' className='space-y-8'>
      <ApiSectionHeader
        id='api-use-cases-title'
        eyebrow={t('useCases.eyebrow')}
        title={t('useCases.title')}
        description={t('useCases.description')}
        action={<DocsTextLink href={API_DOCS.examples}>{t('useCases.codeExamples')}</DocsTextLink>}
      />

      <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {USE_CASES.map((useCase) => {
          const Icon = useCase.icon;
          return (
            <li key={useCase.key}>
              <a
                href={useCase.href}
                target='_blank'
                rel='noopener noreferrer'
                className='group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 motion-safe:hover:-translate-y-0.5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:shadow-none'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      useCase.tint
                    )}
                  >
                    <Icon className='h-5 w-5' aria-hidden='true' />
                  </div>
                  <ArrowUpRight
                    className='h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-600 dark:text-neutral-600 dark:group-hover:text-neutral-300'
                    aria-hidden='true'
                  />
                </div>
                <h3 className='mt-4 font-semibold text-gray-900 dark:text-neutral-100'>
                  {t(`useCases.items.${useCase.key}.title`)}
                </h3>
                <p className='mt-1.5 flex-1 text-sm leading-6 text-gray-600 dark:text-neutral-400'>
                  {t(`useCases.items.${useCase.key}.description`)}
                </p>
                <div className='mt-4 flex flex-wrap gap-1.5'>
                  {useCase.endpoints.map((endpoint) => (
                    <span
                      key={endpoint}
                      className='rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
                    >
                      {endpoint}
                    </span>
                  ))}
                </div>
                <span className='sr-only'>{t('opensInNewTab')}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
