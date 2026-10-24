import { Skeleton } from '@/components/ui/skeleton';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import type { EventDashboard, EventSales } from '@/lib/types/manage';
import { Clock, CreditCard, Ticket, Zap, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function formatSats(sats: number): string {
  return Math.round(sats).toLocaleString(getIntlLocale());
}

export function formatFiat(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(), { style: 'currency', currency }).format(amount);
  } catch {
    // Unknown ISO code from the API; fall back to a plain amount.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}

function SummaryCard({ icon: Icon, label, value, hint }: SummaryCardProps) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400'>
        <Icon className='h-4 w-4' />
        <span>{label}</span>
      </div>
      <p className='mt-2 truncate text-2xl font-semibold tabular-nums text-gray-900 dark:text-neutral-100'>
        {value}
      </p>
      <p className='mt-1 truncate text-xs text-gray-500 dark:text-neutral-400'>{hint}</p>
    </div>
  );
}

interface SalesSummaryProps {
  summary: EventSales['summary'];
  tickets: NonNullable<EventDashboard['tickets']>;
}

export function SalesSummary({ summary, tickets }: SalesSummaryProps) {
  const t = useTranslations('manage');
  const intlLocale = getIntlLocale();
  const { sats, fiatEquivalent, currency } = summary.totalRevenue;
  const fiatUnavailable = sats > 0 && fiatEquivalent === 0;
  const revenueHint = fiatUnavailable
    ? t('salesSummary.fiatUnavailable')
    : t('salesSummary.atCurrentRate', { amount: formatFiat(fiatEquivalent, currency) });

  const ticketsSold = summary.totalTicketsSold;
  const soldPercent =
    tickets.capacity > 0 ? Math.min(100, Math.round((ticketsSold / tickets.capacity) * 100)) : 0;
  const ticketsHint =
    tickets.capacity > 0
      ? t('salesSummary.percentOfAvailable', {
          percent: soldPercent,
          capacity: tickets.capacity.toLocaleString(intlLocale),
        })
      : t('salesSummary.noInventory');

  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
      <SummaryCard
        icon={Zap}
        label={t('salesSummary.totalRevenue')}
        value={t('salesSummary.satsValue', { amount: formatSats(sats) })}
        hint={revenueHint}
      />
      <SummaryCard
        icon={Ticket}
        label={t('salesSummary.ticketsSold')}
        value={ticketsSold.toLocaleString(intlLocale)}
        hint={ticketsHint}
      />
      <SummaryCard
        icon={CreditCard}
        label={t('salesSummary.paidOrders')}
        value={tickets.paidOrders.toLocaleString(intlLocale)}
        hint={t('salesSummary.completedPayments')}
      />
      <SummaryCard
        icon={Clock}
        label={t('salesSummary.pendingOrders')}
        value={tickets.pendingOrders.toLocaleString(intlLocale)}
        hint={t('salesSummary.awaitingPayment')}
      />
    </div>
  );
}

export function SalesSummarySkeleton() {
  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
        >
          <Skeleton className='h-4 w-24' />
          <Skeleton className='mt-3 h-7 w-28' />
          <Skeleton className='mt-2 h-3 w-32' />
        </div>
      ))}
    </div>
  );
}
