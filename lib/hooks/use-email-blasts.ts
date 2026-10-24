import apiClient from '@/lib/api/client';
import { translateHooks } from '@/lib/i18n/active-translator';
import { queryKeys } from '@/lib/query-client';
import {
  ApiResponse,
  CreateEmailBlastForm,
  EmailBlast,
  UpdateEmailBlastForm,
} from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface ApiError {
  message?: string;
  status?: number;
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
};

/**
 * Hook to fetch email blasts for a specific event
 */
export function useEmailBlasts(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventEmailBlasts(eventId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EmailBlast[]>>(
        `/v1/events/${eventId}/email-blasts`
      );
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    enabled: !!eventId,
  });
}

/**
 * Hook to create a new email blast
 */
export function useCreateEmailBlast(eventId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (data: CreateEmailBlastForm) => {
      const response = await apiClient.post<ApiResponse<EmailBlast>>(
        `/v1/events/${eventId}/email-blasts`,
        data
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error(t('emailBlasts.createFailed'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventEmailBlasts(eventId) });
    },
    onError: (error: unknown) => {
      logger.error('Create email blast error', {
        error: getErrorMessage(error, t('emailBlasts.createFailed')),
      });
    },
  });
}

/**
 * Hook to create email blast with custom callbacks
 * Useful when you need to handle success differently (e.g., close modal)
 */
export function useCreateEmailBlastWithCallbacks(eventId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (data: CreateEmailBlastForm) => {
      const response = await apiClient.post<ApiResponse<EmailBlast>>(
        `/v1/events/${eventId}/email-blasts`,
        data
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error(t('emailBlasts.createFailed'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventEmailBlasts(eventId) });
    },
  });
}

export function useUpdateEmailBlast(eventId: string, blastId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (data: UpdateEmailBlastForm) => {
      const response = await apiClient.patch<ApiResponse<EmailBlast>>(
        `/v1/events/${eventId}/email-blasts/${blastId}`,
        data
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error(t('emailBlasts.updateFailed'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventEmailBlasts(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailBlast(eventId, blastId) });
    },
    onError: (error: unknown) => {
      logger.error('Update email blast error', {
        error: getErrorMessage(error, t('emailBlasts.updateFailed')),
      });
    },
  });
}

export function useCancelEmailBlast(eventId: string, blastId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<ApiResponse<EmailBlast>>(
        `/v1/events/${eventId}/email-blasts/${blastId}`
      );

      if (response && response.data) {
        return response.data;
      }

      throw new Error(t('emailBlasts.cancelFailed'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventEmailBlasts(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.emailBlast(eventId, blastId) });
    },
    onError: (error: unknown) => {
      logger.error('Cancel email blast error', {
        error: getErrorMessage(error, t('emailBlasts.cancelFailed')),
      });
    },
  });
}

export const isEmailBlastScheduledMutationRaceError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const apiError = error as ApiError;
  if (apiError.status !== 400 || !apiError.message) {
    return false;
  }

  return /Only scheduled email blasts can be (edited|cancelled)/i.test(apiError.message);
};

/**
 * Transform API email blast data to UI format
 */
export function transformEmailBlastForUI(blast: EmailBlast): EmailBlast & {
  subject: string;
  recipients: string;
  recipientCount: number;
  delivered: number;
  failed: number;
  pending: number;
} {
  // Extract subject from message (first line or first 50 chars)
  const subject =
    blast.message
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .split('\n')[0] // Get first line
      .slice(0, 50) // Limit to 50 chars
      .trim() || translateHooks('emailBlasts.noSubject');

  // Map recipient filter to display text
  const recipientMap = {
    all: translateHooks('emailBlasts.recipients.all'),
    yes_only: translateHooks('emailBlasts.recipients.yes'),
    yes_and_maybe: translateHooks('emailBlasts.recipients.yesAndMaybe'),
    'rsvp-yes': translateHooks('emailBlasts.recipients.yes'),
    'rsvp-no': translateHooks('emailBlasts.recipients.no'),
    'rsvp-maybe': translateHooks('emailBlasts.recipients.maybe'),
    invited: translateHooks('emailBlasts.recipients.invited'),
  };

  // Map the API response to our UI structure
  // Make sure we use the proper property names that match the EmailBlast type
  return {
    ...blast,
    subject,
    recipients:
      recipientMap[blast.recipient_filter as keyof typeof recipientMap] ||
      translateHooks('emailBlasts.recipients.allRecipients'),
    recipientCount: blast.recipientCount || 0, // Use API value or default
    delivered: blast.delivered || 0, // Use API value or default
    failed: blast.failed || 0, // Use API value or default
    pending: blast.pending || 0, // Use API value or default
    created_at: blast.created_at,
  };
}
