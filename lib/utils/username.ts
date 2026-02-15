import { apiClient } from '@/lib/api/client';

/**
 * Reserved usernames that cannot be used
 * These match the backend reserved words
 */
const RESERVED_USERNAMES = ['api', 'blog', 'auth', 'e', 'event'];

/**
 * Username validation constraints
 */
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Normalizes a string to be username-compatible
 * - Converts to lowercase
 * - Removes all non-alphanumeric characters
 * - Trims whitespace
 */
export function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a username is in the reserved list
 */
export function isReservedWord(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}

/**
 * Checks username availability via API
 * Returns true if username is available, false otherwise
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const response = await apiClient.get<{ available: boolean }>(
      `/v1/user/check-username?username=${encodeURIComponent(username)}`
    );
    return response.available;
  } catch (error: any) {
    // If we get a 404, it means the username is available
    if (error.status === 404) {
      return true;
    }
    // For other errors, assume username is not available
    return false;
  }
}

/**
 * Generates candidate username bases from email and optional name
 * Returns array of candidates in priority order (matching evento-api algorithm):
 * 1. Email prefix only
 * 2. Name only
 * 3. Email prefix + name
 * 4. Name + email prefix
 */
export function generateUsernameBase(email: string, name?: string): string[] {
  const candidates: string[] = [];

  // Extract email prefix (before @)
  const emailPrefix = email.split('@')[0];
  const normalizedEmailPrefix = normalizeUsername(emailPrefix);

  // 1. Email prefix only
  if (normalizedEmailPrefix.length >= USERNAME_MIN_LENGTH) {
    candidates.push(normalizedEmailPrefix.slice(0, USERNAME_MAX_LENGTH));
  }

  // If name is provided, add name-based candidates
  if (name && name.trim()) {
    const normalizedName = normalizeUsername(name);

    // 2. Name only
    if (normalizedName.length >= USERNAME_MIN_LENGTH) {
      candidates.push(normalizedName.slice(0, USERNAME_MAX_LENGTH));
    }

    // 3. Email prefix + name
    const emailPlusName = normalizedEmailPrefix + normalizedName;
    if (emailPlusName.length >= USERNAME_MIN_LENGTH) {
      candidates.push(emailPlusName.slice(0, USERNAME_MAX_LENGTH));
    }

    // 4. Name + email prefix
    const namePlusEmail = normalizedName + normalizedEmailPrefix;
    if (namePlusEmail.length >= USERNAME_MIN_LENGTH) {
      candidates.push(namePlusEmail.slice(0, USERNAME_MAX_LENGTH));
    }
  }

  // Filter out reserved words and duplicates
  const uniqueCandidates = Array.from(new Set(candidates)).filter(
    (candidate) => !isReservedWord(candidate)
  );

  return uniqueCandidates;
}

/**
 * Generates an available username from email and optional name
 * - Generates candidate bases using email and name
 * - Checks availability for each candidate
 * - If taken, appends numeric suffix (2, 3, 4, etc.) without separators
 * - Returns first available username
 * - Throws error if no username found after MAX_GENERATION_ATTEMPTS
 */
export async function generateAvailableUsername(email: string, name?: string): Promise<string> {
  const candidates = generateUsernameBase(email, name);

  if (candidates.length === 0) {
    throw new Error('Unable to generate valid username from provided email and name');
  }

  // Try each candidate base
  for (const base of candidates) {
    // Try base without suffix first
    const isAvailable = await checkUsernameAvailability(base);
    if (isAvailable) {
      return base;
    }

    // Try with numeric suffixes (2, 3, 4, ..., MAX_GENERATION_ATTEMPTS)
    for (let i = 2; i <= MAX_GENERATION_ATTEMPTS; i++) {
      const candidate = `${base}${i}`;

      // Ensure candidate doesn't exceed max length
      if (candidate.length > USERNAME_MAX_LENGTH) {
        // Trim base to make room for suffix
        const suffixLength = i.toString().length;
        const trimmedBase = base.slice(0, USERNAME_MAX_LENGTH - suffixLength);
        const trimmedCandidate = `${trimmedBase}${i}`;

        const isAvailable = await checkUsernameAvailability(trimmedCandidate);
        if (isAvailable) {
          return trimmedCandidate;
        }
      } else {
        const isAvailable = await checkUsernameAvailability(candidate);
        if (isAvailable) {
          return candidate;
        }
      }
    }
  }

  // If we exhausted all candidates and suffixes, throw error
  throw new Error(`Unable to find available username after ${MAX_GENERATION_ATTEMPTS} attempts`);
}
