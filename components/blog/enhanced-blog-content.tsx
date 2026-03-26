'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ImageSizes, isGif } from '@/lib/utils/image';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface EnhancedBlogContentProps {
  html: string;
  className?: string;
}

/**
 * Component that enhances blog content by replacing standard img tags
 * with optimized Next.js Image components
 */
export default function EnhancedBlogContent({ html, className }: EnhancedBlogContentProps) {
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([]);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!html) {
      setProcessedContent([]);
      return;
    }

    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;

    // Process all nodes and replace img tags
    const processedNodes: React.ReactNode[] = [];
    let keyCounter = 0;

    const processNode = (node: Node): React.ReactNode => {
      // If this is a text node, just return its content
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      // If it's an element node
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // If it's an image, replace with Next.js Image
        if (tagName === 'img') {
          const imgElement = element as HTMLImageElement;
          const src = imgElement.src;
          const alt = imgElement.alt || '';
          const width = parseInt(imgElement.width.toString()) || ImageSizes.LARGE;
          const height = parseInt(imgElement.height.toString()) || Math.round(width * (9 / 16));

          const key = `img-${keyCounter++}`;

          // For GIFs, use standard img tag to preserve animation
          if (isGif(src)) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={key}
                src={src}
                alt={alt}
                width={width}
                height={height}
                style={{ maxWidth: '100%', height: 'auto' }}
                loading='lazy'
              />
            );
          }

          // For normal images, use Next.js Image with higher inline quality
          // and a click-through lightbox for the original asset.
          const imageNode = (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className='h-auto w-full max-w-full'
              sizes='(max-width: 768px) calc(100vw - 3rem), (max-width: 1280px) calc(100vw - 6rem), 960px'
              quality={95}
              placeholder='blur'
              blurDataURL={generateBlurDataURL(src)}
            />
          );

          return (
            <button
              key={key}
              type='button'
              onClick={() => setSelectedImage({ src, alt, width, height })}
              className='relative my-2 block w-full overflow-hidden text-left transition-opacity hover:opacity-95'
            >
              <span className='sr-only'>{alt ? `Open image: ${alt}` : 'Open image'}</span>
              <div className='relative w-full overflow-hidden'>{imageNode}</div>
            </button>
          );
        }

        // For other elements, process their children recursively
        const childNodes: React.ReactNode[] = [];
        element.childNodes.forEach((childNode) => {
          childNodes.push(
            <React.Fragment key={`child-${keyCounter++}`}>{processNode(childNode)}</React.Fragment>
          );
        });

        const elementProps =
          tagName === 'a' ? getAnchorProps(element as HTMLAnchorElement) : undefined;

        // Create a new element with the same tag and processed children
        return React.createElement(
          tagName,
          { key: `el-${keyCounter++}`, ...elementProps },
          ...childNodes
        );
      }

      // For other node types, return null
      return null;
    };

    // Process all top-level nodes
    Array.from(tempElement.childNodes).forEach((node) => {
      processedNodes.push(processNode(node));
    });

    setProcessedContent(processedNodes);
  }, [html]);

  /**
   * Generate a blur data URL for images
   * Provides a tiny version of the image or a placeholder
   */
  function generateBlurDataURL(url: string): string {
    // For external images
    if (url.startsWith('http')) {
      // Try to generate a tiny version for Evento images on supported domains
      if (
        url.includes('evento.so') ||
        url.includes('laughing-sunfish.pikapod.net') ||
        url.includes('blogapi.evento.so')
      ) {
        // Add blur parameters - create a tiny 10px version for blurry placeholder
        if (url.includes('?')) {
          return `${url}&width=10&quality=30`;
        }
        return `${url}?width=10&quality=30`;
      }

      // For external images we don't have control over, use generic blur
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjNmNGY2IiAvPgo8L3N2Zz4K';
    }

    // For internal/relative images
    if (url.startsWith('/')) {
      // For Supabase storage URLs
      if (url.includes('/storage/v1/')) {
        return `${url}?width=10&quality=30`;
      }
    }

    // Default fallback blur
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjNmNGY2IiAvPgo8L3N2Zz4K';
  }

  return (
    <>
      <div className={`max-w-full overflow-hidden ${className || ''}`}>{processedContent}</div>
      <Dialog
        open={selectedImage !== null}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        {selectedImage && (
          <DialogContent className='max-h-[96vh] max-w-[min(96vw,1400px)] border-none bg-transparent p-0 shadow-none'>
            <div className='flex items-center justify-center bg-black/40 p-2 rounded-[2rem]'>
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                width={selectedImage.width}
                height={selectedImage.height}
                quality={100}
                unoptimized
                className='h-auto max-h-[90vh] w-auto max-w-full object-contain rounded-[1.5rem]'
                sizes='100vw'
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function getAnchorProps(element: HTMLAnchorElement): React.AnchorHTMLAttributes<HTMLAnchorElement> {
  const href = element.getAttribute('href') ?? undefined;
  const relValues = new Set((element.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean));

  relValues.add('noopener');
  relValues.add('noreferrer');

  return {
    href,
    target: '_blank',
    rel: Array.from(relValues).join(' '),
  };
}
