'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { BTCPriceService } from '@/lib/services/btc-price';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
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
        console.error('Failed to parse invoice:', err);
        setPaymentError(err.message || 'Failed to parse invoice');
      } finally {
        setIsLoadingInvoice(false);
      }
    };

    parseAndPrepare();
  }, [open, paymentUri, prepareSend]);

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
      console.error('Payment failed:', err);
      setPaymentError(err.message || 'Payment failed');
    }
  }, [invoiceDetails, walletState.hasBackup, sendPayment, onConfirm]);

  // Handle backup warning continue (proceed without backup)
  const handleProceedWithoutBackup = useCallback(async () => {
    if (!invoiceDetails) return;

    setShowBackupWarning(false);
    try {
      setPaymentError(null);
      await sendPayment(invoiceDetails.bolt11);
      onConfirm();
    } catch (err: any) {
      console.error('Payment failed:', err);
      setPaymentError(err.message || 'Payment failed');
    }
  }, [invoiceDetails, sendPayment, onConfirm]);

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
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-amber-100'>
                    <ShieldAlert className='h-8 w-8 text-amber-600' />
                  </div>
                </div>

                <h2 className='mb-2 text-center text-xl font-semibold'>Backup Required</h2>
                <p className='mb-6 text-center text-sm text-gray-600'>
                  We recommend backing up your wallet before making your first payment. If you lose
                  access to your device, you&apos;ll need your backup to recover your funds.
                </p>

                <div className='space-y-3'>
                  <Button
                    onClick={() => setShowBackupWarning(false)}
                    variant='outline'
                    className='h-12 w-full rounded-full'
                  >
                    Go Back & Backup
                  </Button>
                  <Button
                    onClick={handleProceedWithoutBackup}
                    variant='ghost'
                    className='h-12 w-full rounded-full text-gray-500'
                    disabled={isSending}
                  >
                    {isSending ? 'Processing...' : 'Continue Without Backup'}
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

              <h2 className='mb-6 text-center text-lg font-semibold'>Confirm Purchase</h2>

              {isLoadingInvoice ? (
                <div className='space-y-4'>
                  <Skeleton className='mx-auto h-16 w-32' />
                  <Skeleton className='h-20 w-full' />
                  <Skeleton className='h-12 w-full' />
                </div>
              ) : paymentError && !invoiceDetails ? (
                <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center'>
                  <p className='text-sm text-red-600'>{paymentError}</p>
                </div>
              ) : invoiceDetails ? (
                <>
                  {/* Amount Display */}
                  <div className='mb-6 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center'>
                    <div className='mb-1 flex items-center justify-center gap-2'>
                      <Zap className='h-5 w-5 text-amber-500' />
                      <span className='text-sm text-gray-500'>Lightning Payment</span>
                    </div>
                    <div className='text-4xl font-bold text-gray-900'>
                      ${invoiceDetails.amountUSD.toFixed(2)}
                    </div>
                    <div className='mt-1 text-sm text-gray-500'>
                      {invoiceDetails.amountSats.toLocaleString()} sats
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className='mb-6 space-y-2 rounded-lg border border-gray-200 bg-white p-4'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500'>Amount</span>
                      <span className='font-medium'>
                        {invoiceDetails.amountSats.toLocaleString()} sats
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500'>Network Fee</span>
                      <span className='font-medium'>{totalFees.toLocaleString()} sats</span>
                    </div>
                    <div className='border-t border-gray-100 pt-2'>
                      <div className='flex justify-between'>
                        <span className='font-medium text-gray-900'>Total</span>
                        <span className='font-bold text-gray-900'>
                          {totalAmount.toLocaleString()} sats
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Insufficient Balance Warning */}
                  {hasInsufficientBalance && (
                    <div className='mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3'>
                      <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500' />
                      <p className='text-sm text-red-600'>
                        Insufficient balance. You need {totalAmount.toLocaleString()} sats but only
                        have {walletState.balance.toLocaleString()} sats.
                      </p>
                    </div>
                  )}

                  {/* Payment Error */}
                  {paymentError && (
                    <div className='mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3'>
                      <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500' />
                      <p className='text-sm text-red-600'>{paymentError}</p>
                    </div>
                  )}

                  {/* Warning Text */}
                  <p className='mb-6 text-center text-xs text-gray-500'>
                    Lightning payments are instant and irreversible. Please verify the amount before
                    confirming.
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
                    ? 'Processing...'
                    : invoiceDetails
                      ? `Pay ${invoiceDetails.amountSats.toLocaleString()} sats`
                      : 'Confirm Payment'}
                </Button>
                <Button
                  onClick={onCancel}
                  variant='outline'
                  className='h-12 w-full rounded-full'
                  disabled={isSending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
