'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { AmountInputSheet } from '@/components/wallet/amount-input-sheet';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import type { InputType } from '@breeztech/breez-sdk-spark/web';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type LnurlWithdrawInput = Extract<InputType, { type: 'lnurlWithdraw' }>;

interface DevLnurlWithdrawConfig {
  amountSats: number | null;
  initialStep: 'details' | 'confirm' | 'success' | 'error';
  mockResult: 'success' | 'error' | null;
}

interface ReceiveLnurlWithdrawSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawRequest: LnurlWithdrawInput | null;
  devConfig?: DevLnurlWithdrawConfig | null;
  onReceived?: () => Promise<void> | void;
}

function toMinSats(msats: number) {
  return Math.max(1, Math.ceil(msats / 1000));
}

function toMaxSats(msats: number) {
  return Math.max(1, Math.floor(msats / 1000));
}

export function ReceiveLnurlWithdrawSheet({
  open,
  onOpenChange,
  withdrawRequest,
  devConfig,
  onReceived,
}: ReceiveLnurlWithdrawSheetProps) {
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [amountSheetOpen, setAmountSheetOpen] = useState(false);
  const [amountSats, setAmountSats] = useState<number | null>(null);
  const [amountUSD, setAmountUSD] = useState<number | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const { satsToUSD } = useAmountConverter();

  const constraints = useMemo(() => {
    if (!withdrawRequest) {
      return null;
    }

    const minSats = toMinSats(Number(withdrawRequest.minWithdrawable));
    const maxSats = Math.max(minSats, toMaxSats(Number(withdrawRequest.maxWithdrawable)));

    return {
      minSats,
      maxSats,
      isFixedAmount: minSats === maxSats,
    };
  }, [withdrawRequest]);

  useEffect(() => {
    if (!open || !withdrawRequest || !constraints) {
      return;
    }

    if (process.env.NODE_ENV === 'development' && devConfig) {
      setAmountSats(devConfig.amountSats);
      setStep(devConfig.initialStep === 'error' ? 'confirm' : devConfig.initialStep);
      return;
    }

    if (constraints.isFixedAmount) {
      setAmountSats(constraints.minSats);
      setStep('confirm');
      return;
    }

    setAmountSats(null);
    setAmountUSD(null);
    setStep('details');
  }, [constraints, devConfig, open, withdrawRequest]);

  useEffect(() => {
    let cancelled = false;

    const loadAmountUsd = async () => {
      if (!amountSats || amountSats <= 0) {
        setAmountUSD(null);
        return;
      }

      const usd = await satsToUSD(amountSats);
      if (!cancelled) {
        setAmountUSD(usd);
      }
    };

    void loadAmountUsd();

    return () => {
      cancelled = true;
    };
  }, [amountSats, satsToUSD]);

  const resetState = () => {
    setStep('details');
    setAmountSheetOpen(false);
    setAmountSats(null);
    setAmountUSD(null);
    setIsReceiving(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleChooseAmount = async (selectedAmountSats: number) => {
    setAmountSats(selectedAmountSats);
    setAmountSheetOpen(false);
    setStep('confirm');
  };

  const handleReceive = async () => {
    if (!withdrawRequest || !amountSats) {
      toast.error('Missing LNURL withdraw details');
      return;
    }

    setIsReceiving(true);

    try {
      if (process.env.NODE_ENV === 'development' && devConfig?.mockResult) {
        await new Promise((resolve) => setTimeout(resolve, 350));

        if (devConfig.mockResult === 'error') {
          throw new Error('Dev-only LNURL withdraw failure');
        }

        try {
          await onReceived?.();
        } catch (refreshError) {
          logger.error('Dev LNURL withdraw completed but wallet refresh failed', {
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          });
        }

        setStep('success');
        return;
      }

      // Generate invoice first using Breez
      const invoiceResponse = await breezSDK.receivePayment({
        paymentMethod: {
          type: 'bolt11Invoice',
          description: withdrawRequest.defaultDescription || 'LNURL Withdraw',
          amountSats,
        },
      });

      const bolt11Invoice = invoiceResponse.paymentRequest;

      try {
        // ATTEMPT 1: Try Breez SDK first
        await breezSDK.lnurlWithdraw({
          amountSats,
          withdrawRequest: {
            callback: withdrawRequest.callback,
            k1: withdrawRequest.k1,
            defaultDescription: withdrawRequest.defaultDescription,
            minWithdrawable: withdrawRequest.minWithdrawable,
            maxWithdrawable: withdrawRequest.maxWithdrawable,
          },
        });
      } catch (breezError) {
        // Check if error is CORS/network related
        const errorMessage = breezError instanceof Error ? breezError.message : String(breezError);
        const isCorsError =
          errorMessage.includes('CORS') ||
          errorMessage.includes('Access-Control-Allow-Origin') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('error calling lnurl endpoint') ||
          errorMessage.includes('error sending request') ||
          errorMessage.includes('Request error');

        if (!isCorsError) {
          // Not a CORS error - rethrow for normal handling
          throw breezError;
        }

        // ATTEMPT 2: Fall back to API
        logger.info('Breez withdraw failed with CORS, trying API fallback...');
        const response = await fetch('/api/v1/lightning/lnurl/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback: withdrawRequest.callback,
            k1: withdrawRequest.k1,
            invoice: bolt11Invoice,
            amount: amountSats * 1000, // convert to millisats
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || result.reason || 'Withdraw failed');
        }
      }

      try {
        await onReceived?.();
      } catch (refreshError) {
        logger.error('LNURL withdraw completed but wallet refresh failed', {
          error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        });
      }

      setStep('success');
    } catch (error) {
      logger.error('Failed to execute LNURL withdraw', {
        error: error instanceof Error ? error.message : String(error),
        amountSats,
      });
      toast.error(error instanceof Error ? error.message : 'Failed to receive funds');
    } finally {
      setIsReceiving(false);
    }
  };

  const providerHost = useMemo(() => {
    if (!withdrawRequest?.callback) {
      return null;
    }

    try {
      return new URL(withdrawRequest.callback).hostname;
    } catch {
      return null;
    }
  }, [withdrawRequest]);

  useEffect(() => {
    if (!open || process.env.NODE_ENV !== 'development' || devConfig?.initialStep !== 'error') {
      return;
    }

    toast.error('Dev-only LNURL withdraw failure');
  }, [devConfig?.initialStep, open]);

  const footer =
    step === 'success' ? (
      <Button className='h-12 w-full rounded-full' onClick={() => handleOpenChange(false)}>
        Done
      </Button>
    ) : step === 'details' ? (
      <Button className='h-12 w-full rounded-full' onClick={() => setAmountSheetOpen(true)}>
        Choose amount
      </Button>
    ) : (
      <Button
        className='h-12 w-full rounded-full'
        onClick={handleReceive}
        disabled={isReceiving || !amountSats}
      >
        {isReceiving ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Receiving...
          </>
        ) : (
          'Confirm and receive'
        )}
      </Button>
    );

  return (
    <>
      <MasterScrollableSheet
        open={open}
        onOpenChange={handleOpenChange}
        title='Receive Bitcoin'
        footer={footer}
      >
        <div className='space-y-6 p-6'>
          {step === 'success' ? (
            <div className='flex flex-col items-center justify-center space-y-6 py-10 text-center'>
              {/* Success Icon with Spring Animation */}
              <motion.div
                className='rounded-full bg-green-100 p-6'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className='h-16 w-16 text-green-600' />
              </motion.div>
              
              {/* Title with Fade-in Slide-up */}
              <motion.div
                className='space-y-2'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className='text-2xl font-bold text-gray-900'>Bitcoin received</h3>
                <p className='text-sm text-muted-foreground'>
                  Your sats arrived in your Evento wallet.
                </p>
              </motion.div>
              
              {/* Amount Card with Fade-in Slide-up */}
              {amountUSD !== null && (
                <motion.div
                  className='rounded-xl bg-gray-50 px-6 py-4'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className='text-center text-3xl font-bold text-gray-900'>
                    ${amountUSD.toFixed(2)}
                  </p>
                  <p className='text-center text-sm text-gray-600'>
                    {amountSats?.toLocaleString()} sats
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            <>

                <div className='space-y-3'>
                  <div className='rounded-2xl bg-white p-4'>
                    <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                      Description
                    </p>
                    <p className='text-sm font-medium text-gray-900'>
                      {withdrawRequest?.defaultDescription || 'Receive funds'}
                    </p>
                  </div>


                  {constraints && (
                    <>
                      {constraints.isFixedAmount ? (
                        <div className='rounded-2xl bg-white p-4'>
                          <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                            Amount
                          </p>
                          <p className='text-2xl font-semibold text-gray-900'>
                            {constraints.minSats.toLocaleString()} sats
                          </p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='rounded-2xl bg-white p-4'>
                            <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                              Minimum
                            </p>
                            <p className='text-lg font-semibold text-gray-900'>
                              {constraints.minSats.toLocaleString()} sats
                            </p>
                          </div>
                          <div className='rounded-2xl bg-white p-4'>
                            <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                              Maximum
                            </p>
                            <p className='text-lg font-semibold text-gray-900'>
                              {constraints.maxSats.toLocaleString()} sats
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

              {step === 'confirm' && amountSats && (
                <div className='space-y-4'>
                  {/* Amount Card */}
                  <div className='rounded-2xl border border-gray-200 bg-white p-6 text-center'>
                    <p className='text-3xl font-bold text-gray-900'>
                      {amountSats.toLocaleString()} sats
                    </p>
                    {amountUSD !== null && (
                      <p className='mt-1 text-lg text-muted-foreground'>
                        ${amountUSD.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {withdrawRequest?.defaultDescription && (
                    <p className='text-center text-sm text-gray-700'>
                      {withdrawRequest.defaultDescription}
                    </p>
                  )}

                  {/* Provider */}
                  {providerHost && (
                    <p className='text-center text-sm text-muted-foreground'>
                      from {providerHost}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </MasterScrollableSheet>

{!constraints?.isFixedAmount && (
<AmountInputSheet
open={amountSheetOpen}
onOpenChange={setAmountSheetOpen}
          onConfirm={handleChooseAmount}
          minAmount={constraints?.minSats}
          maxAmount={constraints?.maxSats}
/>
)}
    </>
  );
}
