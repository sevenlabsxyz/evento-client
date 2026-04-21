/**
 * WebAuthn PRF (Pseudo-Random Function) capabilities detection
 * 
 * PRF extension allows deriving deterministic keys from passkeys,
 * which is essential for wallet recovery without storing additional secrets.
 * 
 * Browser Support Matrix:
 * - Chrome 130+: Full PRF support
 * - Safari 18.2+ (macOS): Full PRF support
 * - Safari 18.2+ (iOS): Platform authenticator only (no YubiKey PRF)
 * - Firefox 139+: PRF support (added in 2025)
 * - Windows Hello: No PRF support (Microsoft limitation)
 * - Android: Chrome with security key support
 */

import { logger } from '@/lib/utils/logger';

const DEBUG_WEBAUTHN = false;

/**
 * Result of PRF support detection
 */
export interface PRFSupportResult {
  /** Whether PRF is supported in this browser */
  supported: boolean;
  /** Human-readable reason if not supported */
  reason?: string;
  /** Technical details for debugging */
  details?: PRFSupportDetails;
}

/**
 * Detailed information about PRF support status
 */
export interface PRFSupportDetails {
  /** Whether WebAuthn is available at all */
  webauthnAvailable: boolean;
  /** Whether PublicKeyCredential is supported */
  publicKeyCredentialSupported: boolean;
  /** Whether PRF extension is supported */
  prfExtensionSupported: boolean;
  /** Browser name and version */
  browser: BrowserInfo;
  /** Whether platform authenticator is available */
  platformAuthenticatorAvailable: boolean;
  /** Whether user verification is supported */
  userVerificationSupported: boolean;
  /** Detected limitations */
  limitations: PRFLimitation[];
}

/**
 * Browser identification info
 */
interface BrowserInfo {
  name: string;
  version: number;
  fullVersion: string;
  isMobile: boolean;
  os: string;
}

/**
 * Known PRF limitations
 */
type PRFLimitation =
  | 'windows-hello-no-prf'
  | 'firefox-version-too-old'
  | 'ios-safari-platform-only'
  | 'chrome-version-too-old'
  | 'safari-version-too-old'
  | 'no-platform-authenticator'
  | 'webauthn-not-available'
  | 'prf-extension-not-supported';

// Minimum browser versions for PRF support
const MIN_CHROME_VERSION = 130;
const MIN_FIREFOX_VERSION = 139;
const MIN_SAFARI_VERSION = 18.2;

/**
 * Check if PRF (Pseudo-Random Function) extension is supported
 * Uses feature detection without making actual WebAuthn calls
 */
export async function checkPRFSupport(): Promise<PRFSupportResult> {
  const details = await detectCapabilities();
  const limitations = details.limitations;

  if (DEBUG_WEBAUTHN) {
    logger.debug('WebAuthn PRF capability check', { details, limitations });
  }

  // If there are critical limitations, PRF is not supported
  if (limitations.length > 0) {
    const criticalLimitations = limitations.filter(isCriticalLimitation);
    if (criticalLimitations.length > 0) {
      return {
        supported: false,
        reason: getLimitationReason(criticalLimitations[0], details.browser),
        details,
      };
    }
  }

  // Check all required capabilities
  if (!details.webauthnAvailable) {
    return {
      supported: false,
      reason: 'WebAuthn is not available in this browser',
      details,
    };
  }

  if (!details.prfExtensionSupported) {
    return {
      supported: false,
      reason: 'PRF extension is not supported in this browser version',
      details,
    };
  }

  // All checks passed
  return {
    supported: true,
    details,
  };
}

/**
 * Detect all WebAuthn and PRF capabilities
 * Uses feature detection only - no actual WebAuthn calls
 */
async function detectCapabilities(): Promise<PRFSupportDetails> {
  const browser = detectBrowser();
  const limitations: PRFLimitation[] = [];

  // Check basic WebAuthn availability
  const webauthnAvailable = typeof window !== 'undefined' && 
    'PublicKeyCredential' in window;
  
  const publicKeyCredentialSupported = webauthnAvailable && 
    typeof window.PublicKeyCredential === 'function';

  // Check PRF extension support via feature detection
  // PRF is supported if the browser supports the extension in credential creation options
  let prfExtensionSupported = false;
  let platformAuthenticatorAvailable = false;
  let userVerificationSupported = false;

  if (publicKeyCredentialSupported) {
    // Check if PRF extension is supported by examining PublicKeyCredential
    // The PRF extension adds 'prf' to the AuthenticatorExtensions
    prfExtensionSupported = checkPRFExtensionSupport();

    // Check platform authenticator availability
    try {
      platformAuthenticatorAvailable = await window.PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false;
    } catch {
      platformAuthenticatorAvailable = false;
    }

    // Check user verification support via feature detection
    userVerificationSupported = checkUserVerificationSupport();
  }

  // Apply browser-specific limitation checks
  if (webauthnAvailable) {
    checkBrowserLimitations(browser, limitations, {
      platformAuthenticatorAvailable,
      prfExtensionSupported,
    });
  } else {
    limitations.push('webauthn-not-available');
  }

  if (!prfExtensionSupported && !limitations.includes('prf-extension-not-supported')) {
    limitations.push('prf-extension-not-supported');
  }

  return {
    webauthnAvailable,
    publicKeyCredentialSupported,
    prfExtensionSupported,
    browser,
    platformAuthenticatorAvailable,
    userVerificationSupported,
    limitations,
  };
}

/**
 * Check if PRF extension is supported via feature detection
 * PRF extension adds support for pseudo-random function outputs
 */
function checkPRFExtensionSupport(): boolean {
  try {
    // PRF extension is detected by checking if the browser supports
    // the 'prf' extension in credential creation options
    // We check for the presence of PRF-related properties
    
    // Method 1: Check if AuthenticatorAttestationResponse has PRF-related features
    // This is a feature detection approach that doesn't require actual WebAuthn calls
    
    // Method 2: Check for PRF in the WebAuthn extensions support
    // Modern browsers that support PRF will have this capability detectable
    
    // The most reliable feature detection is to check browser version
    // combined with known support patterns
    const browser = detectBrowser();
    
    // Chrome 130+ supports PRF
    if (browser.name === 'chrome' && browser.version >= MIN_CHROME_VERSION) {
      return true;
    }
    
    // Firefox 139+ supports PRF
    if (browser.name === 'firefox' && browser.version >= MIN_FIREFOX_VERSION) {
      return true;
    }
    
    // Safari 18.2+ supports PRF
    if (browser.name === 'safari' && browser.version >= MIN_SAFARI_VERSION) {
      return true;
    }
    
    // Edge follows Chrome versioning
    if (browser.name === 'edge' && browser.version >= MIN_CHROME_VERSION) {
      return true;
    }
    
    // For other browsers, we need to be conservative
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if user verification is supported
 */
function checkUserVerificationSupport(): boolean {
  try {
    // User verification is supported if the browser supports
    // userVerification in authenticator selection
    return typeof window !== 'undefined' && 
      'PublicKeyCredential' in window &&
      typeof window.PublicKeyCredential === 'function';
  } catch {
    return false;
  }
}

/**
 * Detect browser name and version from user agent
 */
function detectBrowser(): BrowserInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
  
  let name = 'unknown';
  let version = 0;
  let fullVersion = 'unknown';
  let os = 'unknown';
  let isMobile = false;

  // Detect OS
  if (/iPhone|iPad|iPod/.test(ua)) {
    os = 'ios';
    isMobile = true;
  } else if (/Android/.test(ua)) {
    os = 'android';
    isMobile = true;
  } else if (/Windows/.test(ua)) {
    os = 'windows';
  } else if (/Mac/.test(platform)) {
    os = 'macos';
  } else if (/Linux/.test(platform)) {
    os = 'linux';
  }

  // Detect browser
  // Chrome (must check before Safari as Chrome on iOS has both)
  const chromeMatch = ua.match(/Chrome\/(\d+)\.(\d+)/);
  const edgeMatch = ua.match(/Edg\/(\d+)\.(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)\.(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+)\.(\d+).*Safari/);
  
  if (edgeMatch) {
    name = 'edge';
    version = parseInt(edgeMatch[1], 10);
    fullVersion = edgeMatch[0].replace('Edg/', '');
  } else if (chromeMatch && !/Edg/.test(ua)) {
    name = 'chrome';
    version = parseInt(chromeMatch[1], 10);
    fullVersion = chromeMatch[0].replace('Chrome/', '');
  } else if (firefoxMatch) {
    name = 'firefox';
    version = parseInt(firefoxMatch[1], 10);
    fullVersion = firefoxMatch[0].replace('Firefox/', '');
  } else if (safariMatch && !/Chrome/.test(ua)) {
    name = 'safari';
    version = parseFloat(`${safariMatch[1]}.${safariMatch[2]}`);
    fullVersion = safariMatch[0].replace('Version/', '').replace(' Safari', '');
  }

  return { name, version, fullVersion, isMobile, os };
}

/**
 * Check browser-specific limitations
 */
function checkBrowserLimitations(
  browser: BrowserInfo,
  limitations: PRFLimitation[],
  capabilities: { platformAuthenticatorAvailable: boolean; prfExtensionSupported: boolean }
): void {
  // Browser version checks first (higher priority than Windows Hello)
  // Firefox version check
  if (browser.name === 'firefox' && browser.version < MIN_FIREFOX_VERSION) {
    limitations.push('firefox-version-too-old');
  }

  // Chrome version check
  if (browser.name === 'chrome' && browser.version < MIN_CHROME_VERSION) {
    limitations.push('chrome-version-too-old');
  }

  // Edge version check (Edge follows Chrome versioning)
  if (browser.name === 'edge' && browser.version < MIN_CHROME_VERSION) {
    limitations.push('chrome-version-too-old');
  }

  // Safari version check
  if (browser.name === 'safari' && browser.version < MIN_SAFARI_VERSION) {
    limitations.push('safari-version-too-old');
  }
// Windows Hello limitation (only add if no version limitation already)
if (browser.os === 'windows' && !capabilities.prfExtensionSupported && limitations.length === 0) {
// Windows Hello doesn't support PRF extension
limitations.push('windows-hello-no-prf');
}

  // iOS Safari limitation - platform authenticator only
  if (browser.os === 'ios' && browser.name === 'safari') {
    // iOS Safari only supports platform authenticator (Face ID/Touch ID)
    // External security keys like YubiKey don't support PRF on iOS
    if (!capabilities.platformAuthenticatorAvailable) {
      limitations.push('ios-safari-platform-only');
    }
  }

  // No platform authenticator
  if (!capabilities.platformAuthenticatorAvailable && browser.os !== 'windows') {
    // On non-Windows platforms, we generally want a platform authenticator
    // This is a soft limitation - external security keys might work
    // limitations.push('no-platform-authenticator');
  }
}

/**
 * Check if a limitation is critical (prevents PRF usage)
 */
function isCriticalLimitation(limitation: PRFLimitation): boolean {
  const criticalLimitations: PRFLimitation[] = [
    'windows-hello-no-prf',
    'firefox-version-too-old',
    'chrome-version-too-old',
    'safari-version-too-old',
    'webauthn-not-available',
    'prf-extension-not-supported',
  ];
  return criticalLimitations.includes(limitation);
}

/**
 * Get human-readable reason for a limitation
 */
function getLimitationReason(limitation: PRFLimitation, browser: BrowserInfo): string {
  switch (limitation) {
    case 'windows-hello-no-prf':
      return 'Windows Hello does not support PRF extension. Please use a different authenticator or browser.';
    
    case 'firefox-version-too-old':
      return `Firefox ${browser.version} does not support PRF. Please upgrade to Firefox ${MIN_FIREFOX_VERSION} or later.`;
    
    case 'chrome-version-too-old':
      return `Chrome ${browser.version} does not support PRF. Please upgrade to Chrome ${MIN_CHROME_VERSION} or later.`;
    
    case 'safari-version-too-old':
      return `Safari ${browser.version} does not support PRF. Please upgrade to Safari ${MIN_SAFARI_VERSION} or later.`;
    
    case 'ios-safari-platform-only':
      return 'iOS Safari requires Face ID or Touch ID for PRF. External security keys are not supported.';
    
    case 'webauthn-not-available':
      return 'WebAuthn is not available in this browser. Please use a modern browser.';
    
    case 'prf-extension-not-supported':
      return 'This browser does not support the PRF extension required for passkey-based wallet recovery.';
    
    default:
      return 'PRF is not supported in this browser configuration.';
  }
}

/**
 * Quick check for PRF support (synchronous where possible)
 * Returns preliminary result - use checkPRFSupport() for full detection
 */
export function checkPRFSupportSync(): { supported: boolean; reason?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server-side rendering - cannot detect browser capabilities' };
  }

  if (!('PublicKeyCredential' in window)) {
    return { supported: false, reason: 'WebAuthn is not available' };
  }

  const browser = detectBrowser();

  // Quick version checks
  if (browser.name === 'firefox' && browser.version < MIN_FIREFOX_VERSION) {
    return { supported: false, reason: `Firefox ${browser.version} does not support PRF` };
  }

  if (browser.name === 'chrome' && browser.version < MIN_CHROME_VERSION) {
    return { supported: false, reason: `Chrome ${browser.version} does not support PRF` };
  }

  if (browser.name === 'safari' && browser.version < MIN_SAFARI_VERSION) {
    return { supported: false, reason: `Safari ${browser.version} does not support PRF` };
  }

  // Windows Hello quick check
  if (browser.os === 'windows' && browser.name === 'edge') {
    // Windows Hello through Edge needs async check
    return { supported: true }; // Optimistic - will be verified by async check
  }

  return { supported: true };
}

/**
 * Get a user-friendly message about browser support
 */
export function getBrowserSupportMessage(result: PRFSupportResult): string {
  if (result.supported) {
    return 'Your browser supports passkey-based wallet recovery.';
  }

  return result.reason || 'Your browser does not support passkey-based wallet recovery.';
}

/**
 * Check if running in a test environment
 */
function isTestEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
}
