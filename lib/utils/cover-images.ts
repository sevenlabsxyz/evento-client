/**
 * Utilities for handling event cover images
 */

/**
 * Gets the optimized cover image URL from Supabase storage
 * @param imagePath - The relative path to the image (e.g., "eventos/default-covers/tech/1.webp")
 * @param width - Desired width for optimization (default: 500)
 * @param height - Desired height for optimization (default: 500)
 * @returns Optimized image URL
 */
export function getCoverImageUrl(imagePath: string, width: number = 500, height: number = 500): string {
  // If it's already a full URL, return as-is
  if (imagePath.includes('http://') || imagePath.includes('https://')) {
    return imagePath;
  }
  
  // Remove leading slash if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Construct the Supabase storage URL with optimization
  return `https://api.evento.so/storage/v1/render/image/public/cdn/${cleanPath}?width=${width}&height=${height}`;
}

/**
 * Gets a 500x500 optimized cover image URL (most common use case)
 * @param imagePath - The relative path to the image
 * @returns Optimized 500x500 image URL
 */
export function getCoverImageUrl500x500(imagePath: string): string {
  return getCoverImageUrl(imagePath, 500, 500);
}

/**
 * Gets a thumbnail version of the cover image (for previews)
 * @param imagePath - The relative path to the image
 * @returns Optimized 150x150 image URL
 */
export function getCoverImageThumbnail(imagePath: string): string {
  return getCoverImageUrl(imagePath, 150, 150);
}

/**
 * Gets a large version of the cover image (for full display)
 * @param imagePath - The relative path to the image
 * @returns Optimized 800x800 image URL
 */
export function getCoverImageLarge(imagePath: string): string {
  return getCoverImageUrl(imagePath, 800, 800);
}

/**
 * Extracts the relative path from a full Supabase URL
 * Used for storing images in the database as relative paths
 * @param url - Full Supabase storage URL
 * @returns Relative path or original URL if not a Supabase URL
 */
export function extractRelativePath(url: string): string {
  // If it's already a relative path, return as-is
  if (!url.includes('://')) {
    return url;
  }
  
  // Extract path from Supabase storage URL
  const supabasePattern = /\/storage\/v1\/(?:object\/public|render\/image\/public)\/cdn\/(.*?)(?:\?|$)/;
  const match = url.match(supabasePattern);
  if (match) {
    return match[1];
  }
  
  // Return original URL if it's not a Supabase URL
  return url;
}