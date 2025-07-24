'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import TravelItinerary from '../../../travel-itinerary';

export default function HubPage() {
	const { isLoading: isCheckingAuth } = useRequireAuth();

	if (isCheckingAuth) {
		return (
			<div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
				<div className='flex flex-1 items-center justify-center pb-20'>
					<div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
				</div>
			</div>
		);
	}

	return <TravelItinerary />;
}
