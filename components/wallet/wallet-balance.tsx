'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/lib/hooks/use-wallet';
import { BTCPriceService } from '@/lib/services/btc-price';
import { useWalletPreferences } from '@/lib/stores/wallet-preferences-store';
import { toast } from '@/lib/utils/toast';
import { ChevronRight, Zap } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface WalletBalanceProps {
  onSend: () => void;
  onReceive: () => void;
  onScan: () => void;
  lightningAddress: string;
}

export function WalletBalance({ onSend, onReceive, onScan, lightningAddress }: WalletBalanceProps) {
  const { walletState, isLoading, refreshBalance } = useWallet();
  const { balanceHidden, toggleBalanceVisibility } = useWalletPreferences();
  const [balanceUSD, setBalanceUSD] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [showUSD, setShowUSD] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

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

  // Generate QR code when modal opens
  useEffect(() => {
    const generateQRCode = async () => {
      if (showQrModal && !qrCodeUrl) {
        try {
          const qrUrl = await QRCode.toDataURL(`lightning:${lightningAddress}`, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          setQrCodeUrl(qrUrl);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          toast.error('Failed to generate QR code');
        }
      }
    };

    generateQRCode();
  }, [showQrModal, lightningAddress, qrCodeUrl]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(lightningAddress);
      toast.success('Lightning address copied');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

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
        <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
          {/* Lightning Address Row */}
          <button
            onClick={() => setShowQrModal(true)}
            className='mb-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100'
          >
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              <Zap className='h-4 w-4 flex-shrink-0 text-black' />
              <div className='truncate font-mono text-sm font-bold text-gray-900'>
                {lightningAddress}
              </div>
            </div>
            <ChevronRight className='h-4 w-4 flex-shrink-0 text-gray-400' />
          </button>

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
                    <div className='text-5xl font-bold text-gray-900'>${balanceUSD.toFixed(2)}</div>
                    <div className='text-sm text-gray-600'>
                      {walletState.balance.toLocaleString()} sats
                    </div>
                  </>
                ) : (
                  <>
                    <div className='text-5xl font-bold text-gray-900'>
                      {walletState.balance.toLocaleString()}
                    </div>
                    <div className='text-sm text-gray-600'>≈ ${balanceUSD.toFixed(2)} USD</div>
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
                className='font-lg h-12 rounded-full bg-gray-50'
              >
                Receive
              </Button>
              <Button
                onClick={onSend}
                variant='outline'
                className='font-lg h-12 rounded-full bg-gray-50'
              >
                Send
              </Button>
            </div>
            <Button
              onClick={onScan}
              variant='outline'
              className='font-lg h-12 w-full rounded-full bg-gray-50'
            >
              Scan
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <DetachedSheet.Root presented={showQrModal} onPresentedChange={setShowQrModal}>
        <DetachedSheet.Portal>
          <DetachedSheet.View>
            <DetachedSheet.Backdrop />
            <DetachedSheet.Content>
              <div className='p-6'>
                <div className='mb-4 flex justify-center'>
                  <DetachedSheet.Handle />
                </div>
                <h2 className='mb-6 text-center text-lg font-semibold'>{lightningAddress}</h2>

                {qrCodeUrl && (
                  <div className='space-y-4'>
                    <div className='mx-auto w-fit rounded-2xl bg-white p-6 shadow-lg'>
                      <img src={qrCodeUrl} alt='Lightning Address QR Code' className='h-64 w-64' />
                    </div>

                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 text-center'>
                      <p className='mb-1 text-xs text-muted-foreground'>Your Lightning Address</p>
                      <p className='break-all font-mono text-sm'>{lightningAddress}</p>
                    </div>

                    <div className='space-y-3'>
                      <Button
                        onClick={handleCopyAddress}
                        variant='outline'
                        className='font-lg h-12 w-full rounded-full bg-gray-50'
                      >
                        Copy Address
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>
    </>
  );
}
