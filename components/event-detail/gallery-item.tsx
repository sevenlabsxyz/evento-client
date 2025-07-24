'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteGalleryItem } from '@/lib/hooks/useDeleteGalleryItem';
import { GalleryItem as GalleryItemType } from '@/lib/hooks/useEventGallery';
import { useGalleryItemLikes } from '@/lib/hooks/useGalleryItemLikes';
import { isGif } from '@/lib/utils/image';
import { Heart, MoreHorizontal, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface GalleryItemProps {
  item: GalleryItemType;
  currentUserId: string;
  onImageClick?: () => void;
  eventId: string;
}

export default function GalleryItem({
  item,
  currentUserId,
  onImageClick,
  eventId,
}: GalleryItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const { likes, hasLiked, toggleLike, isLoading: likesLoading } = useGalleryItemLikes(item.id);
  const deleteGalleryItem = useDeleteGalleryItem();

  const isOwner = item.user_details?.id === currentUserId;

  const handleDelete = () => {
    if (
      window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')
    ) {
      deleteGalleryItem.mutate({ galleryItemId: item.id, eventId });
    }
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
  };

  return (
    <div
      className='group relative aspect-square cursor-pointer overflow-hidden rounded-md'
      onClick={onImageClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Image */}
      {isGif(item.url) ? (
        <img
          src={item.url}
          alt={`Gallery image by ${item.user_details?.username || 'user'}`}
          className={`h-full w-full object-cover transition-opacity ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <Image
          src={item.url}
          alt={`Gallery image by ${item.user_details?.username || 'user'}`}
          fill
          sizes='(max-width: 768px) 33vw, 20vw'
          className={`object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Loading state */}
      {!isLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
          <div className='h-8 w-8 animate-spin rounded-full border-t-2 border-solid border-red-500'></div>
        </div>
      )}

      {/* Controls overlay - show on hover/tap */}
      <div
        className={`absolute inset-0 bg-black bg-opacity-0 transition-opacity duration-200 ${
          showControls ? 'bg-opacity-30' : 'group-hover:bg-opacity-30'
        }`}
      >
        {/* Like button */}
        <button
          onClick={handleLikeToggle}
          disabled={likesLoading}
          className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black bg-opacity-50 px-2.5 py-1.5 text-white transition-all ${
            showControls || hasLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${hasLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
          <span className='text-xs'>{likes}</span>
        </button>

        {/* Menu for owner */}
        {isOwner && (
          <div
            className={`absolute right-2 top-2 transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='rounded-full bg-black bg-opacity-50 p-1.5 text-white'>
                  <MoreHorizontal className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className='cursor-pointer text-red-600 focus:text-red-700'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Photo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
