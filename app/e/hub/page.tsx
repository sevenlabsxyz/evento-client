'use client';

import { useRequireAuth } from '@/lib/hooks/useAuth';
import TravelItinerary from '../../../travel-itinerary';

export default function HubPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();

  if (isCheckingAuth) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return <TravelItinerary />;
}
