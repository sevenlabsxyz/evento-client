'use client';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useContacts } from '@/lib/hooks/use-contacts';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { BTCPriceService } from '@/lib/services/btc-price';
import { useWalletPreferences } from '@/lib/stores/wallet-preferences-store';
import { logger } from '@/lib/utils/logger';
import { getWalletPaymentDisplayData } from '@/lib/utils/wallet-payment-display';
import type { Payment } from '@breeztech/breez-sdk-spark/ssr';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface TransactionHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  onRefresh: () => void;
  onTransactionClick?: (payment: Payment) => void;
  showViewAllButton?: boolean;
  onViewAll?: () => void;
  maxTransactions?: number;
}

export function TransactionHistory({
  payments,
  isLoading,
  onRefresh,
  onTransactionClick,
  showViewAllButton = false,
  onViewAll,
  maxTransactions,
}: TransactionHistoryProps) {
  const { balanceHidden } = useWalletPreferences();
  const t = useTranslations('wallet');
  const locale = getIntlLocale(useLocale());
  const { findContactByAddress } = useContacts();
  const [usdPrices, setUsdPrices] = useState<Record<string, number>>({});

  // Fetch USD prices for all payments
  useEffect(() => {
    const fetchPrices = async () => {
      const prices: Record<string, number> = {};

      for (const payment of payments) {
        try {
          const amountSats = Number(payment.amount);
          const usd = await BTCPriceService.satsToUSD(amountSats);
          prices[payment.id] = usd;
        } catch (error) {
          logger.error('Failed to fetch USD price', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      setUsdPrices(prices);
    };

    if (payments.length > 0) {
      fetchPrices();
    }
  }, [payments]);

  const getPaymentIcon = (payment: Payment) => {
    const isIncoming = payment.paymentType === 'receive';
    const isPending = payment.status === 'pending';

    // Use orange color scheme for pending transactions
    if (isPending) {
      if (isIncoming) {
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-full border bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/60'>
            <ArrowDownLeft className='h-5 w-5 text-orange-600 dark:text-orange-400' />
          </div>
        );
      }

      return (
        <div className='flex h-10 w-10 items-center justify-center rounded-full border bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/60'>
          <ArrowUpRight className='h-5 w-5 text-orange-600 dark:text-orange-400' />
        </div>
      );
    }

    // Normal color scheme for completed/failed transactions
    if (isIncoming) {
      return (
        <div className='flex h-10 w-10 items-center justify-center rounded-full border bg-green-100 dark:border-green-900/60 dark:bg-green-950/60'>
          <ArrowDownLeft className='h-5 w-5 text-green-600 dark:text-green-400' />
        </div>
      );
    }

    return (
      <div className='flex h-10 w-10 items-center justify-center rounded-full border bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/60'>
        <ArrowUpRight className='h-5 w-5 text-blue-600 dark:text-blue-400' />
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
      case 'succeeded':
        return <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />;
      default:
        return null;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('history.justNow');
    if (diffMins < 60) return t('history.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('history.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('history.daysAgo', { count: diffDays });

    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className='h-20 w-full' />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Empty className='py-12'>
        <EmptyHeader>
          <EmptyMedia variant='soft-circle'>
            <Clock className='h-8 w-8' />
          </EmptyMedia>
          <EmptyTitle className='text-lg sm:text-lg'>{t('history.emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('history.emptyDescription')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onRefresh} variant='outline' className='h-11'>
            {t('history.refresh')}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className='space-y-3'>
      {(maxTransactions ? payments.slice(0, maxTransactions) : payments).map((payment) => {
        const isIncoming = payment.paymentType === 'receive';
        const amountSats = Number(payment.amount);
        const usdAmount = usdPrices[payment.id] || 0;
        const displayData = getWalletPaymentDisplayData(payment);
        const contact = displayData.lightningAddress
          ? findContactByAddress(displayData.lightningAddress)
          : null;
        const primaryText = contact?.name ?? displayData.primaryText;
        const detailParts = [
          contact ? displayData.primaryText : displayData.secondaryText,
          contact ? displayData.secondaryText : null,
          displayData.lightningAddress,
          formatDate(payment.timestamp),
        ].filter(Boolean);

        return (
          <button
            key={payment.id}
            onClick={() => onTransactionClick?.(payment)}
            className='w-full cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900'
          >
            <div className='flex min-w-0 items-start gap-3'>
              {getPaymentIcon(payment)}

              <div className='min-w-0 flex-1 overflow-hidden'>
                <div className='flex w-full min-w-0 items-start gap-2 overflow-hidden'>
                  <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
                    <div className='shrink-0'>
                      {payment.status !== 'pending' && getStatusIcon(payment.status)}
                    </div>

                    <div className='min-w-0 flex-1 overflow-hidden'>
                      <p className='truncate font-medium text-gray-900 dark:text-neutral-100'>
                        {primaryText}
                      </p>
                      <p className='truncate text-xs font-normal text-gray-600 dark:text-neutral-400'>
                        {detailParts.join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className='flex max-w-[110px] flex-shrink-0 flex-col items-end text-right'>
                    {balanceHidden ? (
                      <p className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                        ••••••
                      </p>
                    ) : (
                      <>
                        <p
                          className={`truncate font-semibold ${
                            isIncoming
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-900 dark:text-neutral-100'
                          }`}
                        >
                          {isIncoming ? '+' : '-'}
                          {amountSats.toLocaleString(locale)} sats
                        </p>
                        <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                          ${usdAmount.toFixed(2)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {payments.length > 0 && showViewAllButton && onViewAll && (
        <div className='pt-4'>
          <Button
            onClick={onViewAll}
            variant='outline'
            className='font-lg h-12 w-full rounded-full bg-gray-50 dark:bg-neutral-950'
          >
            {t('history.viewAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
