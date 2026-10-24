import { Button } from '@/components/ui/button';
import { ArrowUpRight, KeyRound, Terminal } from 'lucide-react';
import Link from 'next/link';
import { HERO_REQUEST_SNIPPETS, HERO_RESPONSE_SNIPPET } from './api-endpoints';
import { API_DOCS, API_KEYS_SETTINGS_PATH, SETTINGS_PATH } from './api-links';
import { CodePanel } from './code-panel';

const HERO_FACTS = [
  { value: '2', label: 'API surfaces' },
  { value: '5', label: 'GET endpoints' },
  { value: '1,000', label: 'requests / day per key' },
] as const;

export function ApiHero() {
  return (
    <section aria-labelledby='api-hero-title' className='relative isolate'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[32rem] bg-[linear-gradient(to_right,rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-24 right-0 -z-10 h-80 w-80 rounded-full bg-red-500/10 blur-3xl dark:bg-red-500/15 lg:right-24'
      />

      <div className='grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14'>
        <div className='min-w-0'>
          <p className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
            <Terminal className='h-3.5 w-3.5' aria-hidden='true' />
            Evento API
          </p>
          <h1
            id='api-hero-title'
            className='mt-3 text-balance text-4xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-5xl'
          >
            Build on top of your events
          </h1>
          <p className='mt-4 max-w-xl text-lg text-gray-600 dark:text-neutral-400'>
            Pull public events, organizer feeds, and RSVP guest lists into your own product — or
            drop events straight into any website with no-auth, CORS-ready embed endpoints.
          </p>

          <div className='mt-7 flex flex-col gap-3 sm:flex-row'>
            <Button asChild size='lg' className='px-6'>
              <a href={API_DOCS.overview} target='_blank' rel='noopener noreferrer'>
                Read the docs
                <ArrowUpRight aria-hidden='true' />
                <span className='sr-only'>(opens in a new tab)</span>
              </a>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='px-6 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            >
              <Link href={API_KEYS_SETTINGS_PATH}>
                <KeyRound aria-hidden='true' />
                Get an API key
              </Link>
            </Button>
          </div>
          <p className='mt-3 text-sm text-gray-500 dark:text-neutral-500'>
            Turn on{' '}
            <span className='font-medium text-gray-700 dark:text-neutral-300'>Developer Mode</span>{' '}
            in{' '}
            <Link
              href={SETTINGS_PATH}
              className='rounded-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 hover:decoration-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-neutral-300 dark:decoration-neutral-600 dark:hover:text-neutral-100'
            >
              Settings → Advanced
            </Link>{' '}
            to keep API keys one tap away.
          </p>

          <dl className='mt-8 grid max-w-lg grid-cols-3 divide-x divide-gray-200 border-y border-gray-200 py-4 dark:divide-neutral-800 dark:border-neutral-800'>
            {HERO_FACTS.map((fact) => (
              <div key={fact.label} className='flex flex-col-reverse gap-0.5 px-3 first:pl-0'>
                <dt className='text-xs text-gray-500 dark:text-neutral-500'>{fact.label}</dt>
                <dd className='text-2xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-neutral-100'>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className='relative min-w-0'>
          <CodePanel snippets={HERO_REQUEST_SNIPPETS} bodyClassName='min-h-[15.5rem]' />
          <CodePanel
            snippets={[HERO_RESPONSE_SNIPPET]}
            caption='Response · excerpt'
            badge={
              <span className='shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-300'>
                200 OK
              </span>
            }
            className='relative mt-4 lg:-mt-3 lg:ml-10 lg:shadow-2xl'
          />
        </div>
      </div>
    </section>
  );
}
