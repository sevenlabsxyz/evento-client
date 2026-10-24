'use client';

import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useCreatePledgeIntent, usePledgeStatus } from '@/lib/hooks/use-campaign-pledge';
import { useProfileCampaign } from '@/lib/hooks/use-profile-campaign';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { queryKeys } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Loader2, RotateCcw, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

const QUICK_AMOUNTS = [21, 100, 500, 1000, 5000];

type PledgeStep = 'amount' | 'invoice' | 'settled' | 'expired';

interface ProfileCampaignPledgeSheetProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatSats(sats: number, locale: string): string {
  return sats.toLocaleString(getIntlLocale(locale));
}

export function ProfileCampaignPledgeSheet({
  userId,
  open,
  onOpenChange,
}: ProfileCampaignPledgeSheetProps) {
  const t = useTranslations('profile');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<PledgeStep>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [pledgeId, setPledgeId] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const hasHandledSettled = useRef(false);

  const createPledge = useCreatePledgeIntent('profile');
  const { data: pledgeStatus } = usePledgeStatus(pledgeId);
  const { data: campaign } = useProfileCampaign(userId);

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
      queryClient.invalidateQueries({ queryKey: queryKeys.profileCampaign(userId) });
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
  }, [pledgeStatus, step, userId, queryClient, onOpenChange]);

  const handleSelectAmount = useCallback((amount: number) => {
    setSelectedAmount(amount);
  }, []);

  const handleCreatePledge = useCallback(() => {
    if (!selectedAmount) return;

    createPledge.mutate(
      { amountSats: selectedAmount, userId },
      {
        onSuccess: (result) => {
          setPledgeId(result.pledgeId);
          setInvoice(result.invoice);
          setStep('invoice');
        },
        onError: () => {
          toast.error(t('campaign.pledge.createFailed'));
        },
      }
    );
  }, [selectedAmount, createPledge, userId, t]);

  const handleCopyInvoice = useCallback(async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast.success(t('campaign.pledge.invoiceCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('campaign.pledge.copyInvoiceFailed'));
    }
  }, [invoice, t]);

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
      <p className='mb-6 text-sm text-gray-600 dark:text-neutral-400'>
        {campaign?.title
          ? t('campaign.pledge.contributeTo', { title: campaign.title })
          : t('campaign.pledge.chooseAmount')}
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
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
            )}
          >
            <span className='text-lg font-bold tabular-nums text-gray-900 dark:text-neutral-100'>
              {formatSats(amount, locale)}
            </span>
            <span className='text-xs text-gray-500 dark:text-neutral-400'>sats</span>
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
            ? 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:active:bg-neutral-300'
            : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-neutral-700 dark:text-neutral-500'
        )}
      >
        {createPledge.isPending ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            {t('campaign.pledge.creatingInvoice')}
          </>
        ) : (
          <>
            <Zap className='h-4 w-4' />
            {selectedAmount
              ? t('campaign.pledge.contributeAmount', {
                  amount: formatSats(selectedAmount, locale),
                })
              : t('campaign.pledge.selectAmount')}
          </>
        )}
      </button>
    </div>
  );

  const renderInvoiceStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <p className='mb-4 text-center text-sm text-gray-600 dark:text-neutral-400'>
        {t.rich('campaign.pledge.scanToPay', {
          amount: formatSats(selectedAmount ?? 0, locale),
          strong: (chunks) => <span className='font-semibold'>{chunks}</span>,
        })}
      </p>

      {/* QR Code */}
      <div className='mb-4'>
        <EventoQRCode value={invoice} size={220} showLogo={false} />
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopyInvoice}
        className='mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800'
      >
        {copied ? (
          <>
            <CheckCircle2 className='h-4 w-4 text-emerald-500 dark:text-emerald-400' />
            {t('copiedBang')}
          </>
        ) : (
          <>
            <Copy className='h-4 w-4' />
            {t('campaign.pledge.copyInvoice')}
          </>
        )}
      </button>

      {/* Waiting indicator */}
      <div className='flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400'>
        <Loader2 className='h-4 w-4 animate-spin' />
        {t('campaign.pledge.waiting')}
      </div>
    </div>
  );

  const renderSettledStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60'>
        <CheckCircle2 className='h-8 w-8 text-emerald-600 dark:text-emerald-400' />
      </div>
      <h3 className='mb-1 text-xl font-bold text-gray-900 dark:text-neutral-100'>
        {t('campaign.pledge.thankYou')}
      </h3>
      <p className='text-center text-sm text-gray-600 dark:text-neutral-400'>
        {t.rich('campaign.pledge.received', {
          amount: formatSats(selectedAmount ?? 0, locale),
          strong: (chunks) => <span className='font-semibold'>{chunks}</span>,
        })}
      </p>
    </div>
  );

  const renderExpiredStep = () => (
    <div className='flex flex-col items-center px-4 pb-6'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
        <RotateCcw className='h-8 w-8 text-red-500 dark:text-red-400' />
      </div>
      <h3 className='mb-1 text-xl font-bold text-gray-900 dark:text-neutral-100'>
        {t('campaign.pledge.expiredHeading')}
      </h3>
      <p className='mb-6 text-center text-sm text-gray-600 dark:text-neutral-400'>
        {t('campaign.pledge.expiredBody')}
      </p>
      <button
        onClick={handleTryAgain}
        className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:active:bg-neutral-300'
      >
        <RotateCcw className='h-4 w-4' />
        {t('campaign.pledge.tryAgain')}
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
    amount: t('campaign.pledge.titles.amount'),
    invoice: t('campaign.pledge.titles.invoice'),
    settled: t('campaign.pledge.titles.settled'),
    expired: t('campaign.pledge.titles.expired'),
  };

  return (
    <MasterScrollableSheet title={stepTitle[step]} open={open} onOpenChange={onOpenChange}>
      {stepContent[step]()}
    </MasterScrollableSheet>
  );
}
