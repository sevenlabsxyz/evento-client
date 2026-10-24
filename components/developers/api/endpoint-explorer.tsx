'use client';

import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { type KeyboardEvent, useId, useRef, useState } from 'react';
import {
  API_ENDPOINTS,
  API_SURFACE_BASE_URL,
  API_SURFACE_LABEL,
  type ApiEndpoint,
  type ApiSurface,
} from './api-endpoints';
import { API_DOCS } from './api-links';
import { ApiSectionHeader, DocsTextLink } from './api-primitives';
import { CodePanel } from './code-panel';

const SURFACE_TAG_CLASS: Record<ApiSurface, string> = {
  public: 'text-red-600 dark:text-red-400',
  embed: 'text-sky-600 dark:text-sky-400',
};

function MethodBadge({ method }: { method: ApiEndpoint['method'] }) {
  return (
    <span className='rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-400/20'>
      {method}
    </span>
  );
}

function EndpointDetails({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none md:p-6'>
      <div className='flex flex-wrap items-center gap-2'>
        <MethodBadge method={endpoint.method} />
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wider',
            SURFACE_TAG_CLASS[endpoint.surface]
          )}
        >
          {API_SURFACE_LABEL[endpoint.surface]}
        </span>
      </div>
      <h3 className='mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100'>
        {endpoint.title}
      </h3>
      <p className='mt-2 break-all font-mono text-sm'>
        <span className='text-gray-400 dark:text-neutral-500'>
          {API_SURFACE_BASE_URL[endpoint.surface]}
        </span>
        <span className='font-medium text-gray-900 dark:text-neutral-100'>{endpoint.path}</span>
      </p>
      <p className='mt-3 text-sm leading-6 text-gray-600 dark:text-neutral-400'>
        {endpoint.description}
      </p>

      <h4 className='mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500'>
        Parameters
      </h4>
      <dl className='mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800'>
        {endpoint.params.map((param) => (
          <div
            key={param.name}
            className='flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4'
          >
            <dt className='flex shrink-0 flex-wrap items-center gap-2 sm:w-52'>
              <code className='font-mono text-sm font-medium text-gray-900 dark:text-neutral-100'>
                {param.name}
              </code>
              <span className='text-xs text-gray-500 dark:text-neutral-500'>
                {param.location} · {param.type}
              </span>
              {param.required && (
                <span className='rounded-full bg-red-50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950/60 dark:text-red-300'>
                  Required
                </span>
              )}
            </dt>
            <dd className='text-sm text-gray-600 dark:text-neutral-400'>{param.description}</dd>
          </div>
        ))}
      </dl>

      {endpoint.note && (
        <p className='mt-4 flex gap-2.5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-neutral-800 dark:text-neutral-300'>
          <Info
            className='mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-neutral-500'
            aria-hidden='true'
          />
          {endpoint.note}
        </p>
      )}

      <div className='mt-5'>
        <DocsTextLink href={endpoint.docsUrl}>Full reference</DocsTextLink>
      </div>
    </div>
  );
}

export function EndpointExplorer() {
  const baseId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeEndpoint = API_ENDPOINTS[activeIndex];

  const selectTab = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = API_ENDPOINTS.length - 1;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        selectTab(index === lastIndex ? 0 : index + 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        selectTab(index === 0 ? lastIndex : index - 1);
        break;
      case 'Home':
        event.preventDefault();
        selectTab(0);
        break;
      case 'End':
        event.preventDefault();
        selectTab(lastIndex);
        break;
    }
  };

  return (
    <section aria-labelledby='api-endpoints-title' className='space-y-8'>
      <ApiSectionHeader
        id='api-endpoints-title'
        eyebrow='Endpoints'
        title='Five GET endpoints, one consistent envelope'
        description='Explore each endpoint with real requests and response excerpts from the reference docs.'
        action={<DocsTextLink href={API_DOCS.overview}>API reference</DocsTextLink>}
      />

      <div className='grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6'>
        <div className='scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 lg:overflow-visible'>
          <div
            role='tablist'
            aria-label='API endpoints'
            className='flex w-max gap-1.5 rounded-2xl border border-gray-200 bg-gray-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-950/40 lg:sticky lg:top-6 lg:w-full lg:flex-col'
          >
            {API_ENDPOINTS.map((endpoint, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={endpoint.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type='button'
                  role='tab'
                  id={`${baseId}-tab-${endpoint.id}`}
                  aria-selected={isActive}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={cn(
                    'w-60 shrink-0 rounded-xl px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 lg:w-full',
                    isActive
                      ? 'bg-white shadow-sm ring-1 ring-gray-200 dark:bg-neutral-800 dark:shadow-none dark:ring-neutral-700'
                      : 'hover:bg-white/70 dark:hover:bg-neutral-800/60'
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <MethodBadge method={endpoint.method} />
                    <span
                      className={cn(
                        'text-[11px] font-semibold uppercase tracking-wider',
                        SURFACE_TAG_CLASS[endpoint.surface]
                      )}
                    >
                      {API_SURFACE_LABEL[endpoint.surface]}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-2 block truncate font-mono text-sm',
                      isActive
                        ? 'text-gray-900 dark:text-neutral-100'
                        : 'text-gray-700 dark:text-neutral-300'
                    )}
                  >
                    {endpoint.path}
                  </span>
                  <span className='mt-0.5 block text-xs text-gray-500 dark:text-neutral-500'>
                    {endpoint.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={activeEndpoint.id}
          id={`${baseId}-panel`}
          role='tabpanel'
          aria-labelledby={`${baseId}-tab-${activeEndpoint.id}`}
          className='grid min-w-0 gap-4 duration-300 fade-in-0 slide-in-from-bottom-1 motion-safe:animate-in 2xl:grid-cols-2'
        >
          <EndpointDetails endpoint={activeEndpoint} />
          <div className='flex min-w-0 flex-col gap-4'>
            <CodePanel
              snippets={[
                {
                  id: `${activeEndpoint.id}-request`,
                  label: 'Request',
                  language: 'bash',
                  code: activeEndpoint.request,
                },
              ]}
              caption='Request'
            />
            <CodePanel
              snippets={[
                {
                  id: `${activeEndpoint.id}-response`,
                  label: 'Response',
                  language: 'json',
                  code: activeEndpoint.response,
                },
              ]}
              caption='Response · excerpt'
              badge={
                <span className='shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-300'>
                  200 OK
                </span>
              }
              className='flex-1'
            />
          </div>
        </div>
      </div>
    </section>
  );
}
