import apiClient from '@/lib/api/client';
import { UserDetails } from '@/lib/types/api';

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
    } catch {
      // Never throw - return null on any error (404, network, etc.)
      return null;
    }
  }
}

export default EventoCashProfileService;
