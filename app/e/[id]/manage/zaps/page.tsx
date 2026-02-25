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
import { toast } from '@/lib/utils/toast';
import type { LnurlPayRequestDetails } from '@breeztech/breez-sdk-spark';
import { Bolt, Loader2 } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

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

  const processRunLocally = async (run: EventZapRun) => {
    if (!walletState.isConnected) {
      toast.error('Your wallet is local to this device. Unlock it to process zaps.');
      router.push('/e/wallet');
      return;
    }

    setProcessingRunId(run.id);

    try {
      while (true) {
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
        }

        await submitEventZapRunResults(eventId, run.id, payload);
        await refetch();
      }

      toast.success('Finished processing zap run with local wallet');
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message || 'Failed to process zap run')
          : 'Failed to process zap run';

      toast.error(message);
    } finally {
      setProcessingRunId(null);
      await refetch();
    }
  };

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
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message || 'Local zap attempt failed')
          : 'Local zap attempt failed';

      return {
        recipientId: recipient.id,
        status: 'failed',
        failureReason: message,
      };
    }
  };

  const handleStartRun = async (recipientFilter: EventZapRecipientFilter) => {
    if (!amountSats) {
      toast.error('Enter a valid zap amount in sats.');
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
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message || 'Failed to queue zap run')
          : 'Failed to queue zap run';

      toast.error(message);
    }
  };

  return (
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
            placeholder='100'
          />
        </div>

        <div className='space-y-2'>
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type='button'
              disabled={createEventZapRun.isPending}
              onClick={() => void handleStartRun(filter.key)}
              className='flex w-full items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70'
            >
              <div className='mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700'>
                {createEventZapRun.isPending ? (
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
                      disabled={processingRunId === run.id}
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
  );
}
