/**
 * Email validation utility
 * Provides consistent email validation across the application
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid email address
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates and filters an array of emails, returning only valid ones
 * @param emails - Array of email strings to validate
 * @returns Array of valid email strings
 */
export const filterValidEmails = (emails: string[]): string[] => {
  return emails.filter(isValidEmail);
};
