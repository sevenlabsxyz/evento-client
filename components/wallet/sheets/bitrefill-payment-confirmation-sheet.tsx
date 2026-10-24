'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { BTCPriceService } from '@/lib/services/btc-price';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface BitrefillPaymentConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentUri: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface InvoiceDetails {
  bolt11: string;
  amountSats: number;
  amountUSD: number;
}

export function BitrefillPaymentConfirmationSheet({
  open,
  onOpenChange,
  paymentUri,
  onConfirm,
  onCancel,
}: BitrefillPaymentConfirmationSheetProps) {
  const t = useTranslations('walletFlows');
  const tCommon = useTranslations('common');
  const intlLocale = getIntlLocale(useLocale());
  const formatSats = (sats: number) => sats.toLocaleString(intlLocale);
  const { walletState } = useWallet();
  const { prepareSend, sendPayment, feeEstimate, isLoading: isSending, error } = useSendPayment();

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [showBackupWarning, setShowBackupWarning] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Parse the payment URI and prepare the payment
  useEffect(() => {
    const parseAndPrepare = async () => {
      if (!open || !paymentUri) return;

      setIsLoadingInvoice(true);
      setPaymentError(null);

      try {
        // Extract BOLT11 from payment URI (format: lightning:lnbc...)
        const bolt11 = paymentUri.replace(/^lightning:/i, '');

        // Prepare the payment to get fee estimate
        const prepareResponse = await prepareSend(bolt11);

        // Extract amount from prepare response
        const amountSats = Number(prepareResponse.amount || 0);

        // Convert to USD
        const amountUSD = amountSats > 0 ? await BTCPriceService.satsToUSD(amountSats) : 0;

        setInvoiceDetails({
          bolt11,
          amountSats,
          amountUSD,
        });
      } catch (err: any) {
        logger.error('Failed to parse invoice', {
          error: err instanceof Error ? err.message : String(err),
        });
        setPaymentError(err.message || t('bitrefillPaymentConfirmationSheet.errors.parseInvoice'));
      } finally {
        setIsLoadingInvoice(false);
      }
    };

    parseAndPrepare();
  }, [open, paymentUri, prepareSend, t]);

  // Calculate total with fees
  const totalFees = feeEstimate
    ? (feeEstimate.lightning || 0) + (feeEstimate.sparkTransfer || 0)
    : 0;
  const totalAmount = (invoiceDetails?.amountSats || 0) + totalFees;
  const hasInsufficientBalance = totalAmount > walletState.balance;

  // Handle confirm payment
  const handleConfirm = useCallback(async () => {
    if (!invoiceDetails) return;

    // Check if wallet needs backup first
    if (!walletState.hasBackup) {
      setShowBackupWarning(true);
      return;
    }

    try {
      setPaymentError(null);
      await sendPayment(invoiceDetails.bolt11);
      onConfirm();
    } catch (err: any) {
      logger.error('Payment failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      setPaymentError(err.message || t('bitrefillPaymentConfirmationSheet.errors.paymentFailed'));
    }
  }, [invoiceDetails, walletState.hasBackup, sendPayment, onConfirm, t]);

  // Handle backup warning continue (proceed without backup)
  const handleProceedWithoutBackup = useCallback(async () => {
    if (!invoiceDetails) return;

    setShowBackupWarning(false);
    try {
      setPaymentError(null);
      await sendPayment(invoiceDetails.bolt11);
      onConfirm();
    } catch (err: any) {
      logger.error('Payment failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      setPaymentError(err.message || t('bitrefillPaymentConfirmationSheet.errors.paymentFailed'));
    }
  }, [invoiceDetails, sendPayment, onConfirm, t]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setInvoiceDetails(null);
      setIsLoadingInvoice(true);
      setShowBackupWarning(false);
      setPaymentError(null);
    }
  }, [open]);

  // Backup warning view
  if (showBackupWarning) {
    return (
      <DetachedSheet.Root presented={open} onPresentedChange={onOpenChange}>
        <DetachedSheet.Portal>
          <DetachedSheet.View>
            <DetachedSheet.Backdrop />
            <DetachedSheet.Content>
              <div className='p-6'>
                <div className='mb-4 flex justify-center'>
                  <DetachedSheet.Handle />
                </div>

                <div className='mb-6 flex justify-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60'>
                    <ShieldAlert className='h-8 w-8 text-amber-600 dark:text-amber-400' />
                  </div>
                </div>

                <h2 className='mb-2 text-center text-xl font-semibold'>
                  {t('bitrefillPaymentConfirmationSheet.backupRequired.title')}
                </h2>
                <p className='mb-6 text-center text-sm text-gray-600 dark:text-neutral-400'>
                  {t('bitrefillPaymentConfirmationSheet.backupRequired.description')}
                </p>

                <div className='space-y-3'>
                  <Button
                    onClick={() => setShowBackupWarning(false)}
                    variant='outline'
                    className='h-12 w-full rounded-full'
                  >
                    {t('bitrefillPaymentConfirmationSheet.backupRequired.goBack')}
                  </Button>
                  <Button
                    onClick={handleProceedWithoutBackup}
                    variant='ghost'
                    className='h-12 w-full rounded-full text-gray-500 dark:text-neutral-400'
                    disabled={isSending}
                  >
                    {isSending
                      ? t('bitrefillPaymentConfirmationSheet.processing')
                      : t('bitrefillPaymentConfirmationSheet.backupRequired.continueWithout')}
                  </Button>
                </div>
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>
    );
  }

  return (
    <DetachedSheet.Root presented={open} onPresentedChange={onOpenChange}>
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-lg font-semibold'>
                  {t('bitrefillPaymentConfirmationSheet.title')}
                </h2>
                <WalletBalanceDisplay size='sm' />
              </div>

              {isLoadingInvoice ? (
                <div className='space-y-4'>
                  <Skeleton className='mx-auto h-16 w-32' />
                  <Skeleton className='h-20 w-full' />
                  <Skeleton className='h-12 w-full' />
                </div>
              ) : paymentError && !invoiceDetails ? (
                <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/40'>
                  <p className='text-sm text-red-600 dark:text-red-400'>{paymentError}</p>
                </div>
              ) : invoiceDetails ? (
                <>
                  {/* Amount Display */}
                  <div className='mb-6 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-950'>
                    <div className='text-4xl font-bold text-gray-900 dark:text-neutral-100'>
                      ${invoiceDetails.amountUSD.toFixed(2)}
                    </div>
                    <div className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
                      {t('bitrefillPaymentConfirmationSheet.sats', {
                        amount: formatSats(invoiceDetails.amountSats),
                      })}
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className='mb-6 space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500 dark:text-neutral-400'>
                        {t('bitrefillPaymentConfirmationSheet.amount')}
                      </span>
                      <span className='font-medium'>
                        {t('bitrefillPaymentConfirmationSheet.sats', {
                          amount: formatSats(invoiceDetails.amountSats),
                        })}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500 dark:text-neutral-400'>
                        {t('bitrefillPaymentConfirmationSheet.networkFee')}
                      </span>
                      <span className='font-medium'>
                        {t('bitrefillPaymentConfirmationSheet.sats', {
                          amount: formatSats(totalFees),
                        })}
                      </span>
                    </div>
                    <div className='border-t border-gray-100 pt-2 dark:border-neutral-800'>
                      <div className='flex justify-between'>
                        <span className='font-bold text-gray-900 dark:text-neutral-100'>
                          {t('bitrefillPaymentConfirmationSheet.total')}
                        </span>
                        <div className='flex flex-col'>
                          <span className='text-lg font-bold text-gray-900 dark:text-neutral-100'>
                            {t('bitrefillPaymentConfirmationSheet.sats', {
                              amount: formatSats(totalAmount),
                            })}
                          </span>
                          <span className='text-right text-sm text-gray-500 dark:text-neutral-400'>
                            ${invoiceDetails.amountUSD.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insufficient Balance Warning */}
                  {hasInsufficientBalance && (
                    <div className='mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40'>
                      <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400' />
                      <p className='text-sm text-red-600 dark:text-red-400'>
                        {t('bitrefillPaymentConfirmationSheet.insufficientBalance', {
                          required: formatSats(totalAmount),
                          balance: formatSats(walletState.balance),
                        })}
                      </p>
                    </div>
                  )}

                  {/* Payment Error */}
                  {paymentError && (
                    <div className='mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40'>
                      <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400' />
                      <p className='text-sm text-red-600 dark:text-red-400'>{paymentError}</p>
                    </div>
                  )}

                  {/* Warning Text */}
                  <p className='mb-6 text-center text-xs text-gray-500 dark:text-neutral-400'>
                    {t('bitrefillPaymentConfirmationSheet.irreversibleWarning')}
                  </p>
                </>
              ) : null}

              {/* Action Buttons */}
              <div className='space-y-3'>
                <Button
                  onClick={handleConfirm}
                  className='h-12 w-full rounded-full'
                  disabled={
                    isLoadingInvoice ||
                    isSending ||
                    hasInsufficientBalance ||
                    !invoiceDetails ||
                    !!paymentError
                  }
                >
                  {isSending
                    ? t('bitrefillPaymentConfirmationSheet.processing')
                    : invoiceDetails
                      ? t('bitrefillPaymentConfirmationSheet.pay', {
                          amount: formatSats(invoiceDetails.amountSats),
                        })
                      : t('bitrefillPaymentConfirmationSheet.confirmPayment')}
                </Button>
                <Button
                  onClick={onCancel}
                  variant='outline'
                  className='h-12 w-full rounded-full'
                  disabled={isSending}
                >
                  {tCommon('actions.cancel')}
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
