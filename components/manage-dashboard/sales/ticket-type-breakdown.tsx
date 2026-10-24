import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EventSales } from '@/lib/types/manage';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatFiat } from './sales-summary';

function percentOf(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / total) * 100));
}

const headClassName = 'h-10 px-3 text-xs uppercase tracking-wide dark:text-neutral-400';
const rowClassName =
  'border-gray-100 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50';
const cellClassName = 'px-3 py-3';

interface UsageBarProps {
  value: number;
  total: number;
  label: string;
}

function UsageBar({ value, total, label }: UsageBarProps) {
  return (
    <div className='min-w-[8rem] space-y-1.5'>
      <div className='flex items-baseline justify-between gap-2 text-xs tabular-nums'>
        <span className='font-medium text-gray-900 dark:text-neutral-100'>{label}</span>
        <span className='text-gray-500 dark:text-neutral-400'>{percentOf(value, total)}%</span>
      </div>
      <Progress
        value={percentOf(value, total)}
        className='h-1.5 bg-gray-100 dark:bg-neutral-800'
        aria-label={label}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className='rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='border-b border-gray-100 p-4 dark:border-neutral-800'>
        <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>{description}</p>
      </div>
      {children}
    </section>
  );
}

interface EmptyRowProps {
  message: string;
  href: string;
  linkLabel: string;
}

function EmptySection({ message, href, linkLabel }: EmptyRowProps) {
  return (
    <div className='p-6 text-center'>
      <p className='text-sm text-gray-500 dark:text-neutral-400'>{message}</p>
      <Link
        href={href}
        className='mt-2 inline-block text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-neutral-100'
      >
        {linkLabel}
      </Link>
    </div>
  );
}

interface TicketTypeBreakdownProps {
  eventId: string;
  ticketTypes: EventSales['ticketTypes'];
  discountCodes: EventSales['discountCodes'];
}

export function TicketTypeBreakdown({
  eventId,
  ticketTypes,
  discountCodes,
}: TicketTypeBreakdownProps) {
  const t = useTranslations('manage');
  const ticketsHref = `/e/${eventId}/manage/tickets`;
  const totalSold = ticketTypes.reduce((sum, type) => sum + type.sold, 0);
  const totalCapacity = ticketTypes.reduce((sum, type) => sum + type.total, 0);
  const currencies = new Set(ticketTypes.map((type) => type.currency));
  const sharedCurrency = currencies.size === 1 ? ticketTypes[0].currency : null;
  const totalRevenue = ticketTypes.reduce((sum, type) => sum + type.revenue, 0);

  return (
    <div className='grid gap-4 lg:grid-cols-5'>
      <div className='lg:col-span-3'>
        <Section
          title={t('ticketTypeBreakdown.ticketTypesTitle')}
          description={t('ticketTypeBreakdown.ticketTypesDescription')}
        >
          {ticketTypes.length === 0 ? (
            <EmptySection
              message={t('ticketTypeBreakdown.noTicketTypes')}
              href={ticketsHref}
              linkLabel={t('ticketTypeBreakdown.manageTickets')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={rowClassName}>
                  <TableHead className={headClassName}>{t('ticketTypeBreakdown.type')}</TableHead>
                  <TableHead className={headClassName}>{t('ticketTypeBreakdown.sold')}</TableHead>
                  <TableHead className={`${headClassName} text-right`}>
                    {t('ticketTypeBreakdown.revenue')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketTypes.map((type) => (
                  <TableRow key={type.id} className={rowClassName}>
                    <TableCell
                      className={`${cellClassName} max-w-[12rem] truncate font-medium text-gray-900 dark:text-neutral-100`}
                    >
                      {type.name}
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <UsageBar
                        value={type.sold}
                        total={type.total}
                        label={`${type.sold.toLocaleString()} / ${type.total.toLocaleString()}`}
                      />
                    </TableCell>
                    <TableCell
                      className={`${cellClassName} whitespace-nowrap text-right tabular-nums text-gray-900 dark:text-neutral-100`}
                    >
                      {formatFiat(type.revenue, type.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className='border-gray-100 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-800/40'>
                <TableRow className='hover:bg-transparent'>
                  <TableCell className={`${cellClassName} text-gray-900 dark:text-neutral-100`}>
                    {t('ticketTypeBreakdown.total')}
                  </TableCell>
                  <TableCell
                    className={`${cellClassName} tabular-nums text-gray-700 dark:text-neutral-300`}
                  >
                    {totalSold.toLocaleString()} / {totalCapacity.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`${cellClassName} whitespace-nowrap text-right tabular-nums text-gray-900 dark:text-neutral-100`}
                  >
                    {sharedCurrency
                      ? formatFiat(totalRevenue, sharedCurrency)
                      : t('ticketTypeBreakdown.mixedCurrencies')}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </Section>
      </div>

      <div className='lg:col-span-2'>
        <Section
          title={t('ticketTypeBreakdown.discountCodesTitle')}
          description={t('ticketTypeBreakdown.discountCodesDescription')}
        >
          {discountCodes.length === 0 ? (
            <EmptySection
              message={t('ticketTypeBreakdown.noDiscountCodes')}
              href={ticketsHref}
              linkLabel={t('ticketTypeBreakdown.createDiscountCode')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={rowClassName}>
                  <TableHead className={headClassName}>{t('ticketTypeBreakdown.code')}</TableHead>
                  <TableHead className={headClassName}>{t('ticketTypeBreakdown.off')}</TableHead>
                  <TableHead className={headClassName}>{t('ticketTypeBreakdown.used')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((discount) => (
                  <TableRow key={discount.code} className={rowClassName}>
                    <TableCell
                      className={`${cellClassName} font-mono text-xs font-medium uppercase text-gray-900 dark:text-neutral-100`}
                    >
                      {discount.code}
                    </TableCell>
                    <TableCell
                      className={`${cellClassName} tabular-nums text-gray-700 dark:text-neutral-300`}
                    >
                      {discount.percentage}%
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <UsageBar
                        value={discount.used}
                        total={discount.limit}
                        label={`${discount.used.toLocaleString()} / ${discount.limit.toLocaleString()}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>
      </div>
    </div>
  );
}

export function TicketTypeBreakdownSkeleton() {
  return (
    <div className='grid gap-4 lg:grid-cols-5'>
      {[3, 2].map((span) => (
        <div
          key={span}
          className={`${span === 3 ? 'lg:col-span-3' : 'lg:col-span-2'} rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900`}
        >
          <Skeleton className='h-5 w-32' />
          <Skeleton className='mt-2 h-4 w-48' />
          <div className='mt-4 space-y-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className='h-10 w-full' />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
