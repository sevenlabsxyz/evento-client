import { Button } from '@/components/ui/button';
import { ArrowUpRight, BookOpen, Boxes, KeyRound, type LucideIcon, Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { API_DOCS, API_KEYS_SETTINGS_PATH, SETTINGS_PATH } from './api-links';

interface GetStartedStep {
  /** Title, description and link label live under `developers.api.getStarted.steps.<key>`. */
  key: 'developerMode' | 'createKey' | 'firstRequest';
  link: { href: string; external: boolean };
}

const STEPS: GetStartedStep[] = [
  { key: 'developerMode', link: { href: SETTINGS_PATH, external: false } },
  { key: 'createKey', link: { href: API_KEYS_SETTINGS_PATH, external: false } },
  { key: 'firstRequest', link: { href: API_DOCS.quickstart, external: true } },
];

interface DocLink {
  /** Title and description live under `developers.api.getStarted.docs.<key>`. */
  key: 'quickstart' | 'authentication' | 'dataModels';
  href: string;
  icon: LucideIcon;
}

const DOC_LINKS: DocLink[] = [
  { key: 'quickstart', href: API_DOCS.quickstart, icon: Rocket },
  { key: 'authentication', href: API_DOCS.authentication, icon: KeyRound },
  { key: 'dataModels', href: API_DOCS.dataModels, icon: Boxes },
];

const STEP_LINK_CLASS =
  'inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-white hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400';

export function ApiGetStarted() {
  const t = useTranslations('developers.api');

  return (
    <section aria-labelledby='api-get-started-title' className='space-y-4 lg:space-y-6'>
      <div className='relative isolate overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 px-5 py-8 text-white md:px-10 md:py-12'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-red-600/25 blur-3xl'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_80%_at_100%_0%,black,transparent)]'
        />

        <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-xl'>
            <p className='text-xs font-semibold uppercase tracking-wider text-red-400'>
              {t('getStarted.eyebrow')}
            </p>
            <h2
              id='api-get-started-title'
              className='mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl'
            >
              {t('getStarted.title')}
            </h2>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Button
              asChild
              size='lg'
              className='bg-white px-6 text-neutral-950 hover:bg-neutral-200 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200'
            >
              <Link href={API_KEYS_SETTINGS_PATH}>
                <KeyRound aria-hidden='true' />
                {t('hero.getApiKey')}
              </Link>
            </Button>
            <Button
              asChild
              size='lg'
              variant='outline'
              className='border-neutral-700 bg-transparent px-6 text-white hover:bg-neutral-800 hover:text-white dark:border-neutral-700 dark:bg-transparent dark:hover:bg-neutral-800'
            >
              <a href={API_DOCS.overview} target='_blank' rel='noopener noreferrer'>
                <BookOpen aria-hidden='true' />
                {t('hero.readDocs')}
                <span className='sr-only'>{t('opensInNewTab')}</span>
              </a>
            </Button>
          </div>
        </div>

        <ol className='mt-8 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-4'>
          {STEPS.map((step, index) => (
            <li
              key={step.key}
              className='flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5'
            >
              <span
                aria-hidden='true'
                className='flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-semibold tabular-nums text-white'
              >
                {index + 1}
              </span>
              <h3 className='mt-4 font-semibold text-neutral-100'>
                {t(`getStarted.steps.${step.key}.title`)}
              </h3>
              <p className='mt-1.5 flex-1 text-sm leading-6 text-neutral-400'>
                {t(`getStarted.steps.${step.key}.description`)}
              </p>
              <div className='mt-4'>
                {step.link.external ? (
                  <a
                    href={step.link.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={STEP_LINK_CLASS}
                  >
                    {t(`getStarted.steps.${step.key}.link`)}
                    <ArrowUpRight className='h-4 w-4' aria-hidden='true' />
                    <span className='sr-only'>{t('opensInNewTab')}</span>
                  </a>
                ) : (
                  <Link href={step.link.href} className={STEP_LINK_CLASS}>
                    {t(`getStarted.steps.${step.key}.link`)}
                    <span aria-hidden='true'>→</span>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <ul className='grid gap-4 md:grid-cols-3'>
        {DOC_LINKS.map((doc) => {
          const Icon = doc.icon;
          return (
            <li key={doc.key}>
              <a
                href={doc.href}
                target='_blank'
                rel='noopener noreferrer'
                className='group flex h-full items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800'
              >
                <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors group-hover:bg-white dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:bg-neutral-700'>
                  <Icon className='h-5 w-5' aria-hidden='true' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='flex items-center gap-1 font-semibold text-gray-900 dark:text-neutral-100'>
                    {t(`getStarted.docs.${doc.key}.title`)}
                    <ArrowUpRight
                      className='h-4 w-4 text-gray-400 motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 dark:text-neutral-500'
                      aria-hidden='true'
                    />
                  </p>
                  <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
                    {t(`getStarted.docs.${doc.key}.description`)}
                  </p>
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
