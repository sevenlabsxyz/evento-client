import apiClient from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';

export interface GenerateDescriptionParams {
	// Required event data
	title: string;

	// Optional event data
	location?: string;
	startDate?: string;
	endDate?: string;
	timezone?: string;
	visibility?: string;
	spotifyUrl?: string;
	cost?: string | number;
	currentDescription?: string;

	// AI generation options
	length: 'short' | 'medium' | 'long';
	tone: 'professional' | 'casual' | 'exciting';
	customPrompt?: string;
	eventContext?: string;
	userPrompt?: string; // Additional user input
}

interface GenerateDescriptionResponse {
	description: string;
}

/**
 * Hook for generating AI-powered event descriptions
 * Returns a mutation function that can be used to generate descriptions
 */
export function useGenerateDescription() {
	return useMutation({
		mutationFn: async (params: GenerateDescriptionParams) => {
			const response: GenerateDescriptionResponse = await apiClient.post(
				'/v1/events/generate-description',
				params,
				{ timeout: 60000 } // 60 seconds timeout
			);

			// Check if response has the expected structure
			if (response.description) {
				return response;
			}

			throw new Error('Failed to generate description');
		},
		onError: (error: any) => {
			console.error('Generate description error:', error);
			// Error handling is done in the component
		},
	});
}
