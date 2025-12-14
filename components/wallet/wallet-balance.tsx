'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import { Button } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Skeleton } from '@/components/ui/skeleton';
import { Env } from '@/lib/constants/env';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { BTCPriceService } from '@/lib/services/btc-price';
import { useWalletPreferences } from '@/lib/stores/wallet-preferences-store';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  HelpCircle,
  Loader2,
  Scan,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { WalletEducationalSheet } from './wallet-educational-sheet';

interface WalletBalanceProps {
  onSend: () => void;
  onReceive: () => void;
  onScan: () => void;
}

export function WalletBalance({ onSend, onReceive, onScan }: WalletBalanceProps) {
  const { walletState, isLoading, refreshBalance } = useWallet();
  const { address, isLoading: isAddressLoading } = useLightningAddress();
  const { balanceHidden, toggleBalanceVisibility } = useWalletPreferences();
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [showUSD, setShowUSD] = useState(false);
  const [showEducationalSheet, setShowEducationalSheet] = useState(false);
  const [educationalArticle, setEducationalArticle] = useState<any>(null);

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

  // Fetch educational blog post
  useEffect(() => {
    const fetchEducationalPost = async () => {
      if (!Env.NEXT_PUBLIC_GHOST_URL || !Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY) {
        console.warn('Ghost API configuration missing - cannot fetch educational content');
        return;
      }

      try {
        const res = await fetch(
          `${Env.NEXT_PUBLIC_GHOST_URL}/ghost/api/content/posts/slug/your-evento-wallet/?key=${Env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY}&include=tags,authors`
        );

        if (!res.ok) {
          console.error('Failed to fetch educational post:', res.status);
          return;
        }

        const data = await res.json();
        setEducationalArticle(data.posts?.[0] || null);
      } catch (error) {
        console.error('Error fetching educational post:', error);
      }
    };

    fetchEducationalPost();
  }, []);

  const toggleCurrency = () => {
    setShowUSD(!showUSD);
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-48 w-full' />
      </div>
    );
  }

  return (
    <>
      <div className='space-y-6'>
        {/* Balance Card */}
        <div className='rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm'>
          {/* Lightning Address Row */}
          <div className='mb-4 flex items-center gap-3'>
            <motion.button
              onClick={onReceive}
              className='flex flex-1 items-center justify-between rounded-full border border-gray-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-gray-100'
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className='flex min-w-0 flex-1 items-center gap-2'>
                <Zap className='h-4 w-4 flex-shrink-0 text-black' />
                {isAddressLoading || !address ? (
                  <div className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin text-gray-400' />
                    <span className='text-sm text-gray-500'>Registering...</span>
                  </div>
                ) : (
                  <div className='truncate font-mono text-sm font-bold text-gray-900'>
                    {address.lightningAddress}
                  </div>
                )}
              </div>
              <ChevronRight className='h-4 w-4 flex-shrink-0 text-gray-400' />
            </motion.button>
            <CircledIconButton icon={HelpCircle} onClick={() => setShowEducationalSheet(true)} />
          </div>

          {/* Balance Display - Centered & Clickable to toggle */}
          <button
            onClick={toggleCurrency}
            className='mb-6 mt-4 w-full text-center'
            disabled={balanceHidden}
          >
            {balanceHidden ? (
              <div className='text-5xl font-bold'>$••••</div>
            ) : (
              <div className='space-y-1'>
                {showUSD ? (
                  <>
                    <div className='text-5xl font-bold text-gray-900'>
                      $<NumberTicker value={balanceUSD} decimalPlaces={2} />
                    </div>
                    <div className='text-sm text-gray-600'>
                      <NumberTicker value={walletState.balance} /> sats
                    </div>
                  </>
                ) : (
                  <>
                    <div className='flex items-baseline justify-center gap-2'>
                      <span className='text-5xl font-bold text-gray-900'>
                        <NumberTicker value={walletState.balance} />
                      </span>
                      <span className='text-2xl font-medium text-gray-600'>sats</span>
                    </div>
                    <div className='text-sm text-gray-600'>
                      ≈ $<NumberTicker value={balanceUSD} decimalPlaces={2} /> USD
                    </div>
                  </>
                )}
              </div>
            )}
          </button>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <Button
                onClick={onReceive}
                variant='outline'
                className='font-lg h-12 rounded-full bg-white font-semibold active:bg-gray-100'
              >
                <ArrowDownLeft className='h-5 w-5' />
                Receive
              </Button>
              <Button
                onClick={onSend}
                variant='outline'
                className='font-lg h-12 rounded-full bg-white font-semibold active:bg-gray-100'
              >
                <ArrowUpRight className='h-5 w-5' />
                Send
              </Button>
            </div>
            <Button
              onClick={onScan}
              variant='outline'
              className='font-lg h-12 w-full rounded-full bg-white font-semibold active:bg-gray-100'
            >
              <Scan className='h-5 w-5' />
              Scan
            </Button>
          </div>
        </div>
      </div>

      {/* Educational Content Sheet */}
      <WalletEducationalSheet
        article={educationalArticle}
        open={showEducationalSheet}
        onOpenChange={setShowEducationalSheet}
      />
    </>
  );
}
