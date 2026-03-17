/**
 * Compress and convert an image file to JPEG using Canvas API.
 * Handles HEIC/HEIF and other formats by drawing to canvas and exporting as JPEG.
 * Resizes large images to maxDimension while preserving aspect ratio.
 */
export async function compressImageForUpload(
  file: File,
  options: { maxDimension?: number; quality?: number; maxSizeBytes?: number } = {}
): Promise<File> {
  const { maxDimension = 1600, quality = 0.85, maxSizeBytes = 2 * 1024 * 1024 } = options;

  // Skip compression for small files that are already JPEG/PNG/WebP
  const compressibleTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const fileType = file.type.toLowerCase();
  if (fileType === 'image/gif') {
    // Don't compress GIFs (animation would be lost)
    return file;
  }

  // If already small enough and a web-safe format, skip compression
  if (file.size <= maxSizeBytes && (fileType === 'image/jpeg' || fileType === 'image/webp')) {
    return file;
  }

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Canvas not supported, return original file
        resolve(file);
        return;
      }

      // Draw with white background (for PNGs with transparency)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Blob creation failed, return original file
            resolve(file);
            return;
          }

          // Create a new File with .jpg extension
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // If we can't load the image (e.g. unsupported format), return original
      resolve(file);
    };

    img.src = objectUrl;
  });
}
