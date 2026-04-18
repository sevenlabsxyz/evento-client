import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockErrorReason = 'unsupported' | 'request-failed';

interface ScreenWakeLockSentinel {
  addEventListener(type: 'release', listener: () => void): void;
  release(): Promise<void>;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request(type: 'screen'): Promise<ScreenWakeLockSentinel>;
  };
};

interface UseScreenWakeLockOptions {
  enabled: boolean;
}

interface UseScreenWakeLockResult {
  active: boolean;
  supported: boolean | null;
  errorReason: WakeLockErrorReason | null;
  errorMessage: string | null;
}

const INITIAL_STATE: UseScreenWakeLockResult = {
  active: false,
  supported: null,
  errorReason: null,
  errorMessage: null,
};

export function useScreenWakeLock({ enabled }: UseScreenWakeLockOptions): UseScreenWakeLockResult {
  const [state, setState] = useState<UseScreenWakeLockResult>(INITIAL_STATE);
  const sentinelRef = useRef<ScreenWakeLockSentinel | null>(null);
  const requestInFlightRef = useRef<Promise<void> | null>(null);
  const enabledRef = useRef(enabled);
  const unmountedRef = useRef(false);

  const releaseWakeLock = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;

    if (!sentinel) {
      return;
    }

    try {
      await sentinel.release();
    } catch {
      // Browsers may release the lock before cleanup runs.
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!enabledRef.current || document.visibilityState !== 'visible') {
      return;
    }

    const wakeLockNavigator = navigator as NavigatorWithWakeLock;

    if (!wakeLockNavigator.wakeLock) {
      if (!unmountedRef.current) {
        setState({
          active: false,
          supported: false,
          errorReason: 'unsupported',
          errorMessage: null,
        });
      }
      return;
    }

    if (sentinelRef.current || requestInFlightRef.current) {
      return requestInFlightRef.current ?? undefined;
    }

    requestInFlightRef.current = (async () => {
      try {
        const sentinel = await wakeLockNavigator.wakeLock!.request('screen');

        if (!enabledRef.current || unmountedRef.current) {
          await sentinel.release().catch(() => undefined);
          return;
        }

        sentinelRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
          }

          if (unmountedRef.current) {
            return;
          }

          setState((current) => ({ ...current, active: false }));

          if (enabledRef.current && document.visibilityState === 'visible') {
            void requestWakeLock();
          }
        });

        if (!unmountedRef.current) {
          setState({
            active: true,
            supported: true,
            errorReason: null,
            errorMessage: null,
          });
        }
      } catch (error) {
        if (!unmountedRef.current) {
          setState({
            active: false,
            supported: true,
            errorReason: 'request-failed',
            errorMessage: error instanceof Error ? error.message : 'Failed to keep screen awake',
          });
        }
      } finally {
        requestInFlightRef.current = null;
      }
    })();

    return requestInFlightRef.current;
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;

    if (!enabled) {
      setState(INITIAL_STATE);
      void releaseWakeLock();
      return;
    }

    void requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void releaseWakeLock();
    };
  }, [enabled, releaseWakeLock, requestWakeLock]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  return state;
}
