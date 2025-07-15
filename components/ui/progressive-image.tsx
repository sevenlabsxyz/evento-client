"use client";

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
}

export default function ProgressiveImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  placeholder = 'blur',
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate a tiny blur placeholder from the image URL
  const generateBlurDataURL = (imageUrl: string) => {
    // Extract the base path and add blur parameters
    if (imageUrl.includes('api.evento.so/storage/v1/render/image')) {
      // For Supabase images, use a tiny version for blur
      const tinyUrl = imageUrl.replace(/width=\d+/, 'width=10').replace(/height=\d+/, 'height=10');
      return tinyUrl;
    }
    
    // For direct Supabase URLs with width/height params, create tiny version
    if (imageUrl.includes('width=') && imageUrl.includes('height=')) {
      const tinyUrl = imageUrl.replace(/width=\d+/, 'width=10').replace(/height=\d+/, 'height=10');
      return tinyUrl;
    }
    
    // Fallback to a generic blur data URL
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjNmNGY2IiAvPgo8L3N2Zz4K";
  };

  if (hasError) {
    return (
      <div 
        className={cn(
          "bg-gray-200 flex items-center justify-center text-gray-400 text-sm",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        Failed to load
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", fill ? "w-full h-full" : "inline-block")}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn(
          "transition-opacity duration-300 ease-in-out",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        priority={priority}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={placeholder === 'blur' ? generateBlurDataURL(src) : undefined}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse",
            fill ? "absolute inset-0" : ""
          )}
          style={!fill ? { width, height } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}
    </div>
  );
}