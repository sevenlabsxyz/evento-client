'use client';

import { ApiError, UserDetails } from '@/lib/types/api';
import { getOnboardingRedirectUrl } from '@/lib/utils/auth';
import { logger } from '@/lib/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authService, UnauthenticatedError } from '../services/auth';
import { useAuthStore } from '../stores/auth-store';

const AUTH_QUERY_KEY = ['auth', 'user'] as const;
const USER_PROFILE_QUERY_KEY = ['user', 'profile'] as const;
const HUB_QUERY_KEY = ['hub'] as const;
const RECOVERY_RETRY_DELAYS_MS = [250, 500, 1000] as const;

type AuthRecoveryStatus = 'idle' | 'checking' | 'recovering';

type AuthRecoveryResult =
  | {
      status: 'authenticated';
      user: UserDetails;
    }
  | {
      status: 'unauthenticated';
    }
  | {
      status: 'error';
      error: Error | ApiError;
    };

interface EnsureRequiredAuthOptions {
  reason?: string;
}

interface RequireAuthForPageOptions {
  redirectPath?: string;
  requireOnboarding?: boolean;
}

interface RequireAuthForPageResult {
  status: 'checking' | 'recovering' | 'authenticated' | 'redirecting' | 'error';
  user: UserDetails | null;
  error: Error | ApiError | null;
}

interface EnsureAuthenticatedActionOptions {
  reason?: string;
  redirectPath?: string;
}

interface AuthRecoveryContextValue {
  status: AuthRecoveryStatus;
  ensureRequiredAuth: (options?: EnsureRequiredAuthOptions) => Promise<AuthRecoveryResult>;
  reconcileOptionalAuth: (options?: EnsureRequiredAuthOptions) => Promise<AuthRecoveryResult>;
}

const AuthRecoveryContext = createContext<AuthRecoveryContextValue | null>(null);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/client');
  return createClient();
}

function buildFallbackUser(supabaseUser: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}): UserDetails {
  const metadata = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id: supabaseUser.id,
    username: typeof metadata.username === 'string' ? metadata.username : '',
    name: typeof metadata.full_name === 'string' ? metadata.full_name : '',
    bio: '',
    image: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : '',
    bio_link: '',
    x_handle: '',
    instagram_handle: '',
    ln_address: '',
    nip05: '',
    verification_status: null,
    verification_date: '',
  };
}

function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof UnauthenticatedError) {
    return true;
  }

  const apiError = error as Partial<ApiError> | undefined;
  return Boolean(
    apiError?.status === 401 ||
    apiError?.message?.includes('401') ||
    apiError?.message?.includes('Unauthorized') ||
    apiError?.message?.includes('Not authenticated')
  );
}

export function AuthRecoveryProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { setUser, clearAuth } = useAuthStore();
  const [status, setStatus] = useState<AuthRecoveryStatus>('idle');
  const inFlightRef = useRef<Promise<AuthRecoveryResult> | null>(null);

  const syncAuthenticatedUser = useCallback(
    (user: UserDetails) => {
      setUser(user);
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, user);
    },
    [queryClient, setUser]
  );

  const clearStaleAuth = useCallback(() => {
    clearAuth();
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    queryClient.removeQueries({ queryKey: USER_PROFILE_QUERY_KEY });
    queryClient.removeQueries({ queryKey: HUB_QUERY_KEY });
  }, [clearAuth, queryClient]);

  const runRecovery = useCallback(
    async (reason?: string): Promise<AuthRecoveryResult> => {
      const supabase = await getSupabaseClient();
      const {
        data: { user: supabaseUser },
        error: supabaseUserError,
      } = await supabase.auth.getUser();

      if (supabaseUserError) {
        logger.warn('Auth recovery: Supabase getUser failed during recovery', {
          reason,
          error: supabaseUserError.message,
        });
      }

      if (!supabaseUser) {
        logger.info('Auth recovery: no Supabase user found, clearing stale auth', { reason });
        clearStaleAuth();
        return { status: 'unauthenticated' };
      }

      for (const delayMs of RECOVERY_RETRY_DELAYS_MS) {
        const result = await authService.tryGetCurrentUser();

        if (result.user) {
          logger.info('Auth recovery: restored authenticated session', {
            reason,
            userId: result.user.id,
          });
          syncAuthenticatedUser(result.user);
          return { status: 'authenticated', user: result.user };
        }

        if (result.settled) {
          const fallbackUser = buildFallbackUser(supabaseUser);
          logger.warn('Auth recovery: backend user unavailable but Supabase session is valid', {
            reason,
            userId: supabaseUser.id,
          });
          syncAuthenticatedUser(fallbackUser);
          return { status: 'authenticated', user: fallbackUser };
        }

        await wait(delayMs);
      }

      const {
        data: { user: finalSupabaseUser },
      } = await supabase.auth.getUser();

      if (!finalSupabaseUser) {
        logger.info('Auth recovery: session disappeared during recovery, clearing stale auth', {
          reason,
        });
        clearStaleAuth();
        return { status: 'unauthenticated' };
      }

      const error = new Error('Unable to restore your session right now. Please try again.');
      logger.error('Auth recovery: session did not settle after retries', {
        reason,
        userId: finalSupabaseUser.id,
      });
      return { status: 'error', error };
    },
    [clearStaleAuth, syncAuthenticatedUser]
  );

  const ensureRequiredAuth = useCallback(
    async ({
      reason = 'required-page',
    }: EnsureRequiredAuthOptions = {}): Promise<AuthRecoveryResult> => {
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const operation = (async () => {
        setStatus('checking');

        try {
          const user = await authService.getCurrentUser({ requireSession: true });

          if (user) {
            syncAuthenticatedUser(user);
            return { status: 'authenticated', user } satisfies AuthRecoveryResult;
          }

          setStatus('recovering');
          return await runRecovery(reason);
        } catch (error) {
          if (isUnauthorizedError(error)) {
            logger.warn('Auth recovery: authoritative auth check failed, attempting recovery', {
              reason,
              error: error instanceof Error ? error.message : String(error),
            });
            setStatus('recovering');
            return await runRecovery(reason);
          }

          logger.error('Auth recovery: required auth check failed unexpectedly', {
            reason,
            error: error instanceof Error ? error.message : String(error),
          });

          return {
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          } satisfies AuthRecoveryResult;
        } finally {
          setStatus('idle');
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = operation;
      return operation;
    },
    [runRecovery, syncAuthenticatedUser]
  );

  const reconcileOptionalAuth = useCallback(
    async ({
      reason = 'optional-auth',
    }: EnsureRequiredAuthOptions = {}): Promise<AuthRecoveryResult> => {
      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const operation = (async () => {
        setStatus('recovering');

        try {
          const result = await runRecovery(reason);

          if (result.status !== 'authenticated') {
            clearStaleAuth();
          }

          return result;
        } catch (error) {
          clearStaleAuth();
          return {
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          } satisfies AuthRecoveryResult;
        } finally {
          setStatus('idle');
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = operation;
      return operation;
    },
    [clearStaleAuth, runRecovery]
  );

  const value = useMemo<AuthRecoveryContextValue>(
    () => ({
      status,
      ensureRequiredAuth,
      reconcileOptionalAuth,
    }),
    [ensureRequiredAuth, reconcileOptionalAuth, status]
  );

  return <AuthRecoveryContext.Provider value={value}>{children}</AuthRecoveryContext.Provider>;
}

export function useAuthRecovery() {
  const context = useContext(AuthRecoveryContext);

  if (!context) {
    throw new Error('useAuthRecovery must be used within an AuthRecoveryProvider');
  }

  return context;
}

export function useRequireAuthForPage({
  redirectPath,
  requireOnboarding = false,
}: RequireAuthForPageOptions = {}): RequireAuthForPageResult {
  const router = useRouter();
  const pathname = usePathname();
  const { status: recoveryStatus, ensureRequiredAuth } = useAuthRecovery();
  const [state, setState] = useState<RequireAuthForPageResult>({
    status: 'checking',
    user: null,
    error: null,
  });

  const targetPath = redirectPath || pathname;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const result = await ensureRequiredAuth({ reason: `page:${targetPath}` });

      if (cancelled) {
        return;
      }

      if (result.status === 'authenticated') {
        if (requireOnboarding && (!result.user.username?.trim() || !result.user.name?.trim())) {
          setState({ status: 'redirecting', user: result.user, error: null });
          router.push(getOnboardingRedirectUrl(targetPath));
          return;
        }

        setState({ status: 'authenticated', user: result.user, error: null });
        return;
      }

      if (result.status === 'unauthenticated') {
        setState({ status: 'redirecting', user: null, error: null });
        router.push(`/auth/login?redirect=${encodeURIComponent(targetPath)}`);
        return;
      }

      setState({ status: 'error', user: null, error: result.error });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [ensureRequiredAuth, requireOnboarding, router, targetPath]);

  if (state.status === 'checking' && recoveryStatus === 'recovering') {
    return {
      ...state,
      status: 'recovering',
    };
  }

  return state;
}

export function useEnsureAuthenticatedAction() {
  const router = useRouter();
  const pathname = usePathname();
  const { ensureRequiredAuth } = useAuthRecovery();

  return useCallback(
    async ({
      reason = 'protected-action',
      redirectPath,
    }: EnsureAuthenticatedActionOptions = {}) => {
      const targetPath = redirectPath || pathname;
      const result = await ensureRequiredAuth({ reason });

      if (result.status === 'authenticated') {
        return true;
      }

      router.push(`/auth/login?redirect=${encodeURIComponent(targetPath)}`);
      return false;
    },
    [ensureRequiredAuth, pathname, router]
  );
}
