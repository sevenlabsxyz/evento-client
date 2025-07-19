"use client";

import { Event } from "@/lib/types/event";
import { Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventGalleryProps {
  event: Event;
  currentUserId?: string;
  onImageClick?: (index: number) => void;
}

export default function EventGallery({
  event,
  currentUserId,
  onImageClick,
}: EventGalleryProps) {
  const router = useRouter();
  const galleryImages = event.galleryImages || [];
  const isOwner = event.owner?.id === currentUserId;

  const handleAddPhoto = () => {
    // TODO: Implement photo upload functionality
    console.log("Add photo clicked");
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
    <div className="border-b border-gray-100 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gallery</h3>
        <div className="flex items-center gap-3">
          {galleryImages.length > 0 && (
            <button
              onClick={handleViewAll}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              View All
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleAddPhoto}
              className="text-sm font-medium text-gray-600 hover:text-gray-700"
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
              className="aspect-square overflow-hidden rounded-lg bg-gray-200 transition-opacity hover:opacity-90"
            >
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}

          {/* Add Photo button (only for owners and when less than 4 images shown) */}
          {isOwner && displayImages.length < 3 && (
            <button
              onClick={handleAddPhoto}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-red-400 hover:bg-red-50"
            >
              <Plus className="h-6 w-6 text-gray-400" />
              <span className="mt-1 text-xs text-gray-500">Add Photo</span>
            </button>
          )}

          {/* View More indicator (when there are more than 3 images) */}
          {hasMoreImages && displayImages.length === 3 && (
            <button
              onClick={handleViewAll}
              className="flex aspect-square flex-col items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
            >
              <Eye className="h-6 w-6 text-gray-600" />
              <span className="mt-1 text-xs text-gray-600">
                +{galleryImages.length - 3}
              </span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
