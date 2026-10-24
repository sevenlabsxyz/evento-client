import { Button } from '@/components/ui/button';
import { Bookmark, Compass, ListPlus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const SAVE_STEPS = [
  { id: 'find', icon: Compass },
  { id: 'bookmark', icon: Bookmark },
  { id: 'pick', icon: ListPlus },
] as const;

/** Shown when the user hasn't saved any events yet; explains the save flow. */
export function ListsEmptyState() {
  const t = useTranslations('lists');
  return (
    <section
      aria-labelledby='lists-empty-heading'
      className='rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 dark:border-neutral-800 dark:bg-neutral-900 md:px-10 md:py-12'
    >
      <div className='mx-auto flex max-w-xl flex-col items-center text-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm dark:bg-neutral-800 dark:text-red-400 dark:shadow-none'>
          <Bookmark className='h-6 w-6' aria-hidden='true' />
        </div>
        <h2
          id='lists-empty-heading'
          className='mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-100'
        >
          {t('emptyState.title')}
        </h2>
        <p className='mt-1 text-sm text-gray-600 dark:text-neutral-400'>
          {t('emptyState.description')}
        </p>
      </div>

      <ol className='mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3'>
        {SAVE_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.id}
              className='flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-800 sm:flex-col'
            >
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 dark:bg-neutral-900 dark:text-neutral-300'>
                <Icon className='h-4 w-4' aria-hidden='true' />
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                  <span className='sr-only'>
                    {t('emptyState.stepLabel', { number: index + 1 })}
                  </span>
                  {t(`emptyState.steps.${step.id}.title`)}
                </p>
                <p className='mt-0.5 text-sm text-gray-600 dark:text-neutral-400'>
                  {t(`emptyState.steps.${step.id}.description`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className='mt-8 flex flex-col justify-center gap-2 sm:flex-row'>
        <Button asChild>
          <Link href='/e/hub#discover'>
            <Compass aria-hidden='true' />
            {t('exploreDiscover')}
          </Link>
        </Button>
        <Button asChild variant='outline' className='dark:bg-neutral-900 dark:hover:bg-neutral-800'>
          <Link href='/e/search'>
            <Search aria-hidden='true' />
            {t('searchEvents')}
          </Link>
        </Button>
      </div>
    </section>
  );
}
