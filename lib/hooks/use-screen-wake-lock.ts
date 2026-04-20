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
  const requestWakeLockRef = useRef<(() => Promise<void | undefined>) | null>(null);
  const interactionRetryCleanupRef = useRef<(() => void) | null>(null);

  const clearInteractionRetry = useCallback(() => {
    interactionRetryCleanupRef.current?.();
    interactionRetryCleanupRef.current = null;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    clearInteractionRetry();

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
  }, [clearInteractionRetry]);

  const scheduleInteractionRetry = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (
      !enabledRef.current ||
      unmountedRef.current ||
      document.visibilityState !== 'visible' ||
      sentinelRef.current ||
      requestInFlightRef.current ||
      interactionRetryCleanupRef.current
    ) {
      return;
    }

    const retryOnInteraction = () => {
      clearInteractionRetry();
      void requestWakeLockRef.current?.();
    };

    const addOptions: AddEventListenerOptions = {
      once: true,
      passive: true,
    };

    document.addEventListener('touchstart', retryOnInteraction, addOptions);
    document.addEventListener('click', retryOnInteraction, addOptions);

    interactionRetryCleanupRef.current = () => {
      document.removeEventListener('touchstart', retryOnInteraction);
      document.removeEventListener('click', retryOnInteraction);
    };
  }, [clearInteractionRetry]);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!enabledRef.current || document.visibilityState !== 'visible') {
      return;
    }

    const wakeLockNavigator = navigator as NavigatorWithWakeLock;

    if (!wakeLockNavigator.wakeLock) {
      clearInteractionRetry();

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
      let shouldScheduleInteractionRetry = false;

      try {
        const sentinel = await wakeLockNavigator.wakeLock.request('screen');

        if (!enabledRef.current || unmountedRef.current) {
          await sentinel.release().catch(() => undefined);
          return;
        }

        clearInteractionRetry();
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
            scheduleInteractionRetry();
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
        shouldScheduleInteractionRetry = true;

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

        if (shouldScheduleInteractionRetry) {
          scheduleInteractionRetry();
        }
      }
    })();

    return requestInFlightRef.current;
  }, [clearInteractionRetry, scheduleInteractionRetry]);

  useEffect(() => {
    requestWakeLockRef.current = requestWakeLock;
  }, [requestWakeLock]);

  useEffect(() => {
    enabledRef.current = enabled;

    if (!enabled) {
      setState(INITIAL_STATE);
      clearInteractionRetry();
      void releaseWakeLock();
      return;
    }

    void requestWakeLock();
    scheduleInteractionRetry();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock();
        scheduleInteractionRetry();
        return;
      }

      clearInteractionRetry();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInteractionRetry();
      void releaseWakeLock();
    };
  }, [enabled, clearInteractionRetry, releaseWakeLock, requestWakeLock, scheduleInteractionRetry]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      clearInteractionRetry();
    };
  }, [clearInteractionRetry]);

  return state;
}
