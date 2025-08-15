import apiClient from '@/lib/api/client';
import { ApiResponse, CreateEmailBlastForm, EmailBlast } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch email blasts for a specific event
 */
export function useEmailBlasts(eventId: string) {
  return useQuery({
    queryKey: ['emailBlasts', eventId],
    queryFn: async () => {
      // API client response interceptor returns ApiResponse directly
      const response = await apiClient.get<ApiResponse<EmailBlast[]>>(
        `/v1/events/email-blasts/${eventId}`
      );
      // Check if response has the expected structure
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

  return useMutation({
    mutationFn: async (data: CreateEmailBlastForm) => {
      const response = await apiClient.post<ApiResponse<EmailBlast>>(
        `/v1/events/email-blasts/${eventId}`,
        data
      );
      // Check if response has the expected structure
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to create email blast');
    },
    onSuccess: () => {
      // Invalidate and refetch email blasts
      queryClient.invalidateQueries({ queryKey: ['emailBlasts', eventId] });
    },
    onError: (error: any) => {
      console.error('Create email blast error:', error);
    },
  });
}

/**
 * Hook to create email blast with custom callbacks
 * Useful when you need to handle success differently (e.g., close modal)
 */
export function useCreateEmailBlastWithCallbacks(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmailBlastForm) => {
      const response = await apiClient.post<ApiResponse<EmailBlast>>(
        `/v1/events/email-blasts/${eventId}`,
        data
      );
      // Check if response has the expected structure
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Failed to create email blast');
    },
    onSuccess: () => {
      // Invalidate and refetch email blasts
      queryClient.invalidateQueries({ queryKey: ['emailBlasts', eventId] });
    },
  });
}

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
      .trim() || 'No subject';

  // Map recipient filter to display text
  const recipientMap = {
    all: 'All RSVPs',
    yes_only: 'RSVP: Yes',
    yes_and_maybe: 'RSVP: Yes & Maybe',
  };

  // Map the API response to our UI structure
  // Make sure we use the proper property names that match the EmailBlast type
  return {
    ...blast,
    subject,
    recipients:
      recipientMap[blast.recipient_filter as keyof typeof recipientMap] || 'All Recipients',
    recipientCount: blast.recipientCount || 0, // Use API value or default
    delivered: blast.delivered || 0, // Use API value or default
    failed: blast.failed || 0, // Use API value or default
    pending: blast.pending || 0, // Use API value or default
    created_at: blast.created_at,
  };
}
