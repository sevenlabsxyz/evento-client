import { apiClient } from '../api/client';
import { createClient } from '../supabase/client';
import { ApiError, ApiResponse, UserDetails } from '../types/api';

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

    console.log('Auth: OTP verification successful for user:', data.user.id);
    console.log('Auth: User metadata:', data.user.user_metadata);

    // Return minimal user details - actual data will come from backend
    // Don't populate username/name from email as it causes false positive onboarding checks
    const userDetails = {
      id: data.user.id,
      username: data.user.user_metadata?.username || '',
      name: data.user.user_metadata?.full_name || '',
      bio: '',
      image: data.user.user_metadata?.avatar_url || '',
      bio_link: '',
      x_handle: '',
      instagram_handle: '',
      ln_address: '',
      nip05: '',
      verification_status: null,
      verification_date: '',
    };
    
    console.log('Auth: Returning user details from verifyCode:', userDetails);
    return userDetails;
  },

  /**
   * Get current authenticated user from your backend
   * GET /v1/user
   */
  getCurrentUser: async (): Promise<UserDetails | null> => {
    try {
      // Check if we have a current session
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log('Auth: No session found, returning null');
        return null; // No session means not authenticated
      }

      console.log('Auth: Fetching current user from backend');
      const response = await apiClient.get<ApiResponse<UserDetails[]>>('/v1/user');

      // Handle both response formats (array or object with data property)
      console.log('Auth: Raw API response:', response);
      
      let userData: UserDetails[] | null = null;
      
      // Check if response is an object with data property
      if (response && typeof response === 'object' && 'data' in response) {
        console.log('Auth: Response is object with data property');
        userData = (response as any).data;
      } else if (Array.isArray(response)) {
        console.log('Auth: Response is array directly');
        userData = response;
      }
      
      // Handle empty array case explicitly
      if (!userData || !Array.isArray(userData) || userData.length === 0) {
        console.log('Auth: No user data found (empty array), returning null');
        return null;
      }
      
      const firstUser = userData[0];
      console.log('Auth: Returning user:', firstUser);
      return firstUser;
    } catch (error) {
      console.error('Auth: Failed to get current user:', (error as any)?.message || error);
      // Return null if user not authenticated or error occurs
      return null;
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
      console.error('Logout failed:', error);
      // Don't throw here - we want to continue even if logout fails
    }
  },

  /**
   * Check if user is authenticated by trying to get current user
   * This is useful for checking auth status on app start
   */
  checkAuth: async (): Promise<UserDetails | null> => {
    return await authService.getCurrentUser();
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
      console.error('OAuth callback failed:', error);
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
