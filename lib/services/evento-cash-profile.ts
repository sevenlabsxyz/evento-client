import { fetchUserByUsername } from '@/lib/services/user-profile';
import type { VerificationStatus } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';

export interface EventoCashProfile {
  username: string;
  displayName: string;
  avatar: string;
  verification_status?: VerificationStatus;
}

export class EventoCashProfileService {
  static async fetchProfile(lightningAddress: string): Promise<EventoCashProfile | null> {
    if (!lightningAddress.endsWith('@evento.cash')) {
      return null;
    }

    const username = lightningAddress.split('@')[0];

    if (!username) {
      return null;
    }

    try {
      const user = await fetchUserByUsername(username);

      if (!user) {
        return null;
      }

      return {
        username: user.username,
        displayName: user.name || user.username,
        avatar: user.image || '',
        verification_status: user.verification_status,
      };
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : JSON.stringify(error);

      logger.warn('Failed to fetch evento.cash profile', {
        lightningAddress,
        error: errorMessage,
      });

      return null;
    }
  }
}

export default EventoCashProfileService;
