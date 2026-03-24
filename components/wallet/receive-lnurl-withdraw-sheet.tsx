'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { AmountInputSheet } from '@/components/wallet/amount-input-sheet';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import type { InputType } from '@breeztech/breez-sdk-spark/web';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type LnurlWithdrawInput = Extract<InputType, { type: 'lnurlWithdraw' }>;

interface ReceiveLnurlWithdrawSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawRequest: LnurlWithdrawInput | null;
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

    if (constraints.isFixedAmount) {
      setAmountSats(constraints.minSats);
      setStep('confirm');
      return;
    }

    setAmountSats(null);
    setAmountUSD(null);
    setStep('details');
  }, [open, withdrawRequest, constraints]);

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
    if (!constraints) {
      return;
    }

    if (selectedAmountSats < constraints.minSats) {
      toast.error(`Minimum amount is ${constraints.minSats.toLocaleString()} sats`);
      return;
    }

    if (selectedAmountSats > constraints.maxSats) {
      toast.error(`Maximum amount is ${constraints.maxSats.toLocaleString()} sats`);
      return;
    }

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
              <div className='rounded-full bg-green-100 p-6'>
                <CheckCircle2 className='h-16 w-16 text-green-600' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-2xl font-bold text-gray-900'>Funds received</h3>
                <p className='text-sm text-muted-foreground'>
                  {amountSats?.toLocaleString()} sats arrived in your event wallet.
                </p>
              </div>
              {amountUSD !== null && (
                <div className='rounded-xl bg-gray-50 px-6 py-4'>
                  <p className='text-center text-3xl font-bold text-gray-900'>
                    ${amountUSD.toFixed(2)}
                  </p>
                  <p className='text-center text-sm text-gray-600'>
                    {amountSats?.toLocaleString()} sats
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className='rounded-3xl border border-gray-200 bg-gray-50 p-5'>
                <div className='mb-4 flex items-start gap-3'>
                  <div className='rounded-full bg-white p-3 shadow-sm'>
                    <Wallet className='h-5 w-5 text-gray-900' />
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium text-gray-900'>LNURL withdraw detected</p>
                    <p className='text-sm text-muted-foreground'>
                      Scan confirmed. This QR will send Lightning funds into your event wallet.
                    </p>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='rounded-2xl bg-white p-4'>
                    <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                      Description
                    </p>
                    <p className='text-sm font-medium text-gray-900'>
                      {withdrawRequest?.defaultDescription || 'Receive funds'}
                    </p>
                  </div>

                  {providerHost && (
                    <div className='rounded-2xl bg-white p-4'>
                      <p className='mb-1 text-xs uppercase tracking-wide text-muted-foreground'>
                        Provider
                      </p>
                      <p className='text-sm font-medium text-gray-900'>{providerHost}</p>
                    </div>
                  )}

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
              </div>

              {step === 'confirm' && amountSats && (
                <div className='space-y-4'>
                  <div className='rounded-3xl border border-gray-200 bg-white p-5'>
                    <p className='mb-2 text-xs uppercase tracking-wide text-muted-foreground'>
                      You will receive
                    </p>
                    <p className='text-3xl font-bold text-gray-900'>
                      {amountSats.toLocaleString()} sats
                    </p>
                    {amountUSD !== null && (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        About ${amountUSD.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className='rounded-2xl bg-blue-50 p-4'>
                    <p className='text-sm text-blue-900'>
                      We’ll create the invoice and complete the withdraw request for you after you
                      confirm.
                    </p>
                  </div>
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
        />
      )}
    </>
  );
}
