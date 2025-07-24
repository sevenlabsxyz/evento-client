import { apiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';

export interface EventComment {
	id: string;
	created_at: string;
	message: string;
	user_id: string;
	event_id: string;
	parent_comment_id: string | null;
	user_details: {
		username: string;
		image: string | null;
		verification_status: 'verified' | 'pending' | null | undefined;
	};
	replies: EventComment[];
	optimistic?: boolean; // Flag for optimistic UI updates
}

export function useEventComments(eventId: string) {
	return useQuery({
		queryKey: ['event', 'comments', eventId],
		queryFn: async (): Promise<EventComment[]> => {
			const response = await apiClient.get<EventComment[]>(
				`/v1/events/comments?event_id=${eventId}`
			);

			// Handle the response structure { success, message, data }
			if (!response || typeof response !== 'object') {
				throw new Error('Invalid response format');
			}

			// Check if it's the expected API response structure
			if ('success' in response && 'data' in response) {
				return (response.data || []) as EventComment[];
			}

			// Fallback for direct data response
			return response as unknown as EventComment[];
		},
		enabled: !!eventId,
		staleTime: 1000 * 60 * 2, // Cache for 2 minutes (comments update more frequently)
	});
}
