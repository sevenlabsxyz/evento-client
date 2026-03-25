'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { useBatchZapPayments } from '@/lib/hooks/use-batch-zap-payments';
import { useWallet } from '@/lib/hooks/use-wallet';
import { breezSDK } from '@/lib/services/breez-sdk';
import {
  BatchZapAmountMode,
  BatchZapRecipientSummary,
  validateBatchZap,
} from '@/lib/utils/batch-zap';
import { toast } from '@/lib/utils/toast';
import { AlertTriangle, CheckCircle2, Info, Loader2, TriangleAlert, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface BatchZapSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientSummary: BatchZapRecipientSummary;
}

const SUMMARY_ROW_CLASS =
  'flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3';

export function BatchZapSheet({ open, onOpenChange, recipientSummary }: BatchZapSheetProps) {
  const router = useRouter();
  const { walletState } = useWallet();
  const { progress, reset, sendBatch } = useBatchZapPayments();
  const [amountMode, setAmountMode] = useState<BatchZapAmountMode | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const enteredAmountSats = useMemo(() => {
    if (!amountInput.trim()) return 0;

    const parsed = Number.parseInt(amountInput, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountInput]);

  const validation = useMemo(
    () =>
      validateBatchZap({
        amountMode,
        enteredAmountSats,
        recipientCount: recipientSummary.eligibleRecipients.length,
      }),
    [amountMode, enteredAmountSats, recipientSummary.eligibleRecipients.length]
  );

  const sentResults = progress.results.filter((result) => result.status === 'sent');
  const failedResults = progress.results.filter((result) => result.status === 'failed');
  const skippedResults = progress.results.filter((result) => result.status === 'skipped');
  const totalSentSats = sentResults.reduce((sum, result) => sum + result.amountSats, 0);
  const recipientContextLine = useMemo(() => {
    const parts: string[] = [];

    if (recipientSummary.eligibleRecipients.length > 0) {
      parts.push(
        `This batch will go to ${recipientSummary.eligibleRecipients.length} ${
          recipientSummary.eligibleRecipients.length === 1 ? 'guest' : 'guests'
        }.`
      );
    }

    if (recipientSummary.excludedSelf.length > 0) {
      parts.push('You are excluded.');
    }

    if (recipientSummary.isViewerHost && recipientSummary.excludedHosts.length > 0) {
      parts.push(
        `${recipientSummary.excludedHosts.length} ${
          recipientSummary.excludedHosts.length === 1 ? 'host is' : 'hosts are'
        } excluded from this send.`
      );
    }

    if (recipientSummary.excludedNoLightning.length > 0) {
      parts.push(
        `${recipientSummary.excludedNoLightning.length} ${
          recipientSummary.excludedNoLightning.length === 1 ? 'guest' : 'guests'
        } without an Evento wallet can't receive this batch zap.`
      );
    }

    return parts.join(' ');
  }, [recipientSummary]);

  useEffect(() => {
    if (!open) {
      setAmountMode(null);
      setAmountInput('');
      reset();
    }
  }, [open, reset]);

  const hasExistingWallet = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    const walletStateRaw = localStorage.getItem(STORAGE_KEYS.WALLET_STATE);
    const encryptedSeed = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_SEED);

    if (encryptedSeed) {
      return true;
    }

    if (!walletStateRaw) {
      return false;
    }

    try {
      const parsedState = JSON.parse(walletStateRaw);
      return Boolean(parsedState?.isInitialized);
    } catch {
      return true;
    }
  };

  const handleUnlockWallet = () => {
    if (typeof window !== 'undefined') {
      const returnPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      localStorage.setItem(STORAGE_KEYS.WALLET_UNLOCK_RETURN_PATH, returnPath);
    }
    router.push('/e/wallet');
  };

  const showWalletUnlockToast = () => {
    const walletExists = hasExistingWallet();
    const actionLabel = walletExists ? 'Unlock wallet' : 'Create wallet';
    const descriptionText = walletExists
      ? 'Please unlock your Wallet to continue.'
      : 'Please create your Wallet to continue.';

    toast.custom(
      (id) => (
        <div className='w-full border border-blue-200 bg-blue-50 p-6 shadow-lg rounded-[28px]'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white'>
              <Info className='h-4 w-4' />
            </div>
            <div className='min-w-0'>
              <p className='text-base font-semibold leading-none tracking-tight text-slate-900'>
                Wallet action needed
              </p>
              <p className='mt-3 text-[16px] leading-[1.3] text-slate-700'>{descriptionText}</p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => {
              toast.dismiss(id);
              handleUnlockWallet();
            }}
            className='mt-5 h-12 w-full rounded-full bg-blue-600 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-700'
          >
            {actionLabel}
          </button>
        </div>
      ),
      {
        unstyled: true,
      }
    );
  };

  const handleConfirm = async () => {
    if (!validation.valid || !amountMode || !validation.distribution) {
      return;
    }

    if (!walletState.isConnected || !breezSDK.isConnected()) {
      onOpenChange(false);
      showWalletUnlockToast();
      return;
    }

    try {
      await sendBatch({
        recipients: recipientSummary.eligibleRecipients,
        amountMode,
        amountSats: enteredAmountSats,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start batch zap');
    }
  };

  const handleSheetChange = (nextOpen: boolean) => {
    if (!nextOpen && progress.status === 'sending') {
      return;
    }

    onOpenChange(nextOpen);
  };

  const sheetTitle =
    progress.status === 'sending'
      ? 'Sending Zaps'
      : progress.status === 'completed'
        ? 'Batch Zap Complete'
        : 'Zap All';

  const footer =
    progress.status === 'sending' ? null : progress.status === 'completed' ? (
      <Button className='w-full rounded-full' onClick={() => onOpenChange(false)}>
        Done
      </Button>
    ) : (
      <div className='flex gap-3'>
        <Button
          variant='outline'
          className='flex-1 rounded-full'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          className='flex-1 rounded-full bg-red-500 text-white hover:bg-red-600'
          disabled={!validation.valid}
          onClick={handleConfirm}
        >
          Confirm and send
        </Button>
      </div>
    );

  return (
    <MasterScrollableSheet
      title={sheetTitle}
      open={open}
      onOpenChange={handleSheetChange}
      headerRight={
        progress.status === 'sending' ? (
          <div className='flex items-center gap-3'>
            <WalletBalanceDisplay size='sm' />
            <div className='h-10 w-10' />
          </div>
        ) : undefined
      }
      footer={footer}
      contentClassName='px-4 pb-6 pt-4'
    >
      {progress.status === 'sending' ? (
        <div className='space-y-6'>
          <div className='rounded-3xl border border-amber-200 bg-amber-50 p-5'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
              <div>
                <p className='font-semibold text-amber-900'>Don&apos;t leave this screen</p>
                <p className='mt-1 text-sm text-amber-800'>
                  Keep Evento open and avoid switching tabs or apps. These payments are being sent
                  directly from your self-custody wallet on this device.
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-3xl bg-black px-5 py-6 text-white'>
            <div className='flex items-center gap-3'>
              <Loader2 className='h-6 w-6 animate-spin text-red-400' />
              <div>
                <p className='text-sm uppercase tracking-[0.18em] text-white/60'>Batch Zap</p>
                <p className='text-2xl font-semibold'>
                  Sending payment {progress.currentIndex} of {progress.totalCount}
                </p>
              </div>
            </div>

            <div className='mt-6 h-2 overflow-hidden rounded-full bg-white/15'>
              <div
                className='h-full rounded-full bg-red-400 transition-all'
                style={{
                  width:
                    progress.totalCount > 0
                      ? `${Math.min((progress.results.length / progress.totalCount) * 100, 100)}%`
                      : '0%',
                }}
              />
            </div>

            <div className='mt-6 grid grid-cols-3 gap-3 text-center text-sm'>
              <div className='rounded-2xl bg-white/10 px-3 py-3'>
                <div className='text-xl font-semibold'>{progress.sentCount}</div>
                <div className='text-white/70'>Sent</div>
              </div>
              <div className='rounded-2xl bg-white/10 px-3 py-3'>
                <div className='text-xl font-semibold'>{progress.failedCount}</div>
                <div className='text-white/70'>Failed</div>
              </div>
              <div className='rounded-2xl bg-white/10 px-3 py-3'>
                <div className='text-xl font-semibold'>{progress.remainingCount}</div>
                <div className='text-white/70'>Remaining</div>
              </div>
            </div>
          </div>

          <div className='rounded-3xl border border-gray-200 bg-white p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-gray-500'>
              Current recipient
            </p>
            <p className='mt-2 text-lg font-semibold text-gray-900'>
              {progress.currentRecipient?.name || 'Preparing next payment'}
            </p>
            <p className='text-sm text-gray-500'>
              {progress.currentRecipient?.username
                ? `@${progress.currentRecipient.username}`
                : 'Processing Lightning payment'}
            </p>
          </div>
        </div>
      ) : progress.status === 'completed' ? (
        <div className='space-y-6'>
          <div
            className={`rounded-3xl p-5 ${
              failedResults.length === 0 && skippedResults.length === 0
                ? 'border border-green-200 bg-green-50'
                : 'border border-amber-200 bg-amber-50'
            }`}
          >
            <div className='flex items-start gap-3'>
              {failedResults.length === 0 && skippedResults.length === 0 ? (
                <CheckCircle2 className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-600' />
              ) : (
                <TriangleAlert className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
              )}
              <div>
                <p className='font-semibold text-gray-900'>
                  {failedResults.length === 0 && skippedResults.length === 0
                    ? 'All payments were sent'
                    : 'Batch finished with some issues'}
                </p>
                <p className='mt-1 text-sm text-gray-700'>
                  {sentResults.length} payment{sentResults.length === 1 ? '' : 's'} sent for{' '}
                  {totalSentSats.toLocaleString()} sats.
                </p>
              </div>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='rounded-2xl bg-gray-50 px-4 py-4 text-center'>
              <div className='text-2xl font-semibold text-gray-900'>{sentResults.length}</div>
              <div className='text-sm text-gray-500'>Sent</div>
            </div>
            <div className='rounded-2xl bg-gray-50 px-4 py-4 text-center'>
              <div className='text-2xl font-semibold text-gray-900'>{failedResults.length}</div>
              <div className='text-sm text-gray-500'>Failed</div>
            </div>
            <div className='rounded-2xl bg-gray-50 px-4 py-4 text-center'>
              <div className='text-2xl font-semibold text-gray-900'>{skippedResults.length}</div>
              <div className='text-sm text-gray-500'>Skipped</div>
            </div>
          </div>

          {(failedResults.length > 0 || skippedResults.length > 0) && (
            <div className='space-y-3'>
              <h3 className='text-base font-semibold text-gray-900'>Needs attention</h3>
              {failedResults.map((result) => (
                <div
                  key={`failed-${result.recipient.userId}`}
                  className='rounded-2xl border border-red-100 bg-red-50 px-4 py-3'
                >
                  <div className='flex items-start gap-3'>
                    <XCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500' />
                    <div>
                      <p className='font-medium text-gray-900'>{result.recipient.name}</p>
                      <p className='text-sm text-red-700'>{result.error || 'Payment failed'}</p>
                    </div>
                  </div>
                </div>
              ))}
              {skippedResults.map((result) => (
                <div
                  key={`skipped-${result.recipient.userId}`}
                  className='rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3'
                >
                  <div className='flex items-start gap-3'>
                    <Info className='mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500' />
                    <div>
                      <p className='font-medium text-gray-900'>{result.recipient.name}</p>
                      <p className='text-sm text-gray-600'>{result.error || 'Payment skipped'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-6'>
          <div className='rounded-3xl border border-gray-200 bg-white p-5'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-base font-semibold text-gray-900'>Amount</p>
                <p className='text-sm text-gray-500'>Choose how to calculate the batch.</p>
              </div>
              <WalletBalanceDisplay size='sm' />
            </div>

            <div className='mt-4 grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => setAmountMode('per-person')}
                className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                  amountMode === 'per-person'
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className='font-medium'>Per person</p>
                <p className='mt-1 text-sm opacity-80'>Each guest gets the entered amount.</p>
              </button>
              <button
                type='button'
                onClick={() => setAmountMode('total-split')}
                className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                  amountMode === 'total-split'
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <p className='font-medium'>Total split</p>
                <p className='mt-1 text-sm opacity-80'>Divide the total across all recipients.</p>
              </button>
            </div>

            <div className='mt-4'>
              <label
                htmlFor='batch-zap-amount'
                className='mb-2 block text-sm font-medium text-gray-700'
              >
                Amount in sats
              </label>
              <input
                id='batch-zap-amount'
                inputMode='numeric'
                pattern='[0-9]*'
                placeholder='Enter sats'
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value.replace(/[^\d]/g, ''))}
                className='h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-red-200'
              />
              <p className='mt-2 text-xs text-gray-500'>
                Minimum {5} sats per guest. Total-split keeps any remainder in your wallet.
              </p>
              {recipientContextLine && (
                <p className='mt-3 text-sm leading-6 text-gray-600'>{recipientContextLine}</p>
              )}
            </div>
          </div>

          {validation.distribution && (
            <div className='space-y-3 rounded-3xl border border-gray-200 bg-white p-5'>
              <h3 className='text-base font-semibold text-gray-900'>Send summary</h3>
              <div className={SUMMARY_ROW_CLASS}>
                <span className='text-sm text-gray-500'>Recipients</span>
                <span className='font-semibold text-gray-900'>
                  {validation.distribution.recipientCount}
                </span>
              </div>
              <div className={SUMMARY_ROW_CLASS}>
                <span className='text-sm text-gray-500'>Per recipient</span>
                <span className='font-semibold text-gray-900'>
                  {validation.distribution.perRecipientAmountSats.toLocaleString()} sats
                </span>
              </div>
              <div className={SUMMARY_ROW_CLASS}>
                <span className='text-sm text-gray-500'>Total to send</span>
                <span className='font-semibold text-gray-900'>
                  {validation.distribution.totalAmountSats.toLocaleString()} sats
                </span>
              </div>
              {validation.distribution.leftoverSats > 0 && (
                <div className={SUMMARY_ROW_CLASS}>
                  <span className='text-sm text-gray-500'>Remainder kept in wallet</span>
                  <span className='font-semibold text-gray-900'>
                    {validation.distribution.leftoverSats.toLocaleString()} sats
                  </span>
                </div>
              )}
            </div>
          )}

          {!validation.valid && amountInput && (
            <div className='rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
              {validation.error}
            </div>
          )}
        </div>
      )}
    </MasterScrollableSheet>
  );
}
