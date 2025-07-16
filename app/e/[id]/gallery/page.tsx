'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share, Plus } from 'lucide-react';
import { getEventById } from '@/lib/data/sample-events';
import { SilkLightbox, SilkLightboxRef } from '@/components/ui/silk-lightbox';

export default function GalleryPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const lightboxRef = useRef<SilkLightboxRef>(null);
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to view doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = existingEvent.galleryImages || [];
  const isOwner = existingEvent.owner?.id === 'current-user-id'; // In real app, use actual current user ID

  const handleImageClick = (index: number) => {
    lightboxRef.current?.open(index);
  };

  const handleShareGallery = async () => {
    const galleryUrl = `${window.location.origin}/e/event/${eventId}/gallery`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${existingEvent.title} - Gallery`,
          text: `Check out photos from ${existingEvent.title}`,
          url: galleryUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(galleryUrl);
      // Could show a toast notification here
      alert('Gallery link copied to clipboard!');
    }
  };

  const handleAddPhoto = () => {
    // TODO: Implement photo upload functionality
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        console.log('Selected files:', Array.from(files).map(f => f.name));
        // TODO: Handle file upload
      }
    };
    input.click();
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Gallery</h1>
            <p className="text-sm text-gray-500">{galleryImages.length} photos</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareGallery}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Share Gallery"
          >
            <Share className="w-5 h-5 text-gray-600" />
          </button>
          {isOwner && (
            <button
              onClick={handleAddPhoto}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Add Photos"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="p-4">
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageClick(index)}
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
            <p className="text-gray-500 text-sm">
              Photos from this event will appear here once they're added.
            </p>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <SilkLightbox
        ref={lightboxRef}
        images={galleryImages}
        eventTitle={existingEvent.title}
      />
    </div>
  );
}