export const sanitizeFileName = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Sanitizes a filename for safe upload by:
 * - Removing dangerous path traversal characters
 * - Preserving the file extension 
 * - Replacing unsafe characters with underscores
 * - Limiting length to prevent issues
 */
export const sanitizeUploadFileName = (filename: string): string => {
  if (!filename) return 'file';
  
  // Split filename and extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex >= 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex >= 0 ? filename.substring(lastDotIndex) : '';
  
  // Sanitize the name part - allow alphanumeric, hyphens, underscores
  const safeName = name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
    .substring(0, 50); // Limit length
  
  // Sanitize extension - only allow common safe extensions
  const safeExtension = extension
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .substring(0, 10); // Limit extension length
  
  // Ensure we have a valid name
  const finalName = safeName || 'file';
  
  return finalName + safeExtension;
};
