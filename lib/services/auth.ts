import { apiClient } from '../api/client';
import { 
  UserDetails, 
  LoginRequest, 
  VerifyCodeRequest, 
  ApiResponse,
  ApiError 
} from '../types/api';

// Supabase auth client for direct API calls
const supabaseAuthClient = {
  baseURL: process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1',
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response.json();
  }
};

export const authService = {
  /**
   * Send OTP code to email via Supabase
   * POST /auth/v1/otp
   */
  sendLoginCode: async (email: string): Promise<void> => {
    await supabaseAuthClient.post('/otp', {
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  },

  /**
   * Verify OTP code via Supabase
   * POST /auth/v1/verify
   */
  verifyCode: async (email: string, code: string): Promise<UserDetails> => {
    const response = await supabaseAuthClient.post('/verify', {
      type: 'email',
      email,
      token: code,
    });
    
    // Convert Supabase user to your UserDetails format
    return {
      id: response.user.id,
      email: response.user.email,
      // Add other fields as needed
    };
  },

  /**
   * Get current authenticated user from your backend
   * GET /v1/user
   */
  getCurrentUser: async (): Promise<UserDetails[]> => {
    const response = await apiClient.get<ApiResponse<UserDetails[]>>('/v1/user');
    return response.data;
  },

  /**
   * Login with Google OAuth via Supabase
   * Redirects to Supabase OAuth endpoint
   */
  loginWithGoogle: (): void => {
    const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://api.evento.so/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`;
  },

  /**
   * Logout user - clear both Supabase and your backend session
   * POST /auth/v1/logout (Supabase) + your backend cleanup
   */
  logout: async (): Promise<void> => {
    try {
      // Logout from Supabase
      await supabaseAuthClient.post('/logout', {});
      
      // Also clear your backend session if needed
      try {
        await apiClient.post('/auth/logout');
      } catch (backendError) {
        // Backend logout failed, but continue with local cleanup
        console.warn('Backend logout failed:', backendError);
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  },

  /**
   * Check if user is authenticated by trying to get current user
   * This is useful for checking auth status on app start
   */
  checkAuth: async (): Promise<UserDetails | null> => {
    try {
      const users = await authService.getCurrentUser();
      return users[0] || null;
    } catch (error) {
      // If we get 401 or any error, user is not authenticated
      return null;
    }
  },

  /**
   * Handle OAuth callback
   * This would be called after successful OAuth redirect
   */
  handleOAuthCallback: async (): Promise<UserDetails | null> => {
    try {
      // After OAuth redirect, the backend should have set a session cookie
      // So we just need to get the current user
      const users = await authService.getCurrentUser();
      return users[0] || null;
    } catch (error) {
      console.error('OAuth callback failed:', error);
      return null;
    }
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