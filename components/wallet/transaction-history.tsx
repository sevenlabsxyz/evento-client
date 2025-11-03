'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BTCPriceService } from '@/lib/services/btc-price';
import { useWalletPreferences } from '@/lib/stores/wallet-preferences-store';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Copy, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TransactionHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  onRefresh: () => void;
  onTransactionClick?: (payment: Payment) => void;
  showViewAllButton?: boolean;
  onViewAll?: () => void;
}

export function TransactionHistory({
  payments,
  isLoading,
  onRefresh,
  onTransactionClick,
  showViewAllButton = false,
  onViewAll,
}: TransactionHistoryProps) {
  const { balanceHidden } = useWalletPreferences();
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
          console.error('Failed to fetch USD price:', error);
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

    if (isIncoming) {
      return (
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
          <ArrowDownLeft className='h-5 w-5 text-green-600' />
        </div>
      );
    }

    return (
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
        <ArrowUpRight className='h-5 w-5 text-blue-600' />
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
      case 'succeeded':
        return <CheckCircle2 className='h-4 w-4 text-green-600' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-yellow-600' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-600' />;
      default:
        return null;
    }
  };

  const getPaymentDescription = (payment: Payment): string => {
    if (!payment.details) return 'No description';

    switch (payment.details.type) {
      case 'lightning':
        return payment.details.description || 'Lightning payment';
      case 'spark':
        return 'Spark payment';
      case 'token':
        return 'Token payment';
      case 'withdraw':
        return 'Withdrawal';
      case 'deposit':
        return 'Deposit';
      default:
        return 'Payment';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
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
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='mb-4 rounded-full bg-gray-100 p-4'>
          <Clock className='h-8 w-8 text-gray-400' />
        </div>
        <h3 className='mb-2 text-lg font-semibold'>No transactions yet</h3>
        <p className='mb-4 text-sm text-muted-foreground'>
          Your transaction history will appear here
        </p>
        <Button onClick={onRefresh} variant='outline' size='sm'>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {payments.map((payment) => {
        const isIncoming = payment.paymentType === 'receive';
        const amountSats = Number(payment.amount);
        const usdAmount = usdPrices[payment.id] || 0;
        const description = getPaymentDescription(payment);

        return (
          <button
            key={payment.id}
            onClick={() => onTransactionClick?.(payment)}
            className='w-full cursor-pointer rounded-lg border bg-white p-4 text-left transition-colors hover:bg-gray-50'
          >
            <div className='flex items-start gap-3'>
              {getPaymentIcon(payment)}

              <div className='min-w-0 flex-1'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      {getStatusIcon(payment.status)}
                      <div className='flex flex-col'>
                        <p className='truncate font-medium'>{description}</p>
                        <p className='text-xs font-normal text-muted-foreground'>
                          {formatDate(payment.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='text-right'>
                    {balanceHidden ? (
                      <p className='font-semibold'>••••••</p>
                    ) : (
                      <>
                        <p
                          className={`font-semibold ${
                            isIncoming ? 'text-green-600' : 'text-gray-900'
                          }`}
                        >
                          {isIncoming ? '+' : '-'}
                          {amountSats.toLocaleString()} sats
                        </p>
                        <p className='text-sm text-muted-foreground'>${usdAmount.toFixed(2)}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className='mt-2 flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    {payment.details && (payment.details as any).bolt11 && (
                      <button
                        onClick={() => copyToClipboard((payment.details as any).bolt11)}
                        className='rounded p-1 transition-colors hover:bg-gray-200'
                        title='Copy invoice'
                      >
                        <Copy className='h-3 w-3 text-muted-foreground' />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {payments.length > 0 && showViewAllButton && onViewAll && (
        <div className='pt-4 text-center'>
          <Button onClick={onViewAll} variant='outline' size='sm'>
            View All Transactions
          </Button>
        </div>
      )}
    </div>
  );
}
