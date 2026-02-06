import { logger } from '@/lib/utils/logger';

/**
 * Utility for managing event password access in localStorage with TTL
 */

const STORAGE_KEY = 'evento_password_access';
const TTL_DAYS = 7;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

interface EventAccessEntry {
  eventId: string;
  grantedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

interface EventAccessStore {
  entries: EventAccessEntry[];
}

/**
 * Get the current access store from localStorage
 */
function getStore(): EventAccessStore {
  if (typeof window === 'undefined') {
    return { entries: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { entries: [] };
    }
    return JSON.parse(stored) as EventAccessStore;
  } catch {
    return { entries: [] };
  }
}

/**
 * Save the access store to localStorage
 */
function saveStore(store: EventAccessStore): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    logger.error('Failed to save event access store', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(store: EventAccessStore): EventAccessStore {
  const now = Date.now();
  return {
    entries: store.entries.filter((entry) => entry.expiresAt > now),
  };
}

/**
 * Check if the user has valid access to a password-protected event
 */
export function hasEventAccess(eventId: string): boolean {
  const store = cleanupExpiredEntries(getStore());
  saveStore(store); // Save cleaned store

  const entry = store.entries.find((e) => e.eventId === eventId);
  if (!entry) {
    return false;
  }

  return entry.expiresAt > Date.now();
}

/**
 * Grant access to a password-protected event
 */
export function grantEventAccess(eventId: string): void {
  const store = cleanupExpiredEntries(getStore());

  // Remove existing entry for this event if any
  const filteredEntries = store.entries.filter((e) => e.eventId !== eventId);

  const now = Date.now();
  const newEntry: EventAccessEntry = {
    eventId,
    grantedAt: now,
    expiresAt: now + TTL_MS,
  };

  store.entries = [...filteredEntries, newEntry];
  saveStore(store);
}

/**
 * Revoke access to a password-protected event
 */
export function revokeEventAccess(eventId: string): void {
  const store = getStore();
  store.entries = store.entries.filter((e) => e.eventId !== eventId);
  saveStore(store);
}

/**
 * Clear all event access entries
 */
export function clearAllEventAccess(): void {
  saveStore({ entries: [] });
}

/**
 * Get access info for a specific event (for debugging/display)
 */
export function getEventAccessInfo(eventId: string): EventAccessEntry | null {
  const store = cleanupExpiredEntries(getStore());
  return store.entries.find((e) => e.eventId === eventId) || null;
}
