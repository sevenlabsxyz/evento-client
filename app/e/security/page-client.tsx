'use client';

import {
  SECURITY_FACTS,
  SECURITY_LAST_UPDATED_ISO,
  SECURITY_SECTIONS,
} from '@/components/security/security-content';
import { SecurityGlanceGrid } from '@/components/security/security-glance-grid';
import { SecuritySection } from '@/components/security/security-section';
import { SecuritySectionNav } from '@/components/security/security-section-nav';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect } from 'react';

const SECURITY_PATHNAME = '/e/security';
const PAGE_BACKGROUND_CLASS = 'min-h-full w-full bg-white dark:bg-neutral-900';
const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-6xl px-4 pb-40 pt-6 md:px-8 md:pb-16 md:pt-10';

function SecurityPageHeader() {
  const t = useTranslations('security');
  const format = useFormatter();
  const lastUpdated = format.dateTime(new Date(`${SECURITY_LAST_UPDATED_ISO}T00:00:00Z`), {
    dateStyle: 'long',
    timeZone: 'UTC',
  });

  return (
    <header className='border-b border-gray-200 pb-8 dark:border-neutral-800'>
      <div className='max-w-2xl'>
        <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
          {t('header.eyebrow')}
        </p>
        <h1 className='mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-4xl'>
          {t('header.title')}
        </h1>
        <p className='mt-3 text-base text-gray-600 dark:text-neutral-400'>{t('header.subtitle')}</p>
        <p className='mt-4 text-sm text-gray-500 dark:text-neutral-500'>
          {t.rich('header.lastUpdated', {
            date: lastUpdated,
            time: (chunks) => <time dateTime={SECURITY_LAST_UPDATED_ISO}>{chunks}</time>,
          })}
        </p>
      </div>
    </header>
  );
}

export default function SecurityPageClient() {
  const t = useTranslations('security');
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  useEffect(() => {
    applyRouteConfig(SECURITY_PATHNAME);

    setTopBarForRoute(SECURITY_PATHNAME, {
      title: t('topBarTitle'),
      subtitle: '',
      leftMode: 'menu',
      centerMode: 'title',
      showAvatar: true,
      desktopHidden: true,
      isOverlaid: false,
      buttons: [],
      badge: undefined,
    });

    return () => {
      clearRoute(SECURITY_PATHNAME);
    };
  }, [applyRouteConfig, setTopBarForRoute, clearRoute, t]);

  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className={PAGE_CONTAINER_CLASS}>
        <SecurityPageHeader />

        <div className='mt-8'>
          <SecurityGlanceGrid facts={SECURITY_FACTS} />
        </div>

        <div className='mt-10 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-14'>
          <div className='min-w-0 max-w-3xl'>
            {SECURITY_SECTIONS.map((section) => (
              <SecuritySection key={section.id} section={section} />
            ))}
          </div>
          <aside className='hidden lg:sticky lg:top-8 lg:block lg:self-start'>
            <SecuritySectionNav sections={SECURITY_SECTIONS} />
          </aside>
        </div>
      </div>
    </div>
  );
}
