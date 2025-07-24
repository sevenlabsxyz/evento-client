/**
 * Utility functions for handling emojis in event titles
 */

/**
 * Extracts emoji from the beginning of a title if present
 * @param title - The title to parse
 * @returns Object with emoji and clean title
 */
export const extractEmojiFromTitle = (title: string): { emoji: string | null; cleanTitle: string } => {
  if (!title) return { emoji: null, cleanTitle: "" };
  
  const trimmed = title.trim();
  
  // Enhanced emoji detection that handles most common cases
  // Split into segments and check if first segment is an emoji
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex > 0) {
    const possibleEmoji = trimmed.substring(0, spaceIndex);
    const remainingText = trimmed.substring(spaceIndex + 1);
    
    // Check if the first segment looks like an emoji
    // This handles most emoji including compound ones
    if (possibleEmoji.length <= 8 && containsEmoji(possibleEmoji)) {
      return { emoji: possibleEmoji, cleanTitle: remainingText };
    }
  }
  
  return { emoji: null, cleanTitle: trimmed };
};

/**
 * Helper function to detect if a string contains emoji characters
 */
function containsEmoji(str: string): boolean {
  // Check for common emoji unicode ranges
  for (let i = 0; i < str.length; i++) {
    const charCode = str.codePointAt(i) || 0;
    
    // Common emoji ranges
    if (
      (charCode >= 0x1F600 && charCode <= 0x1F64F) || // Emoticons
      (charCode >= 0x1F300 && charCode <= 0x1F5FF) || // Misc symbols
      (charCode >= 0x1F680 && charCode <= 0x1F6FF) || // Transport
      (charCode >= 0x1F1E6 && charCode <= 0x1F1FF) || // Regional indicators
      (charCode >= 0x2600 && charCode <= 0x26FF) ||   // Misc symbols
      (charCode >= 0x2700 && charCode <= 0x27BF) ||   // Dingbats
      (charCode >= 0x1F900 && charCode <= 0x1F9FF) || // Supplemental symbols
      (charCode >= 0x1FA70 && charCode <= 0x1FAFF)    // Extended symbols
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Builds a title with emoji prefix if provided
 * @param emoji - The emoji to prefix with
 * @param cleanTitle - The clean title without emoji
 * @returns The final title with emoji prefix if applicable
 */
export const buildTitleWithEmoji = (emoji: string | null, cleanTitle: string): string => {
  if (!emoji) return cleanTitle;
  if (!cleanTitle) return cleanTitle; // Don't add emoji to empty title
  return `${emoji} ${cleanTitle}`;
};

/**
 * Gets display title for UI (clean title without emoji)
 * @param title - The full title that may contain emoji
 * @returns Clean title for display
 */
export const getDisplayTitle = (title: string): string => {
  const { cleanTitle } = extractEmojiFromTitle(title);
  return cleanTitle;
};

/**
 * Gets emoji from title for UI selection
 * @param title - The full title that may contain emoji
 * @returns The emoji if present
 */
export const getEmojiFromTitle = (title: string): string | null => {
  const { emoji } = extractEmojiFromTitle(title);
  return emoji;
};