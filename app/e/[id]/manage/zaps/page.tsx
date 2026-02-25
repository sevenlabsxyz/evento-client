'use client';

import { Input } from '@/components/ui/input';
import {
  fetchEventZapRunRecipients,
  submitEventZapRunResults,
  useCreateEventZapRun,
  useEventZaps,
} from '@/lib/hooks/use-event-zaps';
import { useWallet } from '@/lib/hooks/use-wallet';
import { breezSDK } from '@/lib/services/breez-sdk';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  EventZapRecipientFilter,
  EventZapRun,
  EventZapRunRecipient,
  SubmitEventZapRunResultsForm,
} from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import type { LnurlPayRequestDetails } from '@breeztech/breez-sdk-spark';
import { Bolt, Loader2 } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const MIN_ZAP_SATS = 10;
const MAX_ZAP_SATS = 100_000;
const MAX_LOCAL_ZAP_ITERATIONS = 200;
const MAX_LOCAL_ZAP_PROCESS_MS = 10 * 60 * 1000;

const FILTERS: Array<{ key: EventZapRecipientFilter; label: string; description: string }> = [
  {
    key: 'all',
    label: 'Zap Everyone',
    description: 'Attempts yes, no, maybe, and pending invited recipients.',
  },
  {
    key: 'yes',
    label: 'Zap Yes',
    description: 'Attempts only guests who RSVP yes.',
  },
  {
    key: 'no',
    label: 'Zap No',
    description: 'Attempts only guests who RSVP no.',
  },
  {
    key: 'maybe',
    label: 'Zap Maybe',
    description: 'Attempts only guests who RSVP maybe.',
  },
];

export default function ManageEventZapsPage() {
  const router = useRouter();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const { walletState } = useWallet();
  const params = useParams();
  const pathname = usePathname();
  const eventId = params.id as string;

  const [amountInput, setAmountInput] = useState('100');
  const [processingRunId, setProcessingRunId] = useState<string | null>(null);
  const [localRunProgress, setLocalRunProgress] = useState<{
    runId: string;
    processed: number;
    total: number;
  } | null>(null);
  const isProcessingRef = useRef(false);

  const { data: zapRuns = [], isLoading, refetch } = useEventZaps(eventId);
  const createEventZapRun = useCreateEventZapRun(eventId);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Zaps',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, clearRoute, pathname, setTopBarForRoute]);

  const amountSats = useMemo(() => {
    const parsed = Number.parseInt(amountInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [amountInput]);

  const progressPercent = useMemo(() => {
    if (!localRunProgress || localRunProgress.total <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((localRunProgress.processed / localRunProgress.total) * 100));
  }, [localRunProgress]);

  const getSafeErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message?: unknown }).message || fallback);
    }

    return fallback;
  };

  const processRunLocally = async (run: EventZapRun) => {
    if (isProcessingRef.current) {
      toast.info('A zap run is already being processed on this device.');
      return;
    }

    if (!walletState.isConnected) {
      toast.error('Your wallet is local to this device. Unlock it to process zaps.');
      router.push('/e/wallet');
      return;
    }

    const pendingRecipientsEstimate = Math.max(run.total_recipients - run.processed_recipients, 0);

    if (pendingRecipientsEstimate === 0) {
      toast.info('This run has no pending recipients.');
      return;
    }

    const estimatedTotalSats = pendingRecipientsEstimate * run.amount_sats;
    const shouldProceed = window.confirm(
      `You are about to attempt up to ${pendingRecipientsEstimate.toLocaleString()} zaps at ${run.amount_sats.toLocaleString()} sats each (up to ${estimatedTotalSats.toLocaleString()} sats total) from your local wallet. Continue?`
    );

    if (!shouldProceed) {
      toast.info('Zap run remains queued.');
      return;
    }

    isProcessingRef.current = true;
    setProcessingRunId(run.id);
    setLocalRunProgress({
      runId: run.id,
      processed: 0,
      total: pendingRecipientsEstimate,
    });

    try {
      const startedAt = Date.now();
      let loopIterations = 0;
      let processedInSession = 0;

      while (true) {
        loopIterations += 1;

        if (loopIterations > MAX_LOCAL_ZAP_ITERATIONS) {
          throw new Error('Stopped processing after reaching the local batch safety limit.');
        }

        if (Date.now() - startedAt > MAX_LOCAL_ZAP_PROCESS_MS) {
          throw new Error('Stopped processing after reaching the local processing timeout.');
        }

        const pendingRecipients = await fetchEventZapRunRecipients(eventId, run.id, {
          status: 'pending',
          limit: 20,
        });

        if (pendingRecipients.length === 0) {
          break;
        }

        const payload: SubmitEventZapRunResultsForm = { results: [] };

        for (const recipient of pendingRecipients) {
          const result = await processRecipientLocally(recipient, run.amount_sats);
          payload.results.push(result);

          processedInSession += 1;
          setLocalRunProgress({
            runId: run.id,
            processed: Math.min(processedInSession, pendingRecipientsEstimate),
            total: pendingRecipientsEstimate,
          });
        }

        await submitEventZapRunResults(eventId, run.id, payload);
        await refetch();
      }

      toast.success('Finished processing zap run with local wallet');
    } catch (error) {
      const message = getSafeErrorMessage(error, 'Failed to process zap run');

      logger.error('Local zap run processing failed', {
        eventId,
        runId: run.id,
        error,
      });

      toast.error(message);
    } finally {
      isProcessingRef.current = false;
      setProcessingRunId(null);
      setLocalRunProgress(null);
      await refetch();
    }
  };

  useEffect(() => {
    if (!processingRunId) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [processingRunId]);

  const processRecipientLocally = async (
    recipient: EventZapRunRecipient,
    perRecipientAmountSats: number
  ): Promise<SubmitEventZapRunResultsForm['results'][number]> => {
    if (!recipient.recipient_lightning_address) {
      if (recipient.recipient_user_id || recipient.recipient_email) {
        return {
          recipientId: recipient.id,
          status: 'fallback_emailed',
          failureReason: 'Missing lightning address. Triggering fallback email.',
        };
      }

      return {
        recipientId: recipient.id,
        status: 'failed',
        failureReason: 'Recipient missing lightning address and fallback contact.',
      };
    }

    try {
      const parsedInput = await breezSDK.parseInput(recipient.recipient_lightning_address);

      if (parsedInput.type !== 'lightningAddress') {
        return {
          recipientId: recipient.id,
          status: 'failed',
          failureReason: 'Recipient lightning input is not a lightning address.',
        };
      }

      const payRequest = (parsedInput as unknown as { payRequest: LnurlPayRequestDetails })
        .payRequest;
      const prepareResponse = await breezSDK.prepareLnurlPay({
        payRequest,
        amountSats: perRecipientAmountSats,
      });

      await breezSDK.lnurlPay({ prepareResponse });

      const paymentInfo =
        prepareResponse && typeof prepareResponse === 'object' && 'destination' in prepareResponse
          ? (prepareResponse as { destination?: unknown }).destination
          : undefined;

      return {
        recipientId: recipient.id,
        status: 'attempted',
        invoiceBolt11:
          typeof paymentInfo === 'string' && paymentInfo.length > 0 ? paymentInfo : undefined,
      };
    } catch (error) {
      const message = getSafeErrorMessage(error, 'Local zap attempt failed');

      logger.error('Local recipient zap attempt failed', {
        eventId,
        recipientId: recipient.id,
        recipientLightningAddress: recipient.recipient_lightning_address,
        error,
      });

      return {
        recipientId: recipient.id,
        status: 'failed',
        failureReason: message,
      };
    }
  };

  const handleStartRun = async (recipientFilter: EventZapRecipientFilter) => {
    if (isProcessingRef.current || processingRunId) {
      toast.info('Finish the current local zap run before starting a new one.');
      return;
    }

    if (!amountSats || amountSats < MIN_ZAP_SATS || amountSats > MAX_ZAP_SATS) {
      toast.error(
        `Enter a zap amount between ${MIN_ZAP_SATS.toLocaleString()} and ${MAX_ZAP_SATS.toLocaleString()} sats.`
      );
      return;
    }

    try {
      const createdRun = await createEventZapRun.mutateAsync({
        recipientFilter,
        amountSats,
      });

      toast.success('Zap run queued');
      await refetch();
      await processRunLocally(createdRun);
    } catch (error) {
      const message = getSafeErrorMessage(error, 'Failed to queue zap run');

      logger.error('Failed to queue event zap run', {
        eventId,
        recipientFilter,
        amountSats,
        error,
      });

      toast.error(message);
    }
  };

  return (
    <>
      <div className='mx-auto mt-2 min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
            <h2 className='text-base font-semibold text-gray-900'>Zap amount (sats)</h2>
            <p className='mt-1 text-sm text-gray-500'>
              This amount is used for each recipient in a run.
            </p>
            <Input
              className='mt-3 h-11 bg-white'
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              inputMode='numeric'
              pattern='[0-9]*'
              min={MIN_ZAP_SATS}
              max={MAX_ZAP_SATS}
              placeholder='100'
            />
            <p className='mt-2 text-xs text-gray-500'>
              Allowed range: {MIN_ZAP_SATS.toLocaleString()} - {MAX_ZAP_SATS.toLocaleString()} sats
            </p>
          </div>

          <div className='space-y-2'>
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type='button'
                disabled={createEventZapRun.isPending || !!processingRunId}
                onClick={() => void handleStartRun(filter.key)}
                className='flex w-full items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70'
              >
                <div className='mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700'>
                  {createEventZapRun.isPending || !!processingRunId ? (
                    <Loader2 className='h-5 w-5 animate-spin' />
                  ) : (
                    <Bolt className='h-5 w-5' />
                  )}
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-gray-900'>{filter.label}</p>
                  <p className='mt-1 text-sm text-gray-500'>{filter.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
            <h2 className='text-base font-semibold text-gray-900'>Recent runs</h2>

            {isLoading ? (
              <div className='mt-3 flex items-center gap-2 text-sm text-gray-500'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Loading runs...
              </div>
            ) : zapRuns.length === 0 ? (
              <p className='mt-3 text-sm text-gray-500'>No zap runs yet.</p>
            ) : (
              <div className='mt-3 space-y-2'>
                {zapRuns.map((run) => (
                  <div key={run.id} className='rounded-xl border border-gray-200 bg-white p-3'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium text-gray-900'>
                        {run.recipient_filter.toUpperCase()}
                      </p>
                      <p className='text-xs text-gray-500'>{run.status}</p>
                    </div>
                    <p className='mt-1 text-xs text-gray-600'>
                      {run.processed_recipients}/{run.total_recipients} processed,{' '}
                      {run.successful_recipients} successful, {run.failed_recipients} failed
                    </p>
                    {(run.status === 'queued' || run.status === 'processing') && (
                      <button
                        type='button'
                        onClick={() => void processRunLocally(run)}
                        disabled={!!processingRunId}
                        className='mt-2 inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70'
                      >
                        {processingRunId === run.id ? (
                          <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        ) : (
                          <Bolt className='h-3.5 w-3.5' />
                        )}
                        Process Locally
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {processingRunId && localRunProgress && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6'>
          <div className='w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl'>
            <div className='flex items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-black' />
            </div>

            <h2 className='mt-4 text-center text-lg font-semibold text-gray-900'>
              Processing local zaps
            </h2>
            <p className='mt-2 text-center text-sm text-gray-600'>
              Do not leave the app while zaps are happening.
            </p>

            <div className='mt-4 h-2 w-full rounded-full bg-gray-200'>
              <div
                className='h-2 rounded-full bg-black transition-all duration-300'
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className='mt-3 text-center text-xs text-gray-500'>
              {localRunProgress.processed.toLocaleString()} /{' '}
              {localRunProgress.total.toLocaleString()} recipients processed ({progressPercent}%)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
