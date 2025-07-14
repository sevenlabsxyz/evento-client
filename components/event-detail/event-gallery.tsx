'use client';

import { useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Event } from '@/lib/types/event';

interface EventGalleryProps {
  event: Event;
  currentUserId?: string;
  onImageClick?: (index: number) => void;
}

export default function EventGallery({ event, currentUserId, onImageClick }: EventGalleryProps) {
  const router = useRouter();
  const galleryImages = event.galleryImages || [];
  const isOwner = event.owner?.id === currentUserId;
  
  const handleAddPhoto = () => {
    // TODO: Implement photo upload functionality
    console.log('Add photo clicked');
  };

  const handleViewAll = () => {
    router.push(`/e/event/${event.id}/gallery`);
  };

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  // Show up to 3 images in the grid
  const displayImages = galleryImages.slice(0, 3);
  const hasMoreImages = galleryImages.length > 3;

  return (
    <div className="py-6 border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gallery</h3>
        <div className="flex items-center gap-3">
          {galleryImages.length > 0 && (
            <button
              onClick={handleViewAll}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              View All
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleAddPhoto}
              className="text-gray-600 hover:text-gray-700 font-medium text-sm"
            >
              Add Photo
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {/* Display up to 3 images */}
          {displayImages.map((image, index) => (
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

          {/* Add Photo button (only for owners and when less than 4 images shown) */}
          {isOwner && displayImages.length < 3 && (
            <button
              onClick={handleAddPhoto}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-500 mt-1">Add Photo</span>
            </button>
          )}

          {/* View More indicator (when there are more than 3 images) */}
          {hasMoreImages && displayImages.length === 3 && (
            <button
              onClick={handleViewAll}
              className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">
                +{galleryImages.length - 3}
              </span>
            </button>
          )}
        </div>
      ) : (
        /* Empty state - only shown if no images exist */
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No photos yet</p>
          {isOwner && (
            <button
              onClick={handleAddPhoto}
              className="mt-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Be the first to add a photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}