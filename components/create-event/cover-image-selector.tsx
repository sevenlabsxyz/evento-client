'use client';

import ProgressiveImage from '@/components/ui/progressive-image';
import { DEFAULT_EVENT_COVER_URL } from '@/lib/constants/event-cover';
import { getCoverImageUrl500x500 } from '@/lib/utils/cover-images';
import { isGif } from '@/lib/utils/image';
import { Camera } from 'lucide-react';

interface CoverImageSelectorProps {
  selectedImage?: string;
  onImageClick: () => void;
}

export default function CoverImageSelector({
  selectedImage,
  onImageClick,
}: CoverImageSelectorProps) {
  return (
    <div
      className='relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-pink-300 to-pink-400'
      onClick={onImageClick}
    >
      {selectedImage ? (
        <div className='h-full w-full'>
          {isGif(selectedImage) ? (
            // For GIFs, use a regular img tag to ensure they play automatically
            <img
              src={selectedImage}
              alt='Selected GIF cover'
              className='h-full w-full object-cover'
              loading='lazy'
            />
          ) : (
            // For regular images, use the ProgressiveImage component
            <ProgressiveImage
              src={getCoverImageUrl500x500(selectedImage)}
              alt='Selected cover image'
              fill
              className='object-cover'
            />
          )}
        </div>
      ) : (
        <div className='h-full w-full'>
          <ProgressiveImage
            src={getCoverImageUrl500x500(DEFAULT_EVENT_COVER_URL)}
            alt='Default event cover'
            fill
            className='object-cover'
          />
        </div>
      )}

      {/* Camera icon in bottom right */}
      <div className='absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black bg-opacity-50'>
        <Camera className='h-5 w-5 text-white' />
      </div>
    </div>
  );
}
