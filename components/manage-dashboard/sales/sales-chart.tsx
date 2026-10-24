'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { EventSales } from '@/lib/types/manage';
import { BarChart3 } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const DAY_MS = 24 * 60 * 60 * 1000;

const chartConfig = {
  orders: {
    label: 'Orders',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

interface ChartPoint {
  date: string;
  orders: number;
}

// The API only returns days that had paid orders (UTC `YYYY-MM-DD`), so fill
// the gaps between the first and last sale day to keep the time axis honest.
function fillDailySeries(points: EventSales['salesOverTime']): ChartPoint[] {
  if (points.length === 0) {
    return [];
  }

  const counts = new Map(points.map((point) => [point.date, point.tickets]));
  const start = Date.parse(`${points[0].date}T00:00:00Z`);
  const end = Date.parse(`${points[points.length - 1].date}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return points.map((point) => ({ date: point.date, orders: point.tickets }));
  }

  const series: ChartPoint[] = [];
  for (let time = start; time <= end; time += DAY_MS) {
    const date = new Date(time).toISOString().slice(0, 10);
    series.push({ date, orders: counts.get(date) ?? 0 });
  }

  return series;
}

function formatDay(date: string, options: Intl.DateTimeFormatOptions): string {
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time)) {
    return date;
  }

  return new Date(time).toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
}

interface SalesChartProps {
  salesOverTime: EventSales['salesOverTime'];
}

export function SalesChart({ salesOverTime }: SalesChartProps) {
  const series = useMemo(() => fillDailySeries(salesOverTime), [salesOverTime]);
  const totalOrders = useMemo(
    () => salesOverTime.reduce((sum, point) => sum + point.tickets, 0),
    [salesOverTime]
  );

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>
            Orders per day
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            Paid orders grouped by payment date (UTC)
          </p>
        </div>
        {series.length > 0 && (
          <span className='shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium tabular-nums text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'>
            {totalOrders.toLocaleString()} total
          </span>
        )}
      </div>

      {series.length === 0 ? (
        <div className='flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center dark:border-neutral-700'>
          <BarChart3 className='mb-2 h-6 w-6 text-gray-400 dark:text-neutral-500' />
          <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
            No paid orders yet
          </p>
          <p className='mt-1 max-w-xs text-xs text-gray-500 dark:text-neutral-400'>
            Daily sales will appear here once guests complete checkout.
          </p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className='aspect-auto h-56 w-full'>
          <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: string) =>
                formatDay(value, { month: 'short', day: 'numeric' })
              }
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tickMargin={4}
            />
            <ChartTooltip
              cursor={false}
              content={(props) => (
                <ChartTooltipContent
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                  coordinate={props.coordinate}
                  accessibilityLayer={props.accessibilityLayer}
                  activeIndex={props.activeIndex}
                  labelFormatter={(value: ReactNode) =>
                    typeof value === 'string'
                      ? formatDay(value, { weekday: 'short', month: 'short', day: 'numeric' })
                      : value
                  }
                />
              )}
            />
            <Bar
              dataKey='orders'
              fill='var(--color-orders)'
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      )}
    </section>
  );
}

export function SalesChartSkeleton() {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <Skeleton className='h-5 w-32' />
      <Skeleton className='mt-2 h-4 w-56' />
      <Skeleton className='mt-4 h-56 w-full rounded-xl' />
    </div>
  );
}
