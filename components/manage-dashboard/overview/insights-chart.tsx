'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import type { EventDashboard } from '@/lib/types/manage';
import { BarChart3 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface InsightsChartProps {
  dashboard: EventDashboard;
}

type SeriesKey = 'rsvps' | 'registrations' | 'tickets';

const SERIES_COLORS: Record<SeriesKey, string> = {
  rsvps: 'hsl(var(--chart-1))',
  registrations: 'hsl(var(--chart-2))',
  tickets: 'hsl(var(--chart-4))',
};

export function InsightsChart({ dashboard }: InsightsChartProps) {
  const t = useTranslations('manage');
  const intlLocale = getIntlLocale(useLocale());
  const dayFormatter = new Intl.DateTimeFormat(intlLocale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const seriesLabels: Record<SeriesKey, string> = {
    rsvps: t('insightsChart.series.rsvps'),
    registrations: t('insightsChart.series.registrations'),
    tickets: t('insightsChart.series.tickets'),
  };
  const seriesKeys: SeriesKey[] = [
    'rsvps',
    ...(dashboard.registration ? (['registrations'] as const) : []),
    ...(dashboard.tickets ? (['tickets'] as const) : []),
  ];

  const chartConfig: ChartConfig = Object.fromEntries(
    seriesKeys.map((key) => [key, { label: seriesLabels[key], color: SERIES_COLORS[key] }])
  );

  const data = dashboard.timeline.map((point) => ({
    ...point,
    label: dayFormatter.format(new Date(`${point.date}T00:00:00Z`)),
  }));

  const totals = seriesKeys.map((key) => ({
    key,
    total: dashboard.timeline.reduce((sum, point) => sum + point[key], 0),
  }));
  const isEmpty = totals.every(({ total }) => total === 0);

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            {t('insightsChart.title')}
          </h2>
          <p className='text-xs text-gray-500 dark:text-neutral-400'>{t('insightsChart.period')}</p>
        </div>
        <div className='flex flex-wrap gap-4'>
          {totals.map(({ key, total }) => (
            <div key={key} className='flex items-center gap-2'>
              <span
                className='h-2.5 w-2.5 rounded-sm'
                style={{ backgroundColor: SERIES_COLORS[key] }}
              />
              <span className='text-xs text-gray-500 dark:text-neutral-400'>
                {seriesLabels[key]}
              </span>
              <span className='text-sm font-semibold tabular-nums text-gray-900 dark:text-neutral-100'>
                {total.toLocaleString(intlLocale)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className='flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center dark:border-neutral-800'>
          <BarChart3 className='mb-2 h-6 w-6 text-gray-400 dark:text-neutral-500' />
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            {t('insightsChart.emptyTitle')}
          </p>
          <p className='mt-1 text-xs text-gray-500 dark:text-neutral-400'>
            {t('insightsChart.emptyDescription')}
          </p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className='aspect-auto h-48 w-full'>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {seriesKeys.map((key) => (
                <linearGradient key={key} id={`fill-${key}`} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={`var(--color-${key})`} stopOpacity={0.4} />
                  <stop offset='95%' stopColor={`var(--color-${key})`} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip
              cursor={false}
              content={({
                active,
                payload,
                label,
                coordinate,
                accessibilityLayer,
                activeIndex,
              }) => (
                <ChartTooltipContent
                  active={active}
                  payload={payload}
                  label={label}
                  coordinate={coordinate}
                  accessibilityLayer={accessibilityLayer}
                  activeIndex={activeIndex}
                  indicator='dot'
                />
              )}
            />
            {seriesKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type='monotone'
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                fill={`url(#fill-${key})`}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      )}
    </section>
  );
}

export function InsightsChartSkeleton() {
  return (
    <div className='space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-4 w-32' />
      </div>
      <Skeleton className='h-48 w-full rounded-xl' />
    </div>
  );
}
