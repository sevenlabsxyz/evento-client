/**
 * Error Alert Client Transport Module
 *
 * Fire-and-forget error reporter that sends to the observability API.
 * Features:
 * - Production gating (NEXT_PUBLIC_ERROR_ALERTS_ENABLED + NODE_ENV)
 * - Query string stripping for privacy
 * - Per-tab fingerprint-based deduplication (5-second window)
 * - sendBeacon primary with fetch keepalive fallback
 * - All transport errors swallowed
 */

import { Env } from '@/lib/constants/env';

/**
 * Error kinds supported by the API
 * Aligned with Task 1 API schema: browser-error | unhandled-rejection | client-http | api-http | api-exception
 */
export type ErrorKind =
  | 'browser-error'
  | 'unhandled-rejection'
  | 'client-http'
  | 'api-http'
  | 'api-exception';

/**
 * Strict payload schema aligned with API allowlist
 * Unknown fields are rejected by the API
 */
export interface ErrorAlertPayload {
  source: 'client';
  kind: ErrorKind;
  message: string;
  path: string;
  status?: number;
  method?: string;
  requestId?: string;
  stack?: string;
  componentStack?: string;
  userAgent?: string;
  occurredAt: string;
}

/**
 * Input for reporting an error (partial, will be normalized)
 */
export interface ErrorReportInput {
  kind: ErrorKind;
  message: string;
  path: string;
  status?: number;
  method?: string;
  requestId?: string;
  stack?: string;
  componentStack?: string;
}

// Per-tab deduplication state (module-level, tab-scoped)
const recentFingerprints = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5000;

/**
 * Check if we're in a production environment where alerts should fire
 */
function isProductionAlertsEnabled(): boolean {
  return Env.NODE_ENV === 'production' && Env.NEXT_PUBLIC_ERROR_ALERTS_ENABLED;
}

/**
 * Strip query strings from a URL for privacy
 */
function stripQueryStrings(path: string): string {
  try {
    const url = new URL(path, 'http://localhost');
    return url.pathname;
  } catch {
    // If URL parsing fails, manually strip query string
    const queryIndex = path.indexOf('?');
    return queryIndex > -1 ? path.slice(0, queryIndex) : path;
  }
}

/**
 * Build a fingerprint for deduplication
 * Format: kind|status|path|messageFirstLine
 */
function buildFingerprint(payload: ErrorAlertPayload): string {
  const messageFirstLine = payload.message.split('\n')[0].slice(0, 100);
  const pathWithoutQuery = stripQueryStrings(payload.path);
  return `${payload.kind}|${payload.status ?? ''}|${pathWithoutQuery}|${messageFirstLine}`;
}

/**
 * Check if this fingerprint was recently reported (per-tab deduplication)
 */
function isDuplicate(fingerprint: string): boolean {
  const now = Date.now();
  const lastSent = recentFingerprints.get(fingerprint);

  if (lastSent && now - lastSent < DEDUPE_WINDOW_MS) {
    return true;
  }

  // Record this send
  recentFingerprints.set(fingerprint, now);

  // Cleanup old entries periodically (simple approach: every 100 entries)
  if (recentFingerprints.size > 100) {
    const cutoff = now - DEDUPE_WINDOW_MS;
    for (const [key, timestamp] of recentFingerprints.entries()) {
      if (timestamp < cutoff) {
        recentFingerprints.delete(key);
      }
    }
  }

  return false;
}

/**
 * Normalize input into a valid API payload
 */
function normalizePayload(input: ErrorReportInput): ErrorAlertPayload {
  return {
    source: 'client',
    kind: input.kind,
    message: input.message,
    path: input.path,
    ...(input.status !== undefined && { status: input.status }),
    ...(input.method !== undefined && { method: input.method }),
    ...(input.requestId !== undefined && { requestId: input.requestId }),
    ...(input.stack !== undefined && { stack: input.stack }),
    ...(input.componentStack !== undefined && { componentStack: input.componentStack }),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    occurredAt: new Date().toISOString(),
  };
}

/**
 * Send the error alert using sendBeacon (preferred) or fetch fallback
 * All errors are swallowed to avoid disrupting UX
 */
async function sendAlert(payload: ErrorAlertPayload): Promise<void> {
  const url = `${Env.NEXT_PUBLIC_API_URL}/v1/observability/errors`;
  const json = JSON.stringify(payload);

  try {
    // Primary: sendBeacon with Blob for proper content-type
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([json], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) {
        return;
      }
      // If sendBeacon returns false, fall through to fetch
    }

    // Fallback: fetch with keepalive
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: json,
      keepalive: true,
      mode: 'cors',
    });
  } catch {
    // Swallow all transport errors - error reporting should never break UX
  }
}

/**
 * Report an error to the observability API
 * Transport order:
 * 1. Normalize input to API payload
 * 2. Production gate check
 * 3. Strip query strings from path
 * 4. Build fingerprint
 * 5. 5-second duplicate suppression
 * 6. sendBeacon (primary)
 * 7. fetch keepalive fallback
 * 8. Swallow errors
 *
 * @param input - Error details to report
 * @returns void (fire-and-forget)
 */
export function reportErrorAlert(input: ErrorReportInput): void {
  // Step 1: Normalize
  const payload = normalizePayload(input);

  // Step 2: Production gate
  if (!isProductionAlertsEnabled()) {
    return;
  }

  // Step 3: Strip query strings (already done in fingerprint, but ensure path is clean)
  payload.path = stripQueryStrings(payload.path);

  // Step 4 & 5: Build fingerprint and check deduplication
  const fingerprint = buildFingerprint(payload);
  if (isDuplicate(fingerprint)) {
    return;
  }

  // Step 6 & 7: Send (errors swallowed internally)
  // Fire-and-forget: don't await
  sendAlert(payload);
}

/**
 * Check if error alerts are enabled (useful for UI/debugging)
 */
export function isErrorAlertingEnabled(): boolean {
  return isProductionAlertsEnabled();
}

/**
 * Clear the deduplication cache (useful for testing)
 */
export function clearErrorAlertCache(): void {
  recentFingerprints.clear();
}

/**
 * Get the current deduplication cache size (useful for testing/monitoring)
 */
export function getErrorAlertCacheSize(): number {
  return recentFingerprints.size;
}
