'use client';

import { useWallet } from '@/lib/hooks/use-wallet';
import { breezSDK } from '@/lib/services/breez-sdk';
import {
  BatchZapAmountMode,
  BatchZapProgress,
  BatchZapRecipient,
  BatchZapResult,
  getBatchZapDistribution,
} from '@/lib/utils/batch-zap';
import { useCallback, useState } from 'react';

interface SendBatchZapParams {
  recipients: BatchZapRecipient[];
  amountMode: BatchZapAmountMode;
  amountSats: number;
  comment?: string;
}

const INITIAL_PROGRESS: BatchZapProgress = {
  status: 'idle',
  currentIndex: 0,
  totalCount: 0,
  currentRecipient: null,
  sentCount: 0,
  failedCount: 0,
  remainingCount: 0,
  results: [],
};

const isWalletDisconnectedError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes('wallet not connected') || normalized.includes('sdk not connected');
};

export function useBatchZapPayments() {
  const { refreshBalance } = useWallet();
  const [progress, setProgress] = useState<BatchZapProgress>(INITIAL_PROGRESS);

  const reset = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
  }, []);

  const sendBatch = useCallback(
    async ({ recipients, amountMode, amountSats, comment }: SendBatchZapParams) => {
      const distribution = getBatchZapDistribution(amountMode, amountSats, recipients.length);
      if (!distribution) {
        throw new Error('Invalid batch zap distribution');
      }

      const totalCount = recipients.length;
      let sentCount = 0;
      let failedCount = 0;
      const results: BatchZapResult[] = [];

      setProgress({
        status: 'sending',
        currentIndex: totalCount > 0 ? 1 : 0,
        totalCount,
        currentRecipient: recipients[0] ?? null,
        sentCount: 0,
        failedCount: 0,
        remainingCount: totalCount,
        results: [],
      });

      for (let index = 0; index < recipients.length; index += 1) {
        const recipient = recipients[index];

        setProgress((current) => ({
          ...current,
          status: 'sending',
          currentIndex: index + 1,
          currentRecipient: recipient,
          remainingCount: totalCount - sentCount - failedCount,
        }));

        try {
          const parsed = await breezSDK.parseInput(recipient.lightningAddress);
          const payRequest =
            parsed.type === 'lightningAddress'
              ? parsed.payRequest
              : parsed.type === 'lnurlPay'
                ? parsed
                : null;

          if (!payRequest) {
            throw new Error('Invalid Lightning address');
          }

          const prepareResponse = await breezSDK.prepareLnurlPay({
            payRequest,
            amountSats: distribution.perRecipientAmountSats,
            comment: comment || undefined,
          });

          await breezSDK.lnurlPay({
            prepareResponse,
          });

          sentCount += 1;
          results.push({
            recipient,
            amountSats: distribution.perRecipientAmountSats,
            status: 'sent',
          });
        } catch (error) {
          failedCount += 1;
          const message = error instanceof Error ? error.message : 'Failed to send payment';

          results.push({
            recipient,
            amountSats: distribution.perRecipientAmountSats,
            status: 'failed',
            error: message,
          });

          if (isWalletDisconnectedError(message)) {
            for (
              let remainingIndex = index + 1;
              remainingIndex < recipients.length;
              remainingIndex += 1
            ) {
              results.push({
                recipient: recipients[remainingIndex],
                amountSats: distribution.perRecipientAmountSats,
                status: 'skipped',
                error: 'Wallet disconnected before this payment could be sent.',
              });
            }

            break;
          }
        }

        setProgress({
          status: 'sending',
          currentIndex: index + 1,
          totalCount,
          currentRecipient: recipient,
          sentCount,
          failedCount,
          remainingCount: Math.max(totalCount - results.length, 0),
          results: [...results],
        });
      }

      setProgress({
        status: 'completed',
        currentIndex: totalCount,
        totalCount,
        currentRecipient: null,
        sentCount,
        failedCount,
        remainingCount: 0,
        results: [...results],
      });

      if (sentCount > 0) {
        await refreshBalance();
      }

      return {
        distribution,
        results,
      };
    },
    [refreshBalance]
  );

  return {
    progress,
    reset,
    sendBatch,
  };
}
