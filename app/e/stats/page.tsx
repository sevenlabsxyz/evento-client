'use client';

import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { Share, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function StatsPage() {
  const t = useTranslations('misc.stats');
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();

  // Mock data - in real app this would come from user's actual event data
  const stats = {
    events: 0,
    countries: 0,
    cities: 0,
    categories: 0,
    mutuals: 0,
    shared: 0,
    international: 0,
    domestic: 0,
  };

  const CircularProgress = ({ percentage, size = 80 }: { percentage: number; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className='relative' style={{ width: size, height: size }}>
        <svg width={size} height={size} className='-rotate-90 transform'>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth='8'
            fill='none'
            className='stroke-gray-200 dark:stroke-neutral-700'
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth='8'
            fill='none'
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap='round'
            className='stroke-indigo-500 transition-all duration-300 dark:stroke-indigo-400'
          />
        </svg>
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='text-2xl font-bold text-indigo-600 dark:text-indigo-400'>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-gray-100 dark:bg-neutral-950 md:max-w-sm'>
      {/* Header */}
      <div className='relative bg-gray-900 pb-8 pt-12 dark:bg-neutral-900'>
        <Button
          variant='ghost'
          size='icon'
          className='absolute right-4 top-4 rounded-full text-white hover:bg-gray-800'
          onClick={() => router.back()}
          aria-label={t('close')}
        >
          <X className='h-6 w-6' />
        </Button>

        {/* Empty State Message */}
        <div className='mt-8 px-6 text-center text-white'>
          <h1 className='mb-4 text-2xl font-bold'>{t('emptyTitle')}</h1>
          <p className='mb-12 text-gray-300 dark:text-neutral-400'>{t('emptyDescription')}</p>

          {/* Stats Grid */}
          <div className='mb-8 grid grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold'>{stats.events}</div>
              <div className='text-gray-300 dark:text-neutral-400'>{t('events')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold'>{stats.countries}</div>
              <div className='text-gray-300 dark:text-neutral-400'>{t('countries')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold'>{stats.cities}</div>
              <div className='text-gray-300 dark:text-neutral-400'>{t('cities')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold'>{stats.categories}</div>
              <div className='text-gray-300 dark:text-neutral-400'>{t('categories')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold'>{stats.mutuals}</div>
              <div className='text-gray-300 dark:text-neutral-400'>{t('mutuals')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold'>0</div>
              <div className='text-gray-300 dark:text-neutral-400'>{t('connections')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Cards */}
      <div className='-mt-4 space-y-4 px-4 pb-6'>
        {/* Total Card */}
        <div className='rounded-2xl bg-white p-6 dark:bg-neutral-900'>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>{t('total')}</h2>
            <Button variant='ghost' size='icon' className='h-8 w-8' aria-label={t('share')}>
              <Share className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
            </Button>
          </div>

          <div className='mb-8 flex items-end gap-8'>
            <div className='text-center'>
              <div className='mb-2 text-6xl font-bold text-indigo-600 dark:text-indigo-400'>
                {stats.events}
              </div>
              <div className='font-medium text-indigo-600 dark:text-indigo-400'>{t('events')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-6xl font-bold text-gray-400 dark:text-neutral-400'>
                {stats.mutuals}
              </div>
              <div className='font-medium text-gray-400 dark:text-neutral-400'>
                {t('mutualsMet')}
              </div>
            </div>
          </div>

          {/* Progress Circles */}
          <div className='grid grid-cols-3 gap-6'>
            <div className='text-center'>
              <CircularProgress percentage={stats.shared} />
              <div className='mt-3 font-semibold'>{t('shared')}</div>
            </div>
            <div className='text-center'>
              <CircularProgress percentage={stats.international} />
              <div className='mt-3 font-semibold'>{t('international')}</div>
            </div>
            <div className='text-center'>
              <CircularProgress percentage={stats.domestic} />
              <div className='mt-3 font-semibold'>{t('domestic')}</div>
            </div>
          </div>
        </div>

        {/* Countries Card */}
        <div className='rounded-2xl bg-white p-6 dark:bg-neutral-900'>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>{t('countries')}</h2>
            <Button variant='ghost' size='icon' className='h-8 w-8' aria-label={t('share')}>
              <Share className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
            </Button>
          </div>

          <div className='mb-6 flex items-center justify-between'>
            <div className='flex items-end gap-4'>
              <div className='text-center'>
                <div className='mb-2 text-5xl font-bold text-red-500 dark:text-red-400'>
                  {stats.countries}
                </div>
                <div className='font-medium text-red-500 dark:text-red-400'>{t('visited')}</div>
              </div>
              <div className='text-center'>
                <div className='mb-2 text-5xl font-bold text-gray-400 dark:text-neutral-400'>
                  249
                </div>
                <div className='font-medium text-gray-400 dark:text-neutral-400'>
                  {t('worldTotal')}
                </div>
              </div>
            </div>
            <div className='text-center'>
              <CircularProgress
                percentage={stats.countries > 0 ? Math.round((stats.countries / 249) * 100) : 0}
                size={100}
              />
            </div>
          </div>

          <div className='mb-6'>
            <h3 className='mb-4 font-medium text-gray-500 dark:text-neutral-400'>
              {t('mostVisited')}
            </h3>
            {/* Empty state for most visited countries */}
          </div>

          <Button variant='ghost' className='w-full font-semibold text-red-500 dark:text-red-400'>
            {t('showVisitedCountries')}
          </Button>
        </div>

        {/* Event Categories Card */}
        <div className='rounded-2xl bg-white p-6 dark:bg-neutral-900'>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>{t('eventCategories')}</h2>
            <Button variant='ghost' size='icon' className='h-8 w-8' aria-label={t('share')}>
              <Share className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
            </Button>
          </div>

          <div className='grid grid-cols-2 gap-6'>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400'>
                {stats.categories}
              </div>
              <div className='font-medium text-blue-600 dark:text-blue-400'>{t('categories')}</div>
            </div>
            <div className='text-center'>
              <div className='mb-2 text-4xl font-bold text-green-600 dark:text-green-400'>
                {stats.mutuals}
              </div>
              <div className='font-medium text-green-600 dark:text-green-400'>{t('mutuals')}</div>
            </div>
          </div>

          <div className='mt-6'>
            <h3 className='mb-4 font-medium text-gray-500 dark:text-neutral-400'>
              {t('popularCategories')}
            </h3>
            <div className='text-center text-sm text-gray-400 dark:text-neutral-400'>
              {t('noCategories')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
