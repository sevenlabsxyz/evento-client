'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/lib/hooks/use-wallet';
import { BTCPriceService } from '@/lib/services/btc-price';
import { useEffect, useState } from 'react';

interface WalletBalanceDisplayProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function WalletBalanceDisplay({
  className = '',
  showLabel = true,
  size = 'md',
}: WalletBalanceDisplayProps) {
  const { walletState } = useWallet();
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUSD = async () => {
      if (walletState.balance > 0) {
        try {
          setIsLoading(true);
          const usd = await BTCPriceService.satsToUSD(walletState.balance);
          setBalanceUSD(usd);
        } catch (error) {
          console.error('Failed to fetch USD balance:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setBalanceUSD(0);
        setIsLoading(false);
      }
    };
    fetchUSD();
  }, [walletState.balance]);

  if (isLoading) {
    return (
      <div className={`text-right ${className}`}>
        <Skeleton className={`${size === 'sm' ? 'h-4 w-16' : 'h-5 w-20'} mb-1`} />
        {showLabel && <Skeleton className='h-3 w-12' />}
      </div>
    );
  }

  return (
    <div className={`text-right ${className}`}>
      <div className={`font-semibold text-gray-900 ${size === 'sm' ? 'text-sm' : 'text-sm'}`}>
        ${balanceUSD.toFixed(2)}
      </div>
      {showLabel && <div className='text-xs text-gray-500'>available</div>}
    </div>
  );
}
