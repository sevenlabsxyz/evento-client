'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useWallet } from '@/lib/hooks/use-wallet';
import { BTCPriceService } from '@/lib/services/btc-price';
import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BitrefillPaymentConfirmationSheet } from './bitrefill-payment-confirmation-sheet';
import { BitrefillPaymentStatusSheet } from './bitrefill-payment-status-sheet';

type SpendBitcoinSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface BitrefillInvoice {
  invoiceId: string;
  paymentUri: string;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';
type DeliveryStatus = 'partial_delivery' | 'all_delivered' | 'all_error' | null;

export function SpendBitcoinSheet({ open, onOpenChange }: SpendBitcoinSheetProps) {
  const { walletState, refreshBalance } = useWallet();
  const [balanceUSD, setBalanceUSD] = useState<number>(0);

  // Bitrefill state
  const [currentInvoice, setCurrentInvoice] = useState<BitrefillInvoice | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Build Bitrefill URL with required parameters
  const bitrefillUrl = useMemo(() => {
    const url = new URL('https://embed.bitrefill.com/');
    url.searchParams.set('ref', 'evento_token_55');
    url.searchParams.set('utm_source', 'evento');
    url.searchParams.set('paymentMethod', 'lightning');
    url.searchParams.set('showPaymentInfo', 'true');
    url.searchParams.set('theme', 'light');
    return url.toString();
  }, []);

  // Fetch USD balance
  useEffect(() => {
    const fetchUSD = async () => {
      if (walletState.balance > 0) {
        try {
          const usd = await BTCPriceService.satsToUSD(walletState.balance);
          setBalanceUSD(usd);
        } catch (error) {
          console.error('Failed to fetch USD balance:', error);
        }
      } else {
        setBalanceUSD(0);
      }
    };
    fetchUSD();
  }, [walletState.balance]);

  // Handle Bitrefill iframe messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://embed.bitrefill.com') return;

      const data = e.data;
      if (!data || typeof data !== 'object') return;

      const { event, invoiceId, paymentUri, status, deliveryStatus: msgDeliveryStatus } = data;

      switch (event) {
        case 'invoice_created':
          // Store invoice for when user clicks "open in wallet"
          if (invoiceId && paymentUri) {
            setCurrentInvoice({ invoiceId, paymentUri });
          }
          break;

        case 'payment_intent':
          // User clicked "open in wallet" - show confirmation sheet
          if (invoiceId && paymentUri) {
            setCurrentInvoice({ invoiceId, paymentUri });
            setShowConfirmation(true);
          }
          break;

        case 'invoice_update':
          // Track status: payment_detected, payment_confirmed, expired, refunded
          if (status === 'payment_confirmed') {
            setPaymentStatus('success');
          } else if (status === 'expired' || status === 'refunded') {
            setPaymentStatus('error');
            setShowStatusSheet(true);
          }
          break;

        case 'invoice_complete':
          // Final delivery status
          setDeliveryStatus(msgDeliveryStatus || null);
          setPaymentStatus(msgDeliveryStatus === 'all_error' ? 'error' : 'success');
          setShowStatusSheet(true);
          // Refresh balance after successful purchase
          refreshBalance();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshBalance]);

  // Handle payment confirmation
  const handlePaymentConfirm = useCallback(() => {
    setShowConfirmation(false);
    setPaymentStatus('processing');
    setShowStatusSheet(true);
  }, []);

  // Handle payment cancel
  const handlePaymentCancel = useCallback(() => {
    setShowConfirmation(false);
    setCurrentInvoice(null);
  }, []);

  // Handle status sheet close
  const handleStatusClose = useCallback(() => {
    setShowStatusSheet(false);
    setPaymentStatus('idle');
    setDeliveryStatus(null);
    setCurrentInvoice(null);
  }, []);

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (open) {
      setIframeLoaded(false);
    } else {
      setCurrentInvoice(null);
      setShowConfirmation(false);
      setPaymentStatus('idle');
      setDeliveryStatus(null);
      setShowStatusSheet(false);
      setIframeLoaded(false);
    }
  }, [open]);

  return (
    <>
      <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className='flex h-full flex-col'>
              {/* Handle */}
              <div className='mb-1 mt-2 flex items-center'>
                <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
              </div>

              {/* Header with Balance */}
              <div className='flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3'>
                <h2 className='text-xl font-semibold'>Spend Bitcoin</h2>
                <div className='flex items-center gap-3'>
                  <div className='text-right'>
                    <div className='text-sm font-semibold text-gray-900'>
                      ${balanceUSD.toFixed(2)}
                    </div>
                    <div className='text-xs text-gray-500'>available</div>
                  </div>
                  <button
                    onClick={() => onOpenChange(false)}
                    className='rounded-full p-1 hover:bg-gray-100'
                  >
                    <X className='h-5 w-5 text-gray-500' />
                  </button>
                </div>
              </div>

              {/* Bitrefill Iframe */}
              <div className='relative min-h-0 flex-1'>
                {!iframeLoaded && (
                  <div className='absolute inset-0 flex items-center justify-center bg-white'>
                    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                  </div>
                )}
                <iframe
                  src={bitrefillUrl}
                  className='h-full w-full border-0'
                  sandbox='allow-same-origin allow-popups allow-scripts allow-forms'
                  title='Bitrefill'
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>

      {/* Payment Confirmation Sheet */}
      {currentInvoice && (
        <BitrefillPaymentConfirmationSheet
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          paymentUri={currentInvoice.paymentUri}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Payment Status Sheet */}
      <BitrefillPaymentStatusSheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
        status={paymentStatus === 'idle' ? 'processing' : paymentStatus}
        deliveryStatus={deliveryStatus}
        onClose={handleStatusClose}
      />
    </>
  );
}
