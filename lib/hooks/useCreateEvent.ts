import apiClient from '@/lib/api/client';
import { CreateEventData, createEventSchema } from '@/lib/schemas/event';
import { ApiResponse } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface CreateEventResponse {
	id: string;
	title: string;
	[key: string]: any;
}

export function useCreateEvent() {
	const router = useRouter();

	return useMutation({
		mutationFn: async (data: CreateEventData) => {
			// Validate data
			const validatedData = createEventSchema.parse(data);

			// Make API call
			const response = await apiClient.post<ApiResponse<CreateEventResponse[]>>(
				'/v1/events/create',
				validatedData
			);

			// The API returns { success: true, data: [...] }
			// Check if response has the expected structure
			if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
				return response.data[0];
			}

			throw new Error('Failed to create event');
		},
		onSuccess: (data) => {
			toast.success('Event created successfully!');
			// Navigate to the created event
			router.push(`/e/${data.id}`);
		},
		onError: (error: any) => {
			console.error('Create event error:', error);
			toast.error(error.message || 'Failed to create event');
		},
	});
}

/**
 * Hook for creating an event with custom callbacks
 * Useful when you need to handle success differently
 */
export function useCreateEventWithCallbacks() {
	return useMutation({
		mutationFn: async (data: CreateEventData) => {
			// Validate data
			const validatedData = createEventSchema.parse(data);

			// Make API call
			const response = await apiClient.post<ApiResponse<CreateEventResponse[]>>(
				'/v1/events/create',
				validatedData
			);

			// The API returns { success: true, data: [...] }
			// Check if response has the expected structure
			if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
				return response.data[0];
			}

			throw new Error('Failed to create event');
		},
	});
}
