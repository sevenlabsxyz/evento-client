import { cn } from '@/lib/utils';
import { Braces, Gauge, ShieldCheck } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { API_DOCS } from './api-links';
import { ApiSectionHeader, DocsTextLink, InlineCode } from './api-primitives';
import { CodePanel, type CodeSnippet } from './code-panel';

const RATE_LIMIT_HEADERS: CodeSnippet = {
  id: 'rate-limit-headers',
  label: 'Rate limit headers',
  language: 'http',
  code: `X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1640995200`,
};

const ENVELOPE_SNIPPETS: (CodeSnippet & { id: 'success' | 'error' | 'list' })[] = [
  {
    id: 'success',
    label: 'Success',
    language: 'json',
    code: `{
  "success": true,
  "message": "Descriptive success message",
  "data": {}
}`,
  },
  {
    id: 'error',
    label: 'Error',
    language: 'json',
    code: `{
  "success": false,
  "message": "Validation failed",
  "code": "validation_error"
}`,
  },
  {
    id: 'list',
    label: 'List',
    language: 'json',
    code: `{
  "success": true,
  "message": "Events fetched successfully",
  "data": {
    "events": [],
    "pagination": { "limit": 20, "offset": 0, "total": 42 }
  }
}`,
  },
];

const STATUS_CODES = [
  { code: 200, label: 'OK' },
  { code: 400, label: 'Bad Request' },
  { code: 401, label: 'Unauthorized' },
  { code: 403, label: 'Forbidden' },
  { code: 404, label: 'Not Found' },
  { code: 409, label: 'Conflict' },
  { code: 422, label: 'Unprocessable Entity' },
  { code: 429, label: 'Too Many Requests' },
  { code: 500, label: 'Internal Server Error' },
] as const;

function statusCodeClass(code: number) {
  if (code < 300) {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
  }
  if (code < 500) {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
  }
  return 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300';
}

const CARD_CLASS =
  'flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none md:p-6';
const CARD_ICON_CLASS =
  'flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300';

export function ApiContracts() {
  const t = useTranslations('developers.api.contracts');
  const tApi = useTranslations('developers.api');
  const format = useFormatter();

  return (
    <section aria-labelledby='api-contracts-title' className='space-y-8'>
      <ApiSectionHeader
        id='api-contracts-title'
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <div className='grid gap-4 lg:grid-cols-3 lg:gap-6'>
        <article aria-labelledby='api-rate-limits-title' className={CARD_CLASS}>
          <div className={CARD_ICON_CLASS}>
            <Gauge className='h-5 w-5' aria-hidden='true' />
          </div>
          <h3
            id='api-rate-limits-title'
            className='mt-4 font-semibold text-gray-900 dark:text-neutral-100'
          >
            {t('rateLimits.title')}
          </h3>
          <p className='mt-3 flex items-baseline gap-2'>
            <span className='text-4xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-neutral-100'>
              {format.number(1000)}
            </span>
            <span className='text-sm text-gray-500 dark:text-neutral-500'>
              {tApi('hero.facts.requestsPerDay')}
            </span>
          </p>
          <p className='mt-2 text-sm leading-6 text-gray-600 dark:text-neutral-400'>
            {t.rich('rateLimits.description', {
              code: (chunks) => <InlineCode>{chunks}</InlineCode>,
            })}
          </p>
          <CodePanel
            snippets={[{ ...RATE_LIMIT_HEADERS, label: t('rateLimits.snippetLabel') }]}
            caption={t('rateLimits.snippetCaption')}
            className='mt-5 shadow-none dark:shadow-none'
            bodyClassName='py-3'
          />
          <div className='mt-auto pt-5'>
            <DocsTextLink href={API_DOCS.overview}>{t('rateLimits.docsLink')}</DocsTextLink>
          </div>
        </article>

        <article aria-labelledby='api-envelope-title' className={CARD_CLASS}>
          <div className={CARD_ICON_CLASS}>
            <Braces className='h-5 w-5' aria-hidden='true' />
          </div>
          <h3
            id='api-envelope-title'
            className='mt-4 font-semibold text-gray-900 dark:text-neutral-100'
          >
            {t('envelope.title')}
          </h3>
          <p className='mt-2 text-sm leading-6 text-gray-600 dark:text-neutral-400'>
            {t.rich('envelope.description', {
              code: (chunks) => <InlineCode>{chunks}</InlineCode>,
            })}
          </p>
          <CodePanel
            snippets={ENVELOPE_SNIPPETS.map((snippet) => ({
              ...snippet,
              label: t(`envelope.tabs.${snippet.id}`),
            }))}
            className='mt-5 shadow-none dark:shadow-none'
            bodyClassName='min-h-[12.5rem]'
          />
          <div className='mt-auto pt-5'>
            <DocsTextLink href={API_DOCS.responseFormat}>{t('envelope.docsLink')}</DocsTextLink>
          </div>
        </article>

        <article aria-labelledby='api-status-title' className={CARD_CLASS}>
          <div className={CARD_ICON_CLASS}>
            <ShieldCheck className='h-5 w-5' aria-hidden='true' />
          </div>
          <h3
            id='api-status-title'
            className='mt-4 font-semibold text-gray-900 dark:text-neutral-100'
          >
            {t('statusCodes.title')}
          </h3>
          <p className='mt-2 text-sm leading-6 text-gray-600 dark:text-neutral-400'>
            {t.rich('statusCodes.description', {
              code: (chunks) => <InlineCode>{chunks}</InlineCode>,
            })}
          </p>
          <ul className='mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2'>
            {STATUS_CODES.map((status) => (
              <li
                key={status.code}
                className='flex items-center gap-2.5 rounded-xl border border-gray-100 px-3 py-2 dark:border-neutral-800'
              >
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums',
                    statusCodeClass(status.code)
                  )}
                >
                  {status.code}
                </span>
                <span className='truncate text-sm text-gray-700 dark:text-neutral-300'>
                  {status.label}
                </span>
              </li>
            ))}
          </ul>
          <div className='mt-auto pt-5'>
            <DocsTextLink href={API_DOCS.errorHandling}>{t('statusCodes.docsLink')}</DocsTextLink>
          </div>
        </article>
      </div>
    </section>
  );
}
