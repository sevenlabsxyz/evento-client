import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserDetails } from '../types/api';

interface AuthState {
  // State
  user: UserDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null; // Store email during login flow
  
  // Actions
  setUser: (user: UserDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setEmail: (email: string) => void;
  clearEmail: () => void;
  clearAuth: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      email: null,
      
      // Actions
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        }),
      
      setLoading: (loading) => 
        set({ isLoading: loading }),
      
      setEmail: (email) => 
        set({ email }),
      
      clearEmail: () => 
        set({ email: null }),
      
      clearAuth: () => 
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          email: null 
        }),
      
      reset: () => 
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          email: null
        }),
    }),
    {
      name: 'evento-auth-storage',
      
      // Only persist non-sensitive data
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist email for security
      }),
      
      // Rehydrate the store on app start
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure isAuthenticated matches user state
          state.isAuthenticated = !!state.user;
          state.isLoading = false;
        }
      },
    }
  )
);

// Selectors for easy access to commonly used state
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, email } = useAuthStore();
  return { user, isAuthenticated, isLoading, email };
};

export const useAuthActions = () => {
  const { setUser, setLoading, setEmail, clearEmail, clearAuth, reset } = useAuthStore();
  return { setUser, setLoading, setEmail, clearEmail, clearAuth, reset };
};