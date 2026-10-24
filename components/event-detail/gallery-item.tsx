'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { GalleryItem as GalleryItemType } from '@/lib/hooks/use-event-gallery';
import { useGalleryItemLikes } from '@/lib/hooks/use-gallery-item-likes';
import { getOptimizedImageUrlPreservingGif, isGif } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import { Heart, MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

interface GalleryItemProps {
  item: GalleryItemType;
  currentUserId: string;
  onImageClick?: () => void;
  eventId: string;
  isEventHost?: boolean;
}

export default function GalleryItem({
  item,
  currentUserId,
  onImageClick,
  eventId,
  isEventHost = false,
}: GalleryItemProps) {
  const t = useTranslations('eventSocial');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const {
    likes,
    hasLiked,
    toggleLike,
    isLoading: likesLoading,
  } = useGalleryItemLikes(item.id, eventId);
  const deleteGalleryItem = useDeleteGalleryItem();
  const displayUrl = getOptimizedImageUrlPreservingGif(item.url);

  const isOwner = item.user_details?.id === currentUserId;
  const canDelete = isOwner || isEventHost;
  const uploaderName = item.user_details?.username || t('galleryItem.unknownUser');

  const handleDelete = () => {
    if (window.confirm(t('galleryItem.deleteConfirm'))) {
      deleteGalleryItem.mutate(
        { galleryItemId: item.id, eventId },
        {
          onSuccess: () => {
            toast.success(t('galleryItem.deleteSuccess'));
          },
          onError: (error: Error) => {
            toast.error(error.message || t('galleryItem.deleteFailed'));
          },
        }
      );
    }
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !onImageClick) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onImageClick();
    }
  };

  return (
    <div
      className='group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100 ring-1 ring-inset ring-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-neutral-800 dark:ring-white/5 dark:focus-visible:ring-offset-neutral-900'
      onClick={onImageClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      role={onImageClick ? 'button' : undefined}
      tabIndex={onImageClick ? 0 : undefined}
      aria-label={onImageClick ? t('galleryItem.openAria', { username: uploaderName }) : undefined}
    >
      {/* Image */}
      {isGif(item.url) ? (
        <img
          src={displayUrl}
          alt={t('galleryItem.imageAlt', { username: uploaderName })}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-300 motion-safe:group-hover:scale-[1.03] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <Image
          src={displayUrl}
          alt={t('galleryItem.imageAlt', { username: uploaderName })}
          fill
          sizes='(max-width: 1024px) 50vw, 25vw'
          className={`object-cover transition-[opacity,transform] duration-300 motion-safe:group-hover:scale-[1.03] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Loading state */}
      {!isLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-neutral-800'>
          <div className='h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-red-500 dark:border-neutral-700 dark:border-t-red-400'></div>
        </div>
      )}

      {/* Controls overlay - show on hover/tap */}
      <div className='absolute inset-0'>
        <div
          aria-hidden='true'
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 transition-opacity motion-safe:duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
        {/* Like button */}
        <button
          type='button'
          onClick={handleLikeToggle}
          disabled={likesLoading}
          aria-label={hasLiked ? t('galleryItem.unlikeAria') : t('galleryItem.likeAria')}
          className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1.5 text-white backdrop-blur-sm transition-opacity hover:bg-black/70 ${
            showControls || hasLiked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${hasLiked ? 'fill-red-500 text-red-500 dark:text-red-400' : 'text-white'}`}
          />
          <span className='text-xs'>{likes}</span>
        </button>

        {/* Menu for uploader or event host */}
        {canDelete && (
          <div
            className={`absolute right-2 top-2 transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  aria-label={t('galleryItem.actionsAria')}
                  className='rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70'
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className='cursor-pointer text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-400'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  {t('galleryItem.deletePhoto')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
