import { cn } from '@/lib/utils';
import { Check, Globe, KeyRound, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { API_DOCS, EMBED_API_BASE_URL, PUBLIC_API_BASE_URL } from './api-links';
import { ApiSectionHeader, DocsTextLink, InlineCode } from './api-primitives';
import { CodePanel, type CodeSnippet } from './code-panel';

interface SurfaceCard {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  iconClassName: string;
  badge: string;
  badgeClassName: string;
  baseUrl: string;
  points: ReactNode[];
  snippet: CodeSnippet;
  snippetCaption: string;
  links: { label: string; href: string }[];
}

const SURFACES: SurfaceCard[] = [
  {
    id: 'public',
    name: 'Public API',
    tagline: 'Read-only event and user data for third-party server integrations.',
    icon: KeyRound,
    iconClassName: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    badge: 'API key',
    badgeClassName:
      'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-400/20',
    baseUrl: PUBLIC_API_BASE_URL,
    points: [
      <>
        Authenticated with Unkey API keys via <InlineCode>x-evento-api-key</InlineCode> or{' '}
        <InlineCode>Authorization: Bearer</InlineCode>
      </>,
      'Rich payloads with creator metadata, links, contributions, and pagination',
      'Event details, organizer event lists, and RSVP guest lists',
      'Keep keyed requests server-side — never ship a key in client-side JavaScript',
    ],
    snippet: {
      id: 'public-headers',
      label: 'Request headers',
      language: 'http',
      code: 'x-evento-api-key: YOUR_API_KEY',
    },
    snippetCaption: 'Request header',
    links: [
      { label: 'Public API overview', href: API_DOCS.publicOverview },
      { label: 'Authentication', href: API_DOCS.authentication },
    ],
  },
  {
    id: 'embed',
    name: 'Embed API',
    tagline: 'No-auth, CORS-friendly responses for widgets and client-side embeds.',
    icon: Globe,
    iconClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
    badge: 'No auth · CORS',
    badgeClassName:
      'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-400/20',
    baseUrl: EMBED_API_BASE_URL,
    points: [
      'No API key required — safe for client-side rendering',
      <>
        Cross-origin access for <InlineCode>GET</InlineCode> and <InlineCode>OPTIONS</InlineCode>
      </>,
      <>
        Lean payloads with a computed <InlineCode>status</InlineCode>: upcoming, ongoing, or past
      </>,
      <>
        Pairs with the <InlineCode>evento-embed-react</InlineCode> event card, list, and calendar
        components
      </>,
    ],
    snippet: {
      id: 'embed-cors',
      label: 'CORS headers',
      language: 'http',
      code: `Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type`,
    },
    snippetCaption: 'Response headers',
    links: [
      { label: 'Embed API overview', href: API_DOCS.embedOverview },
      { label: 'React components', href: API_DOCS.reactComponents },
    ],
  },
];

export function ApiSurfaces() {
  return (
    <section aria-labelledby='api-surfaces-title' className='space-y-8'>
      <ApiSectionHeader
        id='api-surfaces-title'
        eyebrow='Two surfaces'
        title='Pick the right API for the job'
        description='Use the Public API from your backend for rich data, and the Embed API straight from the browser for widgets.'
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
                  {surface.badge}
                </span>
              </div>

              <h3
                id={`api-surface-${surface.id}`}
                className='mt-4 text-xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100'
              >
                {surface.name}
              </h3>
              <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>{surface.tagline}</p>

              <p className='mt-4 truncate rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'>
                <span className='sr-only'>Base URL: </span>
                {surface.baseUrl}
              </p>

              <ul className='mt-5 space-y-3'>
                {surface.points.map((point, index) => (
                  <li
                    key={index}
                    className='flex gap-3 text-sm leading-6 text-gray-700 dark:text-neutral-300'
                  >
                    <Check
                      className='mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400'
                      aria-hidden='true'
                    />
                    <span className='min-w-0'>{point}</span>
                  </li>
                ))}
              </ul>

              <CodePanel
                snippets={[surface.snippet]}
                caption={surface.snippetCaption}
                className='mt-5 shadow-none dark:shadow-none'
                bodyClassName='py-3'
              />

              <div className='mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-5'>
                {surface.links.map((link) => (
                  <DocsTextLink key={link.href} href={link.href}>
                    {link.label}
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
