/**
 * Get optimized image URL using Supabase image transformations
 * @param url - Image URL (can be relative path or full URL)
 * @param size - Image width in pixels (default: 500)
 * @param quality - Image quality 1-100 (default: 80)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
	url: string,
	size: number = 500,
	quality: number = 80
): string {
	if (!url) {
		return '/assets/img/evento-sublogo.svg';
	}

	// If URL already contains https, return as-is (external image)
	if (url.includes('https://')) {
		return url;
	}

	// For Supabase storage URLs, add transformation parameters
	// Let height auto-adjust to maintain aspect ratio
	return `https://api.evento.so/storage/v1/object/public/cdn/${url}?width=${size}&quality=${quality}`;
}

/**
 * Check if the URL is a GIF
 * @param url - Image URL
 * @returns true if the URL is a GIF, false otherwise
 */
export function isGif(url: string): boolean {
	if (!url) {
		return false;
	}
	return url.endsWith('.gif') || url.includes('media.giphy.com');
}

/**
 * Preset image sizes for different use cases
 */
export const ImageSizes = {
	SMALL: 300, // Thumbnails, avatars
	MEDIUM: 500, // Feed cards, list items
	LARGE: 800, // Detail views, hero sections
	XLARGE: 1200, // Full-screen, high-res displays
} as const;

/**
 * Get optimized image URL with preset sizes
 */
export function getOptimizedImageUrlPreset(
	url: string,
	preset: keyof typeof ImageSizes = 'MEDIUM'
): string {
	return getOptimizedImageUrl(url, ImageSizes[preset]);
}

/**
 * Get avatar image URL optimized for user avatars
 */
export function getOptimizedAvatarUrl(url: string): string {
	return getOptimizedImageUrl(url, ImageSizes.SMALL, 85);
}

/**
 * Get cover image URL optimized for event covers
 */
export function getOptimizedCoverUrl(url: string, size: 'feed' | 'detail' = 'feed'): string {
	const imageSize = size === 'feed' ? ImageSizes.MEDIUM : ImageSizes.LARGE;
	return getOptimizedImageUrl(url, imageSize, 80);
}
