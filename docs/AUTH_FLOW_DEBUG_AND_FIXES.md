# Auth Flow Debug Analysis & Proposed Fixes

> **Created:** January 16, 2025  
> **Status:** Analysis Complete - Pending Implementation  
> **Priority:** High - Multiple users reporting sign-up issues

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Auth Flow Diagram](#complete-auth-flow-diagram)
3. [User Scenarios](#user-scenarios)
4. [Identified Issues](#identified-issues)
    - [Scenario 1: Backend Empty Array for New Users](#scenario-1-backend-v1user-returns-empty-array-for-new-users)
    - [Scenario 3: Onboarding Profile Update Failure](#scenario-3-onboarding-profile-update-failure-silent-fail)
    - [Scenario 5: Username Availability Race Condition](#scenario-5-username-availability-race-condition)
    - [Scenario 8: Flickering/Skeleton Loading](#scenario-8-flickeringskeleton-loading-during-auth-flow)
    - [API Timeout Issues](#api-timeout-issues)
5. [Implementation Priority](#implementation-priority)
6. [Files Reference](#files-reference)

---

## Executive Summary

Multiple users have reported issues with the sign-up flow. After thorough investigation of the codebase, we identified **5 key issues** that could cause sign-up failures or poor UX:

| Issue                                     | Severity | Impact                              | Status  |
| ----------------------------------------- | -------- | ----------------------------------- | ------- |
| Backend returns empty array for new users | High     | Auth appears to fail                | Pending |
| Onboarding profile update fails silently  | High     | User stuck on onboarding            | Pending |
| Username availability race condition      | Medium   | Confusing UX                        | Pending |
| Flickering during auth flow               | High     | Poor UX, looks broken               | Pending |
| 10-second API timeout                     | Medium   | Silent failures on slow connections | Pending |

---

## Complete Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER ENTRY SCENARIOS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. NEW USER (landing page)        2. USER FROM EVENT           3. RETURNING │
│         ↓                                  ↓                         USER    │
│    / (root)                        /e/{eventId}                       ↓      │
│         ↓                          Clicks RSVP                   Has cookie  │
│  ┌──────────────┐                       ↓                             ↓      │
│  │  Beta Gate   │──────────────> /auth/login?redirect=...    Auto-redirect   │
│  │  Check       │                       ↓                     to /e/hub      │
│  └──────────────┘                                                            │
│         ↓                                                                    │
│  Enter invite code                                                           │
│         ↓                                                                    │
│  localStorage: BETA_ACCESS = 'granted'                                       │
│         ↓                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOGIN PAGE (/auth/login)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CHECKS PERFORMED:                                                           │
│  1. useBetaAccess() → If no beta access → redirect to /                      │
│  2. useRedirectIfAuthenticated() → If already logged in → redirect away     │
│                                                                              │
│  USER ACTION: Enter email → Click "Continue with Email"                      │
│         ↓                                                                    │
│  useLogin() → authService.sendLoginCode(email)                               │
│         ↓                                                                    │
│  supabase.auth.signInWithOtp({ email, emailRedirectTo: '/auth/callback' })  │
│         ↓                                                                    │
│  On success: Store email in auth-store, redirect to /auth/verify             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERIFY PAGE (/auth/verify)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CHECKS PERFORMED:                                                           │
│  1. If no email in store → redirect back to /auth/login                      │
│                                                                              │
│  USER ACTION: Enter 6-digit OTP (auto-submits on 6 chars)                    │
│         ↓                                                                    │
│  useVerifyCode() → authService.verifyCode(email, code)                       │
│         ↓                                                                    │
│  supabase.auth.verifyOtp({ email, token: code, type: 'email' })             │
│         ↓                                                                    │
│  On success:                                                                 │
│    1. clearEmail()                                                           │
│    2. authService.getCurrentUser() → GET /v1/user (backend)                  │
│    3. setUser(userData || supabaseData)  ← IMPORTANT FALLBACK               │
│    4. Check: isUserOnboarded(user)?                                          │
│       - NO username OR NO name → /onboarding?redirect=...                   │
│       - YES both → redirect to original destination                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ONBOARDING PAGE (/onboarding)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CHECKS PERFORMED:                                                           │
│  1. useBetaAccess() → If no beta access → redirect to /                      │
│  2. useRequireAuth() → If not authenticated → redirect to /auth/login        │
│                                                                              │
│  6-STEP WIZARD:                                                              │
│  Step 1: Name (required, min 3 chars)                                        │
│  Step 2: Username (required, 3-20 chars, alphanumeric, availability check)  │
│  Step 3: Avatar (optional)                                                   │
│  Step 4: Interests (optional)                                                │
│  Step 5: Prompts (optional)                                                  │
│  Step 6: Welcome Carousel                                                    │
│         ↓                                                                    │
│  On "Complete Setup":                                                        │
│    updateUserProfile.mutateAsync({ name, username, image })                  │
│         ↓                                                                    │
│  PATCH /v1/user → Backend saves user                                         │
│         ↓                                                                    │
│  Redirect to original destination or /                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Scenarios

| Scenario                | Entry Point            | Flow                                                                      | Critical Checkpoints                                 |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| **New User (cold)**     | `/` (landing)          | Beta Gate → Login → Verify → Onboarding → Hub                             | Beta access in localStorage, Backend user creation   |
| **New User from Event** | `/e/{id}` → RSVP click | Redirect to Login with `?redirect=` → Verify → Onboarding → Back to Event | Redirect URL preservation, RSVP params               |
| **Returning User**      | Any protected route    | Auto-check session → Redirect if needed → Hub                             | Cookie/session validity, Backend `/v1/user` response |
| **OAuth User**          | `/auth/login` → Google | OAuth → Callback → Token storage → User fetch → Onboarding check          | Token extraction from URL, Backend sync              |

---

## Identified Issues

---

### Scenario 1: Backend `/v1/user` Returns Empty Array for New Users

#### Problem Description

After Supabase OTP verification succeeds, `getCurrentUser()` is called, but the backend may not have created the user yet (timing/race condition with Supabase webhook). The code returns `null` which triggers fallback behavior that may confuse users.

#### Root Cause

```typescript
// lib/services/auth.ts:99-103
if (!userData || !Array.isArray(userData) || userData.length === 0) {
    console.log('Auth: No user data found (empty array), returning null');
    return null; // ← Returns null for genuinely new users
}
```

#### Current Behavior

1. User verifies OTP successfully with Supabase ✅
2. `getCurrentUser()` is called to fetch from backend
3. Backend returns `{ data: [] }` (empty array - user not yet created in backend)
4. `getCurrentUser()` returns `null`
5. Fallback in `useVerifyCode()` saves Supabase data, but UX is confusing

#### Proposed Fix

Add retry logic with exponential backoff for new users:

```typescript
// lib/services/auth.ts - Enhanced getCurrentUser with retry for new users

getCurrentUser: async (options?: {
  retryForNewUser?: boolean;
  maxRetries?: number
}): Promise<UserDetails | null> => {
  const { retryForNewUser = false, maxRetries = 3 } = options || {};

  const attemptFetch = async (attempt: number): Promise<UserDetails | null> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('Auth: No session found, returning null');
        return null;
      }

      console.log(`Auth: Fetching current user from backend (attempt ${attempt + 1})`);
      const response = await apiClient.get<ApiResponse<UserDetails[]>>('/v1/user');

      let userData: UserDetails[] | null = null;
      if (response && typeof response === 'object' && 'data' in response) {
        userData = (response as any).data;
      } else if (Array.isArray(response)) {
        userData = response;
      }

      // Handle empty array - might be a new user not yet synced to backend
      if (!userData || !Array.isArray(userData) || userData.length === 0) {
        if (retryForNewUser && attempt < maxRetries) {
          const delay = (attempt + 1) * 1000; // 1s, 2s, 3s
          console.log(`Auth: No user data found, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptFetch(attempt + 1);
        }
        console.log('Auth: No user data found after retries, returning null');
        return null;
      }

      return userData[0];
    } catch (error) {
      console.error('Auth: Failed to get current user:', error);
      if (retryForNewUser && attempt < maxRetries) {
        const delay = (attempt + 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptFetch(attempt + 1);
      }
      return null;
    }
  };

  return attemptFetch(0);
},
```

**Update `useVerifyCode` to use retry:**

```typescript
// lib/hooks/use-auth.ts - in useVerifyCode onSuccess
const userData = await authService.getCurrentUser({
    retryForNewUser: true,
    maxRetries: 3,
});
```

#### Files to Modify

- `lib/services/auth.ts`
- `lib/hooks/use-auth.ts`

#### Testing Checklist

- [ ] New user sign-up completes successfully
- [ ] Existing user login still works
- [ ] Retry logic triggers when backend returns empty array
- [ ] Retry stops after maxRetries
- [ ] User is redirected to onboarding after successful verification

---

### Scenario 3: Onboarding Profile Update Failure (Silent Fail)

#### Problem Description

When `updateUserProfile.mutateAsync()` fails during onboarding completion, the user gets a generic toast error but has no recovery path. They're stuck on the onboarding page.

#### Root Cause

```typescript
// components/onboarding/index.tsx:225-228
} catch (error) {
  console.error('Error updating user:', error);
  toast.error('There was a problem completing your profile setup.');  // ← Generic, no recovery
}
```

#### Common Failure Scenarios

- Username taken (stale availability check)
- Network timeout
- Backend validation errors
- Rate limiting

#### Proposed Fix - Option A: Detailed Error Messages + Retry Button

```typescript
// components/onboarding/index.tsx - Enhanced error handling

} catch (error: any) {
  console.error('Error updating user:', error);
  setUpdating(false);

  // Parse specific error types
  const errorMessage = error?.message?.toLowerCase() || '';
  const statusCode = error?.status;

  // Username conflict
  if (
    errorMessage.includes('username') ||
    errorMessage.includes('already taken') ||
    errorMessage.includes('duplicate') ||
    errorMessage.includes('unique constraint')
  ) {
    toast.error('This username is no longer available. Please go back and choose a different one.');
    setStep(2); // Go back to username step
    return;
  }

  // Network/timeout issues
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('network') ||
    error?.code === 'ECONNABORTED' ||
    errorMessage.includes('econnaborted')
  ) {
    toast.error('Connection issue. Please check your internet and try again.', {
      action: {
        label: 'Retry',
        onClick: () => updateUserFn({ name, username, image: uploadedImg }),
      },
      duration: 10000,
    });
    return;
  }

  // Validation errors
  if (errorMessage.includes('validation') || statusCode === 400) {
    toast.error('Please check your information and try again. Name and username are required.');
    return;
  }

  // Rate limiting
  if (statusCode === 429) {
    toast.error('Too many requests. Please wait a moment and try again.', {
      duration: 10000,
    });
    return;
  }

  // Generic fallback with retry
  toast.error('Something went wrong. Please try again.', {
    action: {
      label: 'Retry',
      onClick: () => updateUserFn({ name, username, image: uploadedImg }),
    },
    duration: 8000,
  });
}
```

#### Proposed Fix - Option B: Inline Error UI with Recovery Options

```typescript
// Add state for error recovery
const [submitError, setSubmitError] = useState<{
  message: string;
  canRetry: boolean;
  goBackToStep?: number;
} | null>(null);

// In catch block
if (errorMessage.includes('username')) {
  setSubmitError({
    message: 'This username is no longer available.',
    canRetry: false,
    goBackToStep: 2,
  });
} else {
  setSubmitError({
    message: 'Something went wrong. Please try again.',
    canRetry: true,
  });
}

// In render, show error state with recovery options
{submitError && (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
    <p className="text-red-700 text-sm mb-3">{submitError.message}</p>
    <div className="flex gap-2">
      {submitError.canRetry && (
        <Button
          size="sm"
          onClick={() => {
            setSubmitError(null);
            updateUserFn({ name, username, image: uploadedImg });
          }}
        >
          Try Again
        </Button>
      )}
      {submitError.goBackToStep && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSubmitError(null);
            setStep(submitError.goBackToStep!);
          }}
        >
          Change Username
        </Button>
      )}
    </div>
  </div>
)}
```

#### Proposed Fix - Option C: Final Username Re-validation Before Submit

```typescript
// Before updateUserProfile.mutateAsync, verify username is still available
const verifyUsernameAvailable = async (): Promise<boolean> => {
    if (username === user?.username) return true; // Own username is fine

    try {
        const response = await apiClient.get(
            `/v1/user/details?username=${encodeURIComponent(username)}`
        );
        // If we get a user back with a different ID, username is taken
        if (response?.data?.id && response.data.id !== user?.id) {
            return false;
        }
        return true;
    } catch (error) {
        // 404 means username doesn't exist = available
        if ((error as any)?.status === 404) return true;
        // Other errors, assume available and let backend validate
        return true;
    }
};

// In updateUserFn, step 6:
if (step === 6) {
    setUpdating(true);

    // Final username check
    const isUsernameAvailable = await verifyUsernameAvailable();
    if (!isUsernameAvailable) {
        setUpdating(false);
        toast.error('This username was just taken. Please choose another.');
        setStep(2);
        return;
    }

    // Proceed with update...
}
```

#### Recommendation

Use **Option A + Option C** together:

- Option A provides good error feedback for all error types
- Option C prevents the most common failure (username conflict)

#### Files to Modify

- `components/onboarding/index.tsx`

#### Testing Checklist

- [ ] Username conflict shows specific error and returns to step 2
- [ ] Network timeout shows retry button
- [ ] Validation errors show helpful message
- [ ] Generic errors show retry option
- [ ] Final username check catches last-second conflicts

---

### Scenario 5: Username Availability Race Condition

#### Problem Description

The debounce is 500ms, but user can click "Next" before the latest check completes. The `canProceed` check might use stale `isAvailable` state from a previous username.

#### Root Cause

```typescript
// onboarding-username.tsx:85
const canProceed = username.length >= 3 && !validationError && isAvailable === true;
// ↑ isAvailable might be for the PREVIOUS username if user typed fast
```

**Example scenario:**

1. User types "john" - availability check starts
2. User quickly adds "123" to get "john123"
3. User clicks "Next" immediately
4. `isAvailable` still reflects check for "john" (which might be taken)
5. User sees confusing "taken" error for wrong username

#### Proposed Fix

Track the last-checked username and only allow progression if current username matches:

```typescript
// onboarding-username.tsx - Enhanced with submission validation

export const OnboardingUsername = ({
  username,
  updating,
  onUsernameChange,
  onEnterPress,
}: OnboardingUsernameProps) => {
  const [validationError, setValidationError] = useState<string>('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [lastCheckedUsername, setLastCheckedUsername] = useState<string>(''); // NEW: Track what we checked

  const { user: currentUser } = useUserProfile();
  const debouncedUsername = useDebounce(username, 500);
  const { data: existingUser, isLoading, refetch } = useUserByUsername(debouncedUsername);

  // Validate username format on change
  useEffect(() => {
    if (!username) {
      setValidationError('');
      setIsAvailable(null);
      setLastCheckedUsername('');
      return;
    }

    const usernameSchema = updateUserProfileSchema.pick({ username: true }).shape.username;

    try {
      usernameSchema.parse(username);
      setValidationError('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.issues?.[0]?.message || 'Invalid username');
        setIsAvailable(null);
        setLastCheckedUsername('');
      }
    }
  }, [username]);

  // Check availability when debounced username changes
  useEffect(() => {
    if (!debouncedUsername || validationError) {
      setIsCheckingAvailability(false);
      setIsAvailable(null);
      setLastCheckedUsername('');
      return;
    }

    // If it's the current user's username, it's available for them
    if (currentUser?.username === debouncedUsername) {
      setIsAvailable(true);
      setLastCheckedUsername(debouncedUsername);
      return;
    }

    // Only check if validation passes
    if (debouncedUsername.length >= 3) {
      setIsCheckingAvailability(true);
      refetch().then(({ data: freshData }) => {
        setIsCheckingAvailability(false);
        const available = !freshData?.id;
        setIsAvailable(available);
        setLastCheckedUsername(debouncedUsername); // Record what we checked
      }).catch(() => {
        setIsCheckingAvailability(false);
        // On error, allow proceeding (backend will validate)
        setIsAvailable(true);
        setLastCheckedUsername(debouncedUsername);
      });
    }
  }, [debouncedUsername, validationError, refetch, currentUser]);

  // UPDATED: Can only proceed if:
  // 1. Username is valid length
  // 2. No validation errors
  // 3. Not currently checking availability
  // 4. The CURRENT username matches what was last checked
  // 5. And it was available
  const canProceed =
    username.length >= 3 &&
    !validationError &&
    !isCheckingAvailability &&
    !isLoading &&
    username === lastCheckedUsername &&  // KEY: ensure we checked THIS username
    isAvailable === true;

  // Enhanced enter handler that validates before proceeding
  const handleEnterWithValidation = async () => {
    if (!canProceed) return;

    // Double-check availability right before proceeding (belt and suspenders)
    if (username !== currentUser?.username) {
      setIsCheckingAvailability(true);
      try {
        const { data: finalCheck } = await refetch();
        setIsCheckingAvailability(false);
        if (finalCheck?.id) {
          setIsAvailable(false);
          toast.error('This username was just taken. Please choose another.');
          return;
        }
      } catch {
        setIsCheckingAvailability(false);
        // On error, proceed and let backend validate
      }
    }

    onEnterPress();
  };

  const showValidation = username.length > 0;

  // Also show checking state if username doesn't match last checked
  const isEffectivelyChecking = isCheckingAvailability || isLoading ||
    (username.length >= 3 && !validationError && username !== lastCheckedUsername);

  return (
    <motion.div
      key='username'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <OnboardingHeader
        title='Choose a username'
        description='This will be your unique Evento identifier.'
      />

      <div className='mt-6'>
        <div className='relative'>
          <Input
            required
            autoFocus
            value={username}
            disabled={updating}
            placeholder='shakespeare123'
            onChange={onUsernameChange}
            className={`mb-2 min-h-[60px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pr-12 text-2xl placeholder:text-gray-300 md:text-2xl ${validationError && showValidation ? 'border-red-500' : ''} ${canProceed ? 'border-green-500' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canProceed) handleEnterWithValidation();
            }}
          />

          {/* Status indicator */}
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            {isEffectivelyChecking ? (
              <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
            ) : isAvailable === true && !validationError && showValidation && username === lastCheckedUsername ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : isAvailable === false && showValidation ? (
              <XCircle className='h-5 w-5 text-red-500' />
            ) : null}
          </div>
        </div>

        {/* Validation messages */}
        {showValidation && (
          <div className='mt-1 text-sm'>
            {validationError ? (
              <p className='text-red-500'>{validationError}</p>
            ) : isAvailable === false && username === lastCheckedUsername ? (
              <p className='text-red-500'>This username is already taken</p>
            ) : isAvailable === true && username === lastCheckedUsername ? (
              <p className='text-green-500'>Great! This username is available</p>
            ) : isEffectivelyChecking ? (
              <p className='text-gray-500'>Checking availability...</p>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
};
```

#### Files to Modify

- `components/onboarding/onboarding-username.tsx`

#### Testing Checklist

- [ ] Fast typing doesn't allow proceeding with stale availability check
- [ ] "Checking availability..." shows while async check is in progress
- [ ] Green checkmark only shows when current username is confirmed available
- [ ] Double-check on Enter/Next prevents race condition
- [ ] Own username (for returning users) is always allowed

---

### Scenario 8: Flickering/Skeleton Loading During Auth Flow

#### Problem Description

Users see flickering/flashing between loading states and content during the auth flow. The skeleton loader appears, disappears, and reappears multiple times before the final content shows.

#### Root Cause

Multiple async checks happen in sequence, each causing independent re-renders:

1. `useBetaAccess()` → `isLoading: true` → shows spinner
2. `useRequireAuth()` → `isLoading: true` → shows spinner
3. `useRequireOnboarding()` → `isLoading: true` → shows spinner
4. Zustand store rehydrates → brief state changes
5. React Query fetches → more state changes

Each resolves at different times, causing the visual flicker.

**Current problematic pattern:**

```typescript
// app/e/hub/page.tsx
const { isLoading: isCheckingAuth } = useRequireAuth();
const { isLoading: isCheckingOnboarding } = useRequireOnboarding();

if (isCheckingAuth || isCheckingOnboarding) {
  return <Skeleton />; // Shows, hides, shows again...
}
```

#### Proposed Fix - Option A: Unified Auth Provider (Recommended)

Create a single source of truth that completes ALL auth checks before rendering:

```typescript
// lib/providers/auth-provider.tsx - NEW FILE
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authService } from '@/lib/services/auth';
import { useBetaAccessStore } from '@/lib/stores/beta-access-store';
import { isUserOnboarded } from '@/lib/utils/auth';
import { UserDetails } from '@/lib/types/api';

interface AuthContextType {
  isReady: boolean;           // True when ALL checks are complete
  isAuthenticated: boolean;
  isOnboarded: boolean;
  hasBetaAccess: boolean;
  user: UserDetails | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isReady: false,
  isAuthenticated: false,
  isOnboarded: false,
  hasBetaAccess: false,
  user: null,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const { user, setUser, clearAuth } = useAuthStore();
  const { hasAccess: hasBetaAccess, initialize: initBeta } = useBetaAccessStore();

  const initializeAuth = useCallback(async () => {
    try {
      // 1. Initialize beta access (sync - from localStorage)
      initBeta();

      // 2. Check if we have a valid session and get user data
      const userData = await authService.getCurrentUser();

      if (userData) {
        setUser(userData);
      } else {
        // No valid session, clear any stale data
        clearAuth();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuth();
    } finally {
      // 3. Mark as ready - all checks complete
      setIsReady(true);
    }
  }, [initBeta, setUser, clearAuth]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const refreshAuth = useCallback(async () => {
    setIsReady(false);
    await initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextType = {
    isReady,
    isAuthenticated: !!user,
    isOnboarded: isUserOnboarded(user),
    hasBetaAccess: hasBetaAccess === true,
    user,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
```

**Update app/providers.tsx:**

```typescript
// app/providers.tsx
'use client';

import { Sidebar } from '@/components/sidebar';
import { queryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/lib/providers/auth-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Sidebar />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Update pages to use unified context:**

```typescript
// app/e/hub/page.tsx - SIMPLIFIED, NO FLICKER
'use client';

import { useAuthContext } from '@/lib/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HubPage() {
  const router = useRouter();
  const { isReady, isAuthenticated, isOnboarded, hasBetaAccess } = useAuthContext();

  useEffect(() => {
    if (!isReady) return; // Wait for auth to be ready

    if (!hasBetaAccess) {
      router.push('/');
      return;
    }

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/e/hub');
      return;
    }

    if (!isOnboarded) {
      router.push('/onboarding?redirect=/e/hub');
      return;
    }
  }, [isReady, hasBetaAccess, isAuthenticated, isOnboarded, router]);

  // Single loading state - no flicker
  if (!isReady || !hasBetaAccess || !isAuthenticated || !isOnboarded) {
    return <HubSkeleton />;
  }

  return <HubContent />;
}
```

#### Proposed Fix - Option B: Minimum Loading Duration (Simpler)

Prevent flash by ensuring loading state shows for at least a minimum duration:

```typescript
// lib/hooks/use-stable-loading.ts - NEW FILE
import { useState, useEffect, useRef } from 'react';

/**
 * Returns a stable loading state that won't flicker.
 * Once loading starts, it stays true for at least minDuration ms.
 */
export function useStableLoading(isLoading: boolean, minDuration = 400): boolean {
  const [stableLoading, setStableLoading] = useState(true);
  const loadingStartRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isLoading) {
      // Loading started
      loadingStartRef.current = Date.now();
      setStableLoading(true);

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Loading finished - ensure minimum duration
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      timeoutRef.current = setTimeout(() => {
        setStableLoading(false);
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDuration]);

  return stableLoading;
}

// Usage in components:
const { isLoading } = useRequireAuth();
const stableLoading = useStableLoading(isLoading, 500);

if (stableLoading) {
  return <Skeleton />;
}
```

#### Proposed Fix - Option C: Optimistic Rendering from Persisted Store

Trust the persisted Zustand state and only show loading if we have NO data:

```typescript
// Modified useAuth pattern
export function useAuth() {
    const { user, isAuthenticated } = useAuthStore(); // From persisted store
    const { isLoading: isFetching } = useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: authService.getCurrentUser,
        // ... other options
    });

    // Key insight: If we have persisted user data, show content immediately
    // Only show skeleton if we have NO persisted data AND are still fetching
    const showLoading = !user && isFetching;

    return {
        user,
        isAuthenticated,
        isLoading: showLoading, // Changed logic
        // ...
    };
}
```

#### Recommendation

Use **Option A (AuthProvider)** for a comprehensive fix that:

- Eliminates ALL flickering
- Provides a single source of truth
- Makes auth state management cleaner across the app
- Easier to reason about and debug

#### Files to Modify/Create

- `lib/providers/auth-provider.tsx` (new)
- `app/providers.tsx`
- All pages under `app/e/` that use auth hooks
- `app/onboarding/page.tsx`

#### Testing Checklist

- [ ] No flickering on initial page load
- [ ] No flickering when navigating between pages
- [ ] Loading skeleton shows once, then content appears
- [ ] Auth state is consistent across all pages
- [ ] Redirects happen smoothly without flash

---

### API Timeout Issues

#### Problem Description

The axios client has a 10-second timeout. For users on slow connections or when the backend is under load, this causes silent failures with poor error messaging.

#### Current Configuration

```typescript
// lib/api/client.ts:30
timeout: 10000, // 10 second timeout
```

#### Proposed Fixes

##### Fix 1: Increase Default Timeout

```typescript
// lib/api/client.ts
export const apiClient = axios.create({
    baseURL: Env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000, // Increase to 20 seconds
});
```

##### Fix 2: Per-Request Timeout for Critical Operations

```typescript
// For auth operations that might take longer
const response = await apiClient.post('/v1/user', data, {
    timeout: 30000, // 30 seconds for profile updates
});

// For image uploads
const response = await apiClient.post('/v1/user/details/image-upload', formData, {
    timeout: 60000, // 60 seconds for uploads
});
```

##### Fix 3: Enhanced Error Handling with Retry UI

```typescript
// lib/utils/api-error-handler.ts - NEW FILE

import { toast } from '@/lib/utils/toast';

interface ApiErrorHandlerOptions {
    onRetry?: () => void;
    context?: string; // e.g., "saving your profile"
}

export function handleApiError(error: any, options?: ApiErrorHandlerOptions) {
    const { onRetry, context = 'completing this action' } = options || {};

    // Timeout error
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        toast.error(`Request timed out while ${context}. Please check your connection.`, {
            action: onRetry
                ? {
                      label: 'Retry',
                      onClick: onRetry,
                  }
                : undefined,
            duration: 10000,
        });
        return;
    }

    // Network error (no response)
    if (!error?.response && error?.message?.includes('Network Error')) {
        toast.error('Unable to connect. Please check your internet connection.', {
            action: onRetry
                ? {
                      label: 'Retry',
                      onClick: onRetry,
                  }
                : undefined,
            duration: 10000,
        });
        return;
    }

    // Server errors
    if (error?.status >= 500) {
        toast.error('Our servers are having trouble. Please try again in a moment.', {
            action: onRetry
                ? {
                      label: 'Retry',
                      onClick: onRetry,
                  }
                : undefined,
        });
        return;
    }

    // Default error
    toast.error(error?.message || 'Something went wrong. Please try again.');
}

// Usage:
try {
    await apiClient.post('/v1/user', data);
} catch (error) {
    handleApiError(error, {
        context: 'saving your profile',
        onRetry: () => saveProfile(data),
    });
}
```

##### Fix 4: Visual Feedback for Slow Requests

```typescript
// lib/hooks/use-slow-request-indicator.ts - NEW FILE

import { useState, useEffect } from 'react';

/**
 * Shows a "taking longer than expected" state after a delay
 */
export function useSlowRequestIndicator(isLoading: boolean, delayMs = 5000) {
  const [isSlowRequest, setIsSlowRequest] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsSlowRequest(true), delayMs);
      return () => clearTimeout(timer);
    }
    setIsSlowRequest(false);
  }, [isLoading, delayMs]);

  return isSlowRequest;
}

// Usage in component:
const { mutate, isPending } = useUpdateProfile();
const isSlowRequest = useSlowRequestIndicator(isPending);

return (
  <div>
    {isPending && (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>
          {isSlowRequest
            ? 'This is taking longer than expected...'
            : 'Saving...'}
        </span>
      </div>
    )}
  </div>
);
```

#### Files to Modify/Create

- `lib/api/client.ts`
- `lib/utils/api-error-handler.ts` (new)
- `lib/hooks/use-slow-request-indicator.ts` (new)
- Components that make API calls

#### Testing Checklist

- [ ] Requests don't fail prematurely on slow connections
- [ ] Timeout errors show user-friendly message with retry option
- [ ] Network errors are handled gracefully
- [ ] Slow requests show "taking longer" message after 5 seconds
- [ ] Image uploads have sufficient timeout (60s)

---

## Implementation Priority

| Priority | Issue                               | Effort | Impact                            |
| -------- | ----------------------------------- | ------ | --------------------------------- |
| 1        | Scenario 8: Flickering              | High   | High - Most visible UX issue      |
| 2        | Scenario 1: Empty user array        | Medium | High - Causes sign-up failures    |
| 3        | Scenario 3: Onboarding silent fail  | Medium | High - Users get stuck            |
| 4        | Scenario 5: Username race condition | Medium | Medium - Confusing UX             |
| 5        | API Timeout                         | Low    | Medium - Affects slow connections |

### Recommended Implementation Order

1. **Phase 1 (Critical):**
    - Scenario 8: AuthProvider (eliminates flickering)
    - Scenario 1: Retry logic for new users

2. **Phase 2 (Important):**
    - Scenario 3: Enhanced error handling in onboarding
    - API Timeout: Increase timeout + better error messages

3. **Phase 3 (Polish):**
    - Scenario 5: Username availability race condition fix

---

## Files Reference

### Core Auth Files

| File                              | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `lib/services/auth.ts`            | Auth service (Supabase integration)                   |
| `lib/hooks/use-auth.ts`           | Auth hooks (useAuth, useLogin, useVerifyCode, etc.)   |
| `lib/stores/auth-store.ts`        | Zustand auth state store                              |
| `lib/stores/beta-access-store.ts` | Beta access state store                               |
| `lib/utils/auth.ts`               | Auth utilities (isUserOnboarded, validateRedirectUrl) |
| `lib/api/client.ts`               | Axios API client                                      |

### Auth Pages

| File                         | Purpose                 |
| ---------------------------- | ----------------------- |
| `app/auth/login/page.tsx`    | Email login page        |
| `app/auth/verify/page.tsx`   | OTP verification page   |
| `app/auth/callback/page.tsx` | OAuth callback handler  |
| `app/onboarding/page.tsx`    | Onboarding flow wrapper |

### Onboarding Components

| File                                            | Purpose                        |
| ----------------------------------------------- | ------------------------------ |
| `components/onboarding/index.tsx`               | Main onboarding flow (6 steps) |
| `components/onboarding/onboarding-username.tsx` | Username selection step        |
| `components/onboarding/onboarding-name.tsx`     | Name input step                |
| `components/onboarding/onboarding-avatar.tsx`   | Avatar upload step             |

### Protected Pages (need auth)

| File                     | Purpose              |
| ------------------------ | -------------------- |
| `app/e/layout.tsx`       | Protected app layout |
| `app/e/hub/page.tsx`     | Home hub             |
| `app/e/feed/page.tsx`    | Events feed          |
| `app/e/profile/page.tsx` | User profile         |

---

## Questions for Implementation

1. **For Scenario 8 (flickering):** Should we implement the full AuthProvider approach, or start with the simpler minimum-duration fix?

2. **For Scenario 3 (onboarding):** Prefer toast-based errors (Option A) or inline error UI (Option B)?

3. **Backend coordination needed?** Some fixes (like Scenario 1) might benefit from backend changes too. Do we have access to modify the backend?

4. **Testing environment:** Do we have a way to simulate slow connections for testing timeout handling?

---

_Document created from codebase analysis. All proposed fixes are based on the current implementation and may need adjustment based on additional context or requirements._
