import type { SecurityFact } from '@/components/security/security-content';
import { useTranslations } from 'next-intl';

interface SecurityGlanceGridProps {
  facts: SecurityFact[];
}

export function SecurityGlanceGrid({ facts }: SecurityGlanceGridProps) {
  const t = useTranslations('security');

  return (
    <section aria-labelledby='security-glance-heading'>
      <h2
        id='security-glance-heading'
        className='mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500'
      >
        {t('glance.heading')}
      </h2>
      <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {facts.map(({ id, icon: Icon, key }) => (
          <li
            key={id}
            className='flex gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
          >
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'>
              <Icon className='h-[18px] w-[18px]' aria-hidden='true' />
            </span>
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {t(`facts.${key}.title`)}
              </p>
              <p className='mt-0.5 text-sm leading-snug text-gray-600 dark:text-neutral-400'>
                {t(`facts.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
