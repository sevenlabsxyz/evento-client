'use client';

import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import {
  useCreatePledgeIntent,
  usePledgeStatus,
} from '@/lib/hooks/use-campaign-pledge';
import { useProfileCampaign } from '@/lib/hooks/use-profile-campaign';
import { queryKeys } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Loader2, RotateCcw, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const QUICK_AMOUNTS = [21, 100, 500, 1000, 5000];

type PledgeStep = 'amount' | 'invoice' | 'settled' | 'expired';

interface ProfileCampaignPledgeSheetProps {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatSats(sats: number): string {
  return sats.toLocaleString();
}

export function ProfileCampaignPledgeSheet({
  username,
  open,
  onOpenChange,
}: ProfileCampaignPledgeSheetProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<PledgeStep>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [pledgeId, setPledgeId] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const hasHandledSettled = useRef(false);

  const createPledge = useCreatePledgeIntent('profile');
  const { data: pledgeStatus } = usePledgeStatus(pledgeId);
  const { data: campaign } = useProfileCampaign(username);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
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

      // Invalidate profile campaign data so the card refreshes
      queryClient.invalidateQueries({ queryKey: queryKeys.profileCampaign(username) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });

      // Auto-close after success display
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2500);
      return () => clearTimeout(timer);
    }

    if (pledgeStatus.status === 'expired') {
      setStep('expired');
    }
  }, [pledgeStatus, step, username, queryClient, onOpenChange]);

  const handleSelectAmount = useCallback((amount: number) => {
    setSelectedAmount(amount);
  }, []);

  const handleCreatePledge = useCallback(() => {
    if (!selectedAmount) return;

    createPledge.mutate(
      { amountSats: selectedAmount, username },
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
  }, [selectedAmount, createPledge, username]);

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
    setStep('amount');
  }, [createPledge]);

  const renderAmountStep = () => (
    <div className='px-4 pb-6'>
      <p className='mb-6 text-sm text-gray-600'>
        {campaign?.title
          ? `Contribute to "${campaign.title}"`
          : 'Choose an amount to contribute'}
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
            {selectedAmount
              ? `Contribute ${formatSats(selectedAmount)} sats`
              : 'Select an amount'}
          </>
        )}
      </button>
    </div>
  );

  const renderInvoiceStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
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

  const renderSettledStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
        <CheckCircle2 className='h-8 w-8 text-emerald-600' />
      </div>
      <h3 className='mb-1 text-xl font-bold text-gray-900'>Thank you!</h3>
      <p className='text-center text-sm text-gray-600'>
        Your contribution of{' '}
        <span className='font-semibold'>{formatSats(selectedAmount ?? 0)} sats</span>{' '}
        has been received.
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

  const stepContent: Record<PledgeStep, () => React.ReactNode> = {
    amount: renderAmountStep,
    invoice: renderInvoiceStep,
    settled: renderSettledStep,
    expired: renderExpiredStep,
  };

  const stepTitle: Record<PledgeStep, string> = {
    amount: 'Contribute',
    invoice: 'Pay Invoice',
    settled: 'Payment Received',
    expired: 'Invoice Expired',
  };

  return (
    <MasterScrollableSheet
      title={stepTitle[step]}
      open={open}
      onOpenChange={onOpenChange}
    >
      {stepContent[step]()}
    </MasterScrollableSheet>
  );
}
