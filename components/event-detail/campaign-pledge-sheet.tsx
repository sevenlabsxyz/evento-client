'use client';

import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useCreatePledgeIntent, usePledgeStatus } from '@/lib/hooks/use-campaign-pledge';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { queryKeys } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Loader2, QrCode, RotateCcw, Wallet, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const QUICK_AMOUNTS = [21, 100, 500, 1000, 5000];

type PledgeStep = 'amount' | 'invoice' | 'settled' | 'expired' | 'failed';
type InvoiceView = 'options' | 'qr';

interface CampaignPledgeSheetProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatSats(sats: number): string {
  return sats.toLocaleString();
}

export function CampaignPledgeSheet({ eventId, open, onOpenChange }: CampaignPledgeSheetProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<PledgeStep>('amount');
  const [invoiceView, setInvoiceView] = useState<InvoiceView>('options');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [pledgeId, setPledgeId] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const hasHandledSettled = useRef(false);

  const createPledge = useCreatePledgeIntent('event');
  const { data: pledgeStatus } = usePledgeStatus(pledgeId);
  const { data: campaign } = useEventCampaign(eventId);
  const { walletState } = useWallet();
  const { sendPayment, isLoading: isWalletPaying } = useSendPayment();

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep('amount');
      setInvoiceView('options');
      setSelectedAmount(null);
      setStep('amount');
      setSelectedAmount(null);
      setPledgeId('');
      setInvoice('');
      setCopied(false);
      hasHandledSettled.current = false;
      createPledge.reset();
    }
  }, [open]);

  // React to pledge status changes
  useEffect(() => {
    if (!pledgeStatus || step !== 'invoice') return;

    if (pledgeStatus.status === 'settled' && !hasHandledSettled.current) {
      hasHandledSettled.current = true;
      setStep('settled');

      // Invalidate campaign data so the card refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.eventCampaign(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });

      // Auto-close after success display
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2500);
      return () => clearTimeout(timer);
    }

    if (pledgeStatus.status === 'expired') {
      setStep('expired');
    }

    if (pledgeStatus.status === 'failed') {
      setStep('failed');
    }
  }, [pledgeStatus, step, eventId, queryClient, onOpenChange]);

  const handleSelectAmount = useCallback((amount: number) => {
    setSelectedAmount(amount);
  }, []);

  const handleCreatePledge = useCallback(() => {
    if (!selectedAmount) return;

    createPledge.mutate(
      { amountSats: selectedAmount, eventId },
      {
        onSuccess: (result) => {
          setPledgeId(result.pledgeId);
          setInvoice(result.invoice);
          setStep('invoice');
        },
        onError: () => {
          toast.error('Failed to create pledge. Please try again.');
        },
      }
    );
  }, [selectedAmount, eventId, createPledge]);

  const handleCopyInvoice = useCallback(async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast.success('Invoice copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy invoice');
    }
  }, [invoice]);

  const handleTryAgain = useCallback(() => {
    setPledgeId('');
    setInvoice('');
    setCopied(false);
    hasHandledSettled.current = false;
    createPledge.reset();
    setInvoiceView('options');
    setStep('amount');
  }, [createPledge]);

  const renderAmountStep = () => (
    <div className='px-4 pb-6'>
      <p className='mb-6 text-sm text-gray-600'>
        {campaign?.title ? `Contribute to "${campaign.title}"` : 'Choose an amount to contribute'}
      </p>

      {/* Quick amounts grid */}
      <div className='mb-6 grid grid-cols-3 gap-3'>
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleSelectAmount(amount)}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 transition-all',
              selectedAmount === amount
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <span className='text-lg font-bold tabular-nums text-gray-900'>
              {formatSats(amount)}
            </span>
            <span className='text-xs text-gray-500'>sats</span>
          </button>
        ))}
      </div>

      {/* Proceed button */}
      <button
        onClick={handleCreatePledge}
        disabled={!selectedAmount || createPledge.isPending}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors',
          selectedAmount
            ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        )}
      >
        {createPledge.isPending ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            Creating invoice…
          </>
        ) : (
          <>
            <Zap className='h-4 w-4' />
            {selectedAmount ? `Contribute ${formatSats(selectedAmount)} sats` : 'Select an amount'}
          </>
        )}
      </button>
    </div>
  );

  const handleWalletPay = useCallback(async () => {
    if (!invoice) return;
    try {
      await sendPayment(invoice);
      // Payment sent — the pledge status poller will advance to 'settled'
    } catch {
      toast.error('Payment failed. Try copying the invoice instead.');
    }
  }, [invoice, sendPayment]);

  const renderInvoiceOptionsView = () => (
    <div className='flex flex-col gap-3 px-4 pb-6'>
      <p className='mb-2 text-center text-sm text-gray-600'>
        Pay <span className='font-semibold'>{formatSats(selectedAmount ?? 0)} sats</span>
      </p>

      {/* Pay with Evento wallet */}
      <button
        onClick={handleWalletPay}
        disabled={!walletState.isConnected || isWalletPaying}
        className={cn(
          'flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all',
          walletState.isConnected
            ? 'border-amber-400 bg-amber-50 hover:bg-amber-100 active:bg-amber-200'
            : 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
        )}
      >
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100'>
          {isWalletPaying ? (
            <Loader2 className='h-5 w-5 animate-spin text-amber-600' />
          ) : (
            <Wallet className='h-5 w-5 text-amber-600' />
          )}
        </div>
        <div>
          <p className='text-sm font-semibold text-gray-900'>
            {isWalletPaying ? 'Paying…' : 'Pay with Evento wallet'}
          </p>
          <p className='text-xs text-gray-500'>
            {walletState.isConnected ? 'Instant payment from your balance' : 'Wallet not connected'}
          </p>
        </div>
      </button>

      {/* View QR code */}
      <button
        onClick={() => setInvoiceView('qr')}
        className='flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 text-left transition-all hover:border-gray-300 hover:bg-gray-50'
      >
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100'>
          <QrCode className='h-5 w-5 text-gray-600' />
        </div>
        <div>
          <p className='text-sm font-semibold text-gray-900'>View QR code</p>
          <p className='text-xs text-gray-500'>Scan or copy for any Lightning wallet</p>
        </div>
      </button>

      {/* Waiting indicator */}
      <div className='mt-2 flex items-center justify-center gap-2 text-sm text-gray-400'>
        <Loader2 className='h-4 w-4 animate-spin' />
        Waiting for payment…
      </div>
    </div>
  );

  const renderInvoiceQRView = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <button
        onClick={() => setInvoiceView('options')}
        className='mb-4 flex items-center gap-1 self-start text-sm text-gray-500 hover:text-gray-700'
      >
        ← Back
      </button>
      <p className='mb-4 text-center text-sm text-gray-600'>
        Scan or copy the invoice to pay{' '}
        <span className='font-semibold'>{formatSats(selectedAmount ?? 0)} sats</span>
      </p>

      {/* QR Code */}
      <div className='mb-4'>
        <EventoQRCode value={invoice} size={220} showLogo={false} />
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopyInvoice}
        className='mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100'
      >
        {copied ? (
          <>
            <CheckCircle2 className='h-4 w-4 text-emerald-500' />
            Copied!
          </>
        ) : (
          <>
            <Copy className='h-4 w-4' />
            Copy invoice
          </>
        )}
      </button>

      {/* Waiting indicator */}
      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <Loader2 className='h-4 w-4 animate-spin' />
        Waiting for payment…
      </div>
    </div>
  );

  const renderInvoiceStep = () =>
    invoiceView === 'options' ? renderInvoiceOptionsView() : renderInvoiceQRView();

  const renderSettledStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
        <CheckCircle2 className='h-8 w-8 text-emerald-600' />
      </div>
      <h3 className='mb-1 text-xl font-bold text-gray-900'>Thank you!</h3>
      <p className='text-center text-sm text-gray-600'>
        Your contribution of{' '}
        <span className='font-semibold'>{formatSats(selectedAmount ?? 0)} sats</span> has been
        received.
      </p>
    </div>
  );

  const renderExpiredStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
        <RotateCcw className='h-8 w-8 text-red-500' />
      </div>
      <h3 className='mb-1 text-xl font-bold text-gray-900'>Invoice expired</h3>
      <p className='mb-6 text-center text-sm text-gray-600'>
        The payment window has closed. You can try again with a new invoice.
      </p>
      <button
        onClick={handleTryAgain}
        className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700'
      >
        <RotateCcw className='h-4 w-4' />
        Try again
      </button>
    </div>
  );

  const renderFailedStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
        <RotateCcw className='h-8 w-8 text-red-500' />
      </div>
      <h3 className='mb-1 text-xl font-bold text-gray-900'>Payment failed</h3>
      <p className='mb-6 text-center text-sm text-gray-600'>
        We could not confirm this payment. You can try again with a new invoice.
      </p>
      <button
        onClick={handleTryAgain}
        className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700'
      >
        <RotateCcw className='h-4 w-4' />
        Try again
      </button>
    </div>
  );

  const stepContent: Record<PledgeStep, () => React.ReactNode> = {
    amount: renderAmountStep,
    invoice: renderInvoiceStep,
    settled: renderSettledStep,
    expired: renderExpiredStep,
    failed: renderFailedStep,
  };

  const stepTitle: Record<PledgeStep, string> = {
    amount: 'Contribute',
    invoice: 'Pay Invoice',
    settled: 'Payment Received',
    expired: 'Invoice Expired',
    failed: 'Payment Failed',
  };

  return (
    <MasterScrollableSheet title={stepTitle[step]} open={open} onOpenChange={onOpenChange}>
      {stepContent[step]()}
    </MasterScrollableSheet>
  );
}
