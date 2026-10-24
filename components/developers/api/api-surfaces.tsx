import { cn } from '@/lib/utils';
import { Check, Globe, KeyRound, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { API_DOCS, EMBED_API_BASE_URL, PUBLIC_API_BASE_URL } from './api-links';
import { ApiSectionHeader, DocsTextLink, InlineCode } from './api-primitives';
import { CodePanel, type CodeSnippet } from './code-panel';

type SurfaceKey = 'public' | 'embed';

/** Keys under `developers.api.surfaces.<id>.points`. */
const SURFACE_POINT_KEYS = ['p1', 'p2', 'p3', 'p4'] as const;

interface SurfaceCard {
  /** Name, tagline, badge, points, captions and link labels live under `developers.api.surfaces.<id>`. */
  id: SurfaceKey;
  icon: LucideIcon;
  iconClassName: string;
  badgeClassName: string;
  baseUrl: string;
  snippet: CodeSnippet;
  links: { key: 'overview' | 'secondary'; href: string }[];
}

const SURFACES: SurfaceCard[] = [
  {
    id: 'public',
    icon: KeyRound,
    iconClassName: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    badgeClassName:
      'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-400/20',
    baseUrl: PUBLIC_API_BASE_URL,
    snippet: {
      id: 'public-headers',
      label: 'Request headers',
      language: 'http',
      code: 'x-evento-api-key: YOUR_API_KEY',
    },
    links: [
      { key: 'overview', href: API_DOCS.publicOverview },
      { key: 'secondary', href: API_DOCS.authentication },
    ],
  },
  {
    id: 'embed',
    icon: Globe,
    iconClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
    badgeClassName:
      'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-400/20',
    baseUrl: EMBED_API_BASE_URL,
    snippet: {
      id: 'embed-cors',
      label: 'CORS headers',
      language: 'http',
      code: `Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type`,
    },
    links: [
      { key: 'overview', href: API_DOCS.embedOverview },
      { key: 'secondary', href: API_DOCS.reactComponents },
    ],
  },
];

export function ApiSurfaces() {
  const t = useTranslations('developers.api.surfaces');

  return (
    <section aria-labelledby='api-surfaces-title' className='space-y-8'>
      <ApiSectionHeader
        id='api-surfaces-title'
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <div className='grid gap-4 lg:grid-cols-2 lg:gap-6'>
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <article
              key={surface.id}
              aria-labelledby={`api-surface-${surface.id}`}
              className='flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none md:p-6'
            >
              <div className='flex items-start justify-between gap-4'>
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    surface.iconClassName
                  )}
                >
                  <Icon className='h-5 w-5' aria-hidden='true' />
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                    surface.badgeClassName
                  )}
                >
                  {t(`${surface.id}.badge`)}
                </span>
              </div>

              <h3
                id={`api-surface-${surface.id}`}
                className='mt-4 text-xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100'
              >
                {t(`${surface.id}.name`)}
              </h3>
              <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
                {t(`${surface.id}.tagline`)}
              </p>

              <p className='mt-4 truncate rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'>
                <span className='sr-only'>{t('baseUrl')} </span>
                {surface.baseUrl}
              </p>

              <ul className='mt-5 space-y-3'>
                {SURFACE_POINT_KEYS.map((pointKey) => (
                  <li
                    key={pointKey}
                    className='flex gap-3 text-sm leading-6 text-gray-700 dark:text-neutral-300'
                  >
                    <Check
                      className='mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                      aria-hidden='true'
                    />
                    <span className='min-w-0'>
                      {t.rich(`${surface.id}.points.${pointKey}`, {
                        code: (chunks) => <InlineCode>{chunks}</InlineCode>,
                      })}
                    </span>
                  </li>
                ))}
              </ul>

              <CodePanel
                snippets={[{ ...surface.snippet, label: t(`${surface.id}.snippetLabel`) }]}
                caption={t(`${surface.id}.snippetCaption`)}
                className='mt-5 shadow-none dark:shadow-none'
                bodyClassName='py-3'
              />

              <div className='mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-5'>
                {surface.links.map((link) => (
                  <DocsTextLink key={link.href} href={link.href}>
                    {t(`${surface.id}.links.${link.key}`)}
                  </DocsTextLink>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
