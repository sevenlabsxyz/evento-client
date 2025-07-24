/**
 * Utilities for optimizing and transforming blog post images
 */
import { ImageSizes, isGif } from './image';

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get estimated dimensions for an image based on its src
 * Uses predefined aspect ratios based on common blog image sizes
 * @param src - Image source URL
 * @returns Default dimensions to use for the image
 */
function getEstimatedDimensions(src: string): ImageDimensions {
  // Default blog post image dimensions (16:9 aspect ratio)
  const defaultDimensions = {
    width: ImageSizes.LARGE,
    height: Math.round(ImageSizes.LARGE * (9 / 16)),
  };

  // For portrait images (often used in testimonials, team photos)
  if (src.includes('portrait') || src.includes('profile') || src.includes('avatar')) {
    return {
      width: ImageSizes.MEDIUM,
      height: Math.round(ImageSizes.MEDIUM * (4 / 3)),
    };
  }

  // For square images (icons, thumbnails)
  if (src.includes('icon') || src.includes('logo') || src.includes('thumbnail')) {
    return {
      width: ImageSizes.MEDIUM,
      height: ImageSizes.MEDIUM,
    };
  }

  return defaultDimensions;
}

/**
 * Generate the Next.js Image component as a string
 * @param src - Image source URL
 * @param alt - Image alt text
 * @param width - Image width
 * @param height - Image height
 * @returns String representation of the Next.js Image component
 */
function generateImageComponent(src: string, alt: string, width: number, height: number): string {
  // For GIFs, use regular img tag to maintain animation
  if (isGif(src)) {
    return `<img src="${src}" alt="${alt}" width="${width}" height="${height}" style="max-width:100%;height:auto;" loading="lazy" />`;
  }

  // Use data-nimg attribute to indicate this is a Next.js Image component
  return `<span style="box-sizing:border-box;display:inline-block;overflow:hidden;width:100%;height:auto;position:relative;max-width:${width}px;">
    <span style="box-sizing:border-box;display:block;width:100%;height:initial;background:none;opacity:1;border:0;margin:0;padding:0;">
      <img
        alt="${alt || ''}"
        src="${src}"
        decoding="async"
        data-nimg="responsive"
        style="position:absolute;top:0;left:0;bottom:0;right:0;box-sizing:border-box;padding:0;border:none;margin:auto;display:block;width:0;height:0;min-width:100%;max-width:100%;min-height:100%;max-height:100%;"
        width="${width}"
        height="${height}"
        loading="lazy"
      />
    </span>
  </span>`;
}

/**
 * Convert regular <img> tags in HTML string to Next.js Image components
 * @param html - HTML string containing img tags
 * @returns HTML string with img tags replaced by Next.js Image components
 */
export function optimizeBlogImages(html: string): string {
  if (!html) return html;

  // Pattern to match <img> tags with various attributes
  const imgPattern = /<img\s+([^>]*)src="([^"]*)"([^>]*)>/gi;

  return html.replace(imgPattern, (match, preAttributes, src, postAttributes) => {
    // Extract alt text if present
    const altMatch = (preAttributes + postAttributes).match(/alt="([^"]*)"/i);
    const alt = altMatch ? altMatch[1] : '';

    // Extract width and height if present in the original img tag
    const widthMatch = (preAttributes + postAttributes).match(/width="([^"]*)"/i);
    const heightMatch = (preAttributes + postAttributes).match(/height="([^"]*)"/i);

    // Use specified dimensions or estimate based on the image source
    const width = widthMatch ? parseInt(widthMatch[1], 10) : getEstimatedDimensions(src).width;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : getEstimatedDimensions(src).height;

    // Replace the img tag with a Next.js Image component
    return generateImageComponent(src, alt, width, height);
  });
}
