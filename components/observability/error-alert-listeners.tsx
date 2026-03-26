'use client';

import { reportErrorAlert } from '@/lib/observability/error-alert-client';
import { useEffect, useRef } from 'react';

/**
 * Global browser crash listeners component.
 *
 * Registers window.onerror and window.onunhandledrejection listeners
 * to capture and report browser-level errors to the observability API.
 *
 * Features:
 * - Mounts exactly once (guards against double-subscription)
 * - Removes listeners on unmount
 * - Normalizes error/rejection data into API-compatible payloads
 * - Uses shared transport from error-alert-client.ts
 */
export function ErrorAlertListeners() {
  const mountedRef = useRef(false);

  useEffect(() => {
    // Guard against double-subscription in React StrictMode
    if (mountedRef.current) {
      return;
    }
    mountedRef.current = true;

    /**
     * Handle window.onerror events
     * Captures: runtime errors, syntax errors, uncaught exceptions
     */
    const handleError = (event: ErrorEvent): void => {
      // Suppress empty/errorless events
      if (!event.message && !event.error) {
        return;
      }

      // Extract message - prefer error.message, fallback to event.message
      const message = event.error?.message || event.message || 'Unknown browser error';

      // Extract stack - prefer error.stack
      const stack = event.error?.stack || undefined;

      // Get pathname only (no query strings)
      const path = window.location.pathname;

      reportErrorAlert({
        kind: 'browser-error',
        message,
        path,
        stack,
      });
    };

    /**
     * Handle unhandled promise rejections
     * Captures: uncaught async errors, rejected promises
     */
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason;

      // Suppress empty/errorless rejections
      if (reason === undefined || reason === null) {
        return;
      }

      // Convert reason to message
      let message: string;
      let stack: string | undefined;

      if (reason instanceof Error) {
        message = reason.message || 'Unhandled rejection';
        stack = reason.stack;
      } else if (typeof reason === 'string') {
        message = reason || 'Unhandled rejection';
      } else {
        // Convert non-Error, non-string reasons to a short string representation
        try {
          message = `Unhandled rejection: ${JSON.stringify(reason)}`.slice(0, 200);
        } catch {
          message = 'Unhandled rejection: [non-serializable]';
        }
      }

      // Get pathname only (no query strings)
      const path = window.location.pathname;

      reportErrorAlert({
        kind: 'unhandled-rejection',
        message,
        path,
        stack,
      });
    };

    // Register listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      mountedRef.current = false;
    };
  }, []);

  // This component has no UI - it only registers listeners
  return null;
}
