import apiClient from '@/lib/api/client';
import { UserDetails } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

export interface EventoCashProfile {
  username: string;
  displayName: string;
  avatar: string;
}

export class EventoCashProfileService {
  /**
   * Fetch Evento Cash profile from a Lightning address
   * Only works for @evento.cash addresses
   * Returns null for non-evento addresses or any error
   */
  static async fetchProfile(lightningAddress: string): Promise<EventoCashProfile | null> {
    // Only process @evento.cash addresses
    if (!lightningAddress.endsWith('@evento.cash')) {
      return null;
    }

    // Extract username from lightning address (alice@evento.cash -> alice)
    const username = lightningAddress.split('@')[0];

    if (!username) {
      return null;
    }

    try {
      // Fetch user by username from the API
      const response = await apiClient.get<UserDetails>(`/v1/users/username/${username}`);

      if (!response) {
        return null;
      }

      return {
        username: response.username,
        displayName: response.name,
        avatar: response.image,
      };
    } catch (error) {
      // Log for debugging but don't throw - profile enrichment is optional
      logger.warn('Failed to fetch evento.cash profile', {
        lightningAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

export default EventoCashProfileService;
