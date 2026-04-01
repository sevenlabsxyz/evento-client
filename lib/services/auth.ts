import { DEFAULT_AVATAR_IMAGE } from '@/lib/constants/avatar';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '../api/client';
import { createClient } from '../supabase/client';
import { ApiError, ApiResponse, UserDetails } from '../types/api';

export class UnauthenticatedError extends Error {
  status: number;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthenticatedError';
    this.status = 401;
  }
}

interface GetCurrentUserOptions {
  requireSession?: boolean;
  fallbackToNullOnTransientError?: boolean;
}

export const authService = {
  /**
   * Send OTP code to email via Supabase SDK
   */
  sendLoginCode: async (email: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Verify OTP code via Supabase SDK
   */
  verifyCode: async (email: string, code: string): Promise<UserDetails> => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user data returned from verification');
    }

    logger.debug('Auth: OTP verification successful for user', { userId: data.user.id });
    logger.debug('Auth: User metadata', { metadata: data.user.user_metadata });

    // Return minimal user details - actual data will come from backend
    // Don't populate username/name from email as it causes false positive onboarding checks
    const userDetails = {
      id: data.user.id,
      username: data.user.user_metadata?.username || '',
      name: data.user.user_metadata?.full_name || '',
      bio: '',
      image: data.user.user_metadata?.avatar_url || DEFAULT_AVATAR_IMAGE,
      bio_link: '',
      x_handle: '',
      instagram_handle: '',
      ln_address: '',
      nip05: '',
      verification_status: null,
      verification_date: '',
    };

    logger.debug('Auth: Returning user details from verifyCode', { userDetails });
    return userDetails;
  },

  /**
   * Get current authenticated user from your backend
   * GET /v1/user
   */
  getCurrentUser: async (options: GetCurrentUserOptions = {}): Promise<UserDetails | null> => {
    const { requireSession = false, fallbackToNullOnTransientError = false } = options;

    let sessionSettling = false;

    try {
      // Check if we have a current session
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!requireSession) {
          logger.debug('Auth: No session found, returning null');
          return null;
        }

        // getSession() reads from local cache and can miss during hard
        // refreshes or right after OAuth callback while the session is
        // still settling.  Fall back to the authoritative server check
        // before treating this as a confirmed logout.
        logger.debug('Auth: No cached session, falling back to getUser()');
        const {
          data: { user: supabaseUser },
          error: getUserError,
        } = await supabase.auth.getUser();

        if (getUserError) {
          // getUser() itself failed — this is transient, not a confirmed logout.
          logger.warn('Auth: getUser() failed while verifying missing session', {
            error: getUserError.message,
          });

          if (fallbackToNullOnTransientError) {
            return null;
          }

          throw getUserError;
        }

        if (!supabaseUser) {
          // Both getSession() and getUser() agree: no user. Confirmed logout.
          logger.debug('Auth: getUser() also returned null, confirmed unauthenticated');
          throw new UnauthenticatedError('No session found');
        }

        logger.debug('Auth: getUser() found user despite missing cached session', {
          userId: supabaseUser.id,
        });
        // Session is settling — continue to the backend call, but mark
        // that any backend error should be treated as transient since we
        // know the Supabase session is valid.
        sessionSettling = true;
      }

      logger.debug('Auth: Fetching current user from backend');
      const response = await apiClient.get<ApiResponse<UserDetails[]>>('/v1/user');

      // Handle both response formats (array or object with data property)
      logger.debug('Auth: Raw API response', { response });

      let userData: UserDetails[] | null = null;

      // Check if response is an object with data property
      if (response && typeof response === 'object' && 'data' in response) {
        logger.debug('Auth: Response is object with data property');
        userData = (response as any).data;
      } else if (Array.isArray(response)) {
        logger.debug('Auth: Response is array directly');
        userData = response;
      }

      // Handle empty array case explicitly
      if (!userData || !Array.isArray(userData) || userData.length === 0) {
        logger.debug('Auth: No user data found (empty array), returning null');
        return null;
      }

      const firstUser = userData[0];
      logger.debug('Auth: Returning user', { userId: firstUser?.id });
      return firstUser;
    } catch (error) {
      // When callers opt into fallback mode (bootstrap flows like OAuth
      // callback, inline OTP), return null for ALL errors including 401s —
      // the session may still be settling and the caller will retry.
      if (fallbackToNullOnTransientError) {
        logger.debug('Auth: Falling back to null after current-user failure', {
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }

      // If getUser() confirmed a valid Supabase session but the backend
      // returned an error (e.g. 401 because the cookie hasn't settled),
      // treat it as transient — the session IS valid, the backend just
      // hasn't caught up yet.
      if (sessionSettling) {
        logger.warn('Auth: Backend error during session settlement, treating as transient', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      const apiError = error as Partial<ApiError> | undefined;
      if (
        error instanceof UnauthenticatedError ||
        apiError?.status === 401 ||
        apiError?.message?.includes('401') ||
        apiError?.message?.includes('Unauthorized')
      ) {
        logger.debug('Auth: Confirmed unauthenticated state', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error instanceof UnauthenticatedError
          ? error
          : new UnauthenticatedError(apiError?.message || 'Unauthorized');
      }

      logger.error('Auth: Failed to get current user', {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  },

  /**
   * Login with Google OAuth via Supabase SDK
   */
  loginWithGoogle: async (): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Logout user via Supabase SDK
   */
  logout: async (): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw here - we want to continue even if logout fails
    }
  },

  /**
   * Check if user is authenticated by trying to get current user
   * This is useful for checking auth status on app start
   */
  checkAuth: async (): Promise<UserDetails | null> => {
    return await authService.getCurrentUser({ requireSession: true });
  },

  /**
   * Handle OAuth callback
   * This would be called after successful OAuth redirect
   */
  handleOAuthCallback: async (): Promise<UserDetails | null> => {
    try {
      const supabase = createClient();
      // Wait for the session to be established
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return null;
      }

      // Get user from backend
      return await authService.getCurrentUser();
    } catch (error) {
      logger.error('OAuth callback failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  /**
   * Get current Supabase session
   */
  getSession: async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Get current Supabase user
   */
  getSupabaseUser: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },
};

// Helper function to handle API errors consistently
export const handleAuthError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    return apiError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Common auth error types for better error handling
export const AuthErrorTypes = {
  INVALID_EMAIL: 'Invalid email format',
  INVALID_CODE: 'Invalid verification code',
  CODE_EXPIRED: 'Verification code has expired',
  USER_NOT_FOUND: 'User not found',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;
