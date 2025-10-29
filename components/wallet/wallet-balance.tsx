'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/lib/hooks/use-wallet';
import { BTCPriceService } from '@/lib/services/btc-price';
import { useWalletPreferences } from '@/lib/stores/wallet-preferences-store';
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, RefreshCw, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WalletBalanceProps {
  onSend: () => void;
  onReceive: () => void;
}

export function WalletBalance({ onSend, onReceive }: WalletBalanceProps) {
  const { walletState, isLoading, refreshBalance } = useWallet();
  const { balanceHidden, toggleBalanceVisibility } = useWalletPreferences();
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Fetch USD conversion
  useEffect(() => {
    const fetchUSD = async () => {
      if (walletState.balance === 0) {
        setBalanceUSD(0);
        return;
      }

      try {
        setIsLoadingPrice(true);
        const usd = await BTCPriceService.satsToUSD(walletState.balance);
        setBalanceUSD(usd);
      } catch (error) {
        console.error('Failed to fetch USD price:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchUSD();
  }, [walletState.balance]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-32 w-full' />
        <div className='grid grid-cols-2 gap-3'>
          <Skeleton className='h-20' />
          <Skeleton className='h-20' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Balance Card */}
      <div className='rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white transition-all'>
        <div className='mb-4 flex items-center justify-between'>
          <span className='text-sm font-medium opacity-90'>Total Balance</span>
          <div className='flex items-center gap-2'>
            <button
              onClick={toggleBalanceVisibility}
              className='rounded-full p-1 transition-colors hover:bg-white/20'
              aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
            >
              {balanceHidden ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
            <button
              onClick={refreshBalance}
              className='rounded-full p-1 transition-colors hover:bg-white/20'
              aria-label='Refresh balance'
            >
              <RefreshCw className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-baseline gap-2'>
            <Zap className='h-6 w-6 fill-current' />
            {balanceHidden ? (
              <span className='text-4xl font-bold'>••••••</span>
            ) : (
              <>
                <span className='text-4xl font-bold'>{walletState.balance.toLocaleString()}</span>
                <span className='text-lg opacity-90'>sats</span>
              </>
            )}
          </div>

          {!balanceHidden && (
            <div className='text-lg opacity-90'>
              {isLoadingPrice ? (
                <span className='text-sm'>Loading...</span>
              ) : (
                <span>≈ ${balanceUSD.toFixed(2)} USD</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='grid grid-cols-2 gap-3'>
        <button
          onClick={onReceive}
          className='flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100'
        >
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <ArrowDownLeft className='h-6 w-6 text-green-600' />
          </div>
          <span className='text-sm font-medium'>Receive</span>
        </button>

        <button
          onClick={onSend}
          className='flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100'
        >
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
            <ArrowUpRight className='h-6 w-6 text-blue-600' />
          </div>
          <span className='text-sm font-medium'>Send</span>
        </button>
      </div>
    </div>
  );
}
