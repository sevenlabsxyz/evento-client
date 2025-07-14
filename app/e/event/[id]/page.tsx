'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share, MoreHorizontal } from 'lucide-react';
import { getEventById } from '@/lib/data/sample-events';
import SwipeableHeader from '@/components/event-detail/swipeable-header';
import EventInfo from '@/components/event-detail/event-info';
import EventLocation from '@/components/event-detail/event-location';
import EventHost from '@/components/event-detail/event-host';
import EventDescription from '@/components/event-detail/event-description';
import ImageLightbox from '@/components/event-detail/image-lightbox';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const event = getEventById(eventId);

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Share className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:max-w-sm max-w-full mx-auto bg-white">
        <SwipeableHeader 
          event={event} 
          onImageClick={(index) => {
            setLightboxIndex(index);
            setShowLightbox(true);
          }} 
        />
        <div className="px-4 pb-20">
          <EventInfo event={event} />
          <EventLocation event={event} />
          <EventHost event={event} />
          <EventDescription event={event} />
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={showLightbox}
        images={event.coverImages}
        initialIndex={lightboxIndex}
        eventTitle={event.title}
        onClose={() => setShowLightbox(false)}
      />
    </div>
  );
}