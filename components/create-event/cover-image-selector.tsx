'use client';

import { Camera } from 'lucide-react';
import Image from 'next/image';

interface CoverImageSelectorProps {
  selectedImage?: string;
  onImageClick: () => void;
}

export default function CoverImageSelector({ selectedImage, onImageClick }: CoverImageSelectorProps) {
  return (
    <div 
      className="relative w-full aspect-square bg-gradient-to-br from-pink-300 to-pink-400 rounded-2xl overflow-hidden cursor-pointer"
      onClick={onImageClick}
    >
      {selectedImage ? (
        <Image
          src={selectedImage}
          alt="Selected cover image"
          fill
          className="object-cover"
        />
      ) : (
        // Default sunny character placeholder matching the screenshot
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            {/* Simplified sun character representation */}
            <div className="w-32 h-32 bg-yellow-400 rounded-full relative">
              {/* Sun rays */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-yellow-500 rounded-full"></div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-yellow-500 rounded-full"></div>
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-1 bg-yellow-500 rounded-full"></div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-1 bg-yellow-500 rounded-full"></div>
              
              {/* Face */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl">😎</div>
              </div>
              
              {/* Arms and legs (simplified) */}
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gray-700 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gray-700 rounded-full"></div>
              <div className="absolute bottom-8 -left-4 w-4 h-8 bg-gray-700 rounded-full transform rotate-45"></div>
              <div className="absolute bottom-8 -right-4 w-4 h-8 bg-gray-700 rounded-full transform -rotate-45"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera icon in bottom right */}
      <div className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
        <Camera className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}