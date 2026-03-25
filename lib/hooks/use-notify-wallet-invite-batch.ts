'use client';

import { apiClient } from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';

export interface NotifyWalletInviteBatchArgs {
  recipientUsernames: string[];
}

export interface NotifyWalletInviteBatchRecipientResult {
  recipientUsername: string;
  status: 'sent' | 'already_notified' | 'error';
  message?: string;
}

export interface NotifyWalletInviteBatchSummary {
  requestedCount: number;
  processedCount: number;
  sentCount: number;
  alreadyNotifiedCount: number;
  errorCount: number;
}

export interface NotifyWalletInviteBatchResponse {
  success: boolean;
  status: 'completed' | 'partial' | 'error';
  message?: string;
  summary: NotifyWalletInviteBatchSummary;
  results: NotifyWalletInviteBatchRecipientResult[];
}

interface NotifyWalletInviteBatchApiResponse {
  success: boolean;
  status: 'success' | 'completed' | 'partial' | 'error';
  message?: string;
  summary?:
    | NotifyWalletInviteBatchSummary
    | {
        total: number;
        sent: number;
        already_notified: number;
        error: number;
      };
  results?: NotifyWalletInviteBatchRecipientResult[];
}

function normalizeBatchSummary(
  summary: NotifyWalletInviteBatchApiResponse['summary']
): NotifyWalletInviteBatchSummary {
  if (
    summary &&
    'requestedCount' in summary &&
    'processedCount' in summary &&
    'sentCount' in summary &&
    'alreadyNotifiedCount' in summary &&
    'errorCount' in summary
  ) {
    return summary;
  }

  if (summary && 'total' in summary) {
    return {
      requestedCount: summary.total,
      processedCount: summary.total,
      sentCount: summary.sent,
      alreadyNotifiedCount: summary.already_notified,
      errorCount: summary.error,
    };
  }

  return {
    requestedCount: 0,
    processedCount: 0,
    sentCount: 0,
    alreadyNotifiedCount: 0,
    errorCount: 0,
  };
}

function normalizeBatchResponse(
  response: NotifyWalletInviteBatchApiResponse
): NotifyWalletInviteBatchResponse {
  return {
    success: response.success,
    status: response.status === 'success' ? 'completed' : response.status,
    message: response.message,
    summary: normalizeBatchSummary(response.summary),
    results: response.results ?? [],
  };
}

export function useNotifyWalletInviteBatch() {
  return useMutation<NotifyWalletInviteBatchResponse, Error, NotifyWalletInviteBatchArgs>({
    mutationFn: async ({ recipientUsernames }) => {
      const response = await apiClient.post<NotifyWalletInviteBatchApiResponse>(
        '/v1/wallet/notify/batch',
        {
          recipientUsernames,
        }
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to send wallet notifications');
      }

      return normalizeBatchResponse(response);
    },
  });
}
