export const isValidRelativePath = (path: string): boolean => {
  try {
    // Only allow relative paths that start with / and don't contain protocol or host
    return path.startsWith('/') && !path.includes('://') && !path.startsWith('//');
  } catch {
    return false;
  }
};
