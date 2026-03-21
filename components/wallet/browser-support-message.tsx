'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Chrome, Globe, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  checkPRFSupport,
  type PRFSupportResult,
  type PRFSupportDetails,
} from '@/lib/utils/webauthn-capabilities';

interface BrowserSupportMessageProps {
  /** Called when user chooses to use PIN fallback instead */
  onUsePinFallback?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the compact version (for inline display) */
  compact?: boolean;
}

interface BrowserMessage {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  secondaryAction?: {
    text: string;
    url: string;
  };
  severity: 'error' | 'warning' | 'info';
  showPinFallback: boolean;
}

/**
 * Browser-specific support message component for WebAuthn PRF
 *
 * Shows tailored guidance based on detected browser and limitations.
 * Always offers PIN fallback as an alternative.
 */
export function BrowserSupportMessage({
  onUsePinFallback,
  className,
  compact = false,
}: BrowserSupportMessageProps) {
  const [supportResult, setSupportResult] = useState<PRFSupportResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectSupport() {
      const result = await checkPRFSupport();
      setSupportResult(result);
      setIsLoading(false);
    }
    detectSupport();
  }, []);

  if (isLoading || !supportResult) {
    return (
      <div className={cn('animate-pulse rounded-lg bg-muted p-4', className)}>
        <div className="h-4 w-3/4 rounded bg-muted-foreground/20" />
        <div className="mt-2 h-4 w-1/2 rounded bg-muted-foreground/20" />
      </div>
    );
  }

  // If PRF is supported, don't show anything
  if (supportResult.supported) {
    return null;
  }

  const browserMessage = getBrowserMessage(supportResult);

  if (compact) {
    return (
      <CompactMessage
        browserMessage={browserMessage}
        onUsePinFallback={onUsePinFallback}
        className={className}
      />
    );
  }

  return (
    <FullMessage
      browserMessage={browserMessage}
      supportResult={supportResult}
      onUsePinFallback={onUsePinFallback}
      className={className}
    />
  );
}

/**
 * Get browser-specific message based on PRF support result
 */
function getBrowserMessage(result: PRFSupportResult): BrowserMessage {
  const details = result.details;
  const limitations = details?.limitations ?? [];
  const browser = details?.browser ?? { name: 'unknown', version: 0, os: 'unknown' };

  // Windows Hello - no PRF support
  if (limitations.includes('windows-hello-no-prf')) {
    return {
      title: 'Use Security Key or PIN',
      message:
        'Windows Hello does not support passkey wallet recovery. Use a security key (YubiKey) or set up a PIN instead.',
      actionText: 'Learn about security keys',
      actionUrl: 'https://support.yubico.com/hc/en-us/articles/360013790339-Getting-Started-with-Your-YubiKey',
      severity: 'warning',
      showPinFallback: true,
    };
  }

  // Firefox version too old
  if (limitations.includes('firefox-version-too-old')) {
    const currentVersion = browser.version;
    return {
      title: 'Update Firefox or Use PIN',
      message: `Firefox ${currentVersion} doesn't support passkey wallet recovery. Update to Firefox 139+ or use PIN setup instead.`,
      actionText: 'Download Firefox 139+',
      actionUrl: 'https://www.mozilla.org/firefox/new/',
      secondaryAction: {
        text: 'Firefox PRF documentation',
        url: 'https://bugzilla.mozilla.org/show_bug.cgi?id=1934563',
      },
      severity: 'warning',
      showPinFallback: true,
    };
  }

  // Chrome version too old
  if (limitations.includes('chrome-version-too-old')) {
    const currentVersion = browser.version;
    return {
      title: 'Update Chrome or Use PIN',
      message: `Chrome ${currentVersion} doesn't support passkey wallet recovery. Update to Chrome 130+ or use PIN setup instead.`,
      actionText: 'Update Chrome',
      actionUrl: 'https://chrome.google.com',
      severity: 'warning',
      showPinFallback: true,
    };
  }

  // Safari version too old
  if (limitations.includes('safari-version-too-old')) {
    const currentVersion = browser.version;
    return {
      title: 'Update Safari or Use PIN',
      message: `Safari ${currentVersion} doesn't support passkey wallet recovery. Update to Safari 18.2+ or use PIN setup instead.`,
      actionText: 'Update macOS',
      actionUrl: 'https://support.apple.com/macos',
      severity: 'warning',
      showPinFallback: true,
    };
  }

  // iOS Safari - platform authenticator only
  if (limitations.includes('ios-safari-platform-only')) {
    return {
      title: 'Use Face ID or Touch ID on iOS',
      message:
        'iOS Safari requires Face ID or Touch ID for passkey wallet recovery. External security keys are not supported. Make sure Face ID/Touch ID is enabled.',
      actionText: 'iOS Passkey setup guide',
      actionUrl: 'https://support.apple.com/guide/iphone/use-passkeys-iphf538adced/ios',
      severity: 'info',
      showPinFallback: true,
    };
  }

  // Chrome on iOS specific guidance
  if (browser.os === 'ios' && browser.name === 'chrome') {
    return {
      title: 'Use Chrome on iOS',
      message:
        'Chrome on iOS uses Apple\'s WebKit engine. For best passkey support, use Safari or ensure Chrome is updated to the latest version.',
      actionText: 'Update Chrome',
      actionUrl: 'https://apps.apple.com/app/chrome/id535886823',
      severity: 'info',
      showPinFallback: true,
    };
  }

  // Android Chrome
  if (browser.os === 'android' && browser.name === 'chrome') {
    return {
      title: 'Android Passkey Support',
      message:
        'Chrome on Android supports passkeys with screen lock (PIN, pattern, or fingerprint). Ensure your device has screen lock enabled.',
      actionText: 'Android passkey guide',
      actionUrl: 'https://support.google.com/android/answer/13418850',
      severity: 'info',
      showPinFallback: true,
    };
  }

  // Edge on Windows
  if (browser.os === 'windows' && browser.name === 'edge') {
    return {
      title: 'Microsoft Edge Passkey Support',
      message:
        'Edge supports passkeys but Windows Hello has limitations. Use a hardware security key or PIN for wallet recovery.',
      actionText: 'Edge passkey documentation',
      actionUrl: 'https://support.microsoft.com/en-us/microsoft-edge/use-passkeys-in-microsoft-edge-cd09a6a6-bb6e-4c5c-8f1c-1e1e1e1e1e1e',
      severity: 'warning',
      showPinFallback: true,
    };
  }

  // Generic WebAuthn not available
  if (limitations.includes('webauthn-not-available')) {
    return {
      title: 'Browser Not Supported',
      message:
        'Your browser does not support WebAuthn passkeys. Use a modern browser like Chrome, Firefox, Safari, or Edge.',
      actionText: 'Download a supported browser',
      actionUrl: 'https://www.google.com/chrome/',
      severity: 'error',
      showPinFallback: false,
    };
  }

  // PRF extension not supported (generic)
  if (limitations.includes('prf-extension-not-supported')) {
    return {
      title: 'Browser Update Required',
      message:
        'Your browser version does not support the PRF extension needed for wallet recovery. Please update your browser or use PIN setup.',
      actionText: 'Check browser compatibility',
      actionUrl: 'https://caniuse.com/mdn-api_authenticatorattestationresponse_getclientextensionresults_credentialresult',
      severity: 'warning',
      showPinFallback: true,
    };
  }

  // Fallback for any other unsupported case
  return {
    title: 'Passkey Not Available',
    message: result.reason || 'Your browser configuration does not support passkey wallet recovery.',
    actionText: 'Learn more about passkeys',
    actionUrl: 'https://passkeys.dev/',
    severity: 'warning',
    showPinFallback: true,
  };
}

/**
 * Compact inline message display
 */
interface CompactMessageProps {
  browserMessage: BrowserMessage;
  onUsePinFallback?: () => void;
  className?: string;
}

function CompactMessage({ browserMessage, onUsePinFallback, className }: CompactMessageProps) {
  const severityStyles = {
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border p-3 text-sm',
        severityStyles[browserMessage.severity],
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{browserMessage.title}</p>
        <p className="mt-1 text-xs opacity-90">{browserMessage.message}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {browserMessage.actionUrl && (
            <a
              href={browserMessage.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              {browserMessage.actionText}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {browserMessage.showPinFallback && onUsePinFallback && (
            <button
              onClick={onUsePinFallback}
              className="text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              Use PIN instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Full message display with detailed information
 */
interface FullMessageProps {
  browserMessage: BrowserMessage;
  supportResult: PRFSupportResult;
  onUsePinFallback?: () => void;
  className?: string;
}

function FullMessage({
  browserMessage,
  supportResult,
  onUsePinFallback,
  className,
}: FullMessageProps) {
  const severityStyles = {
    error: {
      container: 'bg-destructive/5 border-destructive/20',
      icon: 'text-destructive',
      title: 'text-destructive',
      button: 'bg-destructive hover:bg-destructive/90',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const styles = severityStyles[browserMessage.severity];
  const browser = supportResult.details?.browser;

  return (
    <div className={cn('rounded-lg border p-5', styles.container, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', styles.icon)}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className={cn('font-semibold', styles.title)}>{browserMessage.title}</h3>

          <p className="mt-2 text-sm text-muted-foreground">{browserMessage.message}</p>

          {/* Browser info badge */}
          {browser && browser.name !== 'unknown' && (
            <div className="mt-3 flex items-center gap-2">
              <BrowserIcon browserName={browser.name} />
              <span className="inline-flex items-center rounded-full bg-background px-2 py-1 text-xs font-medium">
                {capitalizeFirst(browser.name)} {browser.version}
                {browser.os !== 'unknown' && ` on ${capitalizeFirst(browser.os)}`}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            {browserMessage.actionUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                asChild
              >
                <a
                  href={browserMessage.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {browserMessage.actionText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}

            {browserMessage.showPinFallback && onUsePinFallback && (
              <Button size="sm" onClick={onUsePinFallback}>
                Use PIN Instead
              </Button>
            )}
          </div>

          {/* Secondary action link */}
          {browserMessage.secondaryAction && (
            <div className="mt-3">
              <a
                href={browserMessage.secondaryAction.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {browserMessage.secondaryAction.text}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Technical details (collapsible) */}
          {supportResult.details && (
            <TechnicalDetails details={supportResult.details} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Browser icon component
 */
function BrowserIcon({ browserName }: { browserName: string }) {
  switch (browserName) {
    case 'chrome':
      return <Chrome className="h-4 w-4 text-blue-500" />;
    case 'firefox':
      return <Globe className="h-4 w-4 text-orange-500" />;
    case 'safari':
      return <Globe className="h-4 w-4 text-blue-400" />;
    case 'edge':
      return <Globe className="h-4 w-4 text-blue-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Technical details section (collapsible)
 */
function TechnicalDetails({ details }: { details: PRFSupportDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-4 border-t border-border/50 pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <span>{isExpanded ? 'Hide' : 'Show'} technical details</span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>WebAuthn Available:</span>
            <span>{details.webauthnAvailable ? 'Yes' : 'No'}</span>

            <span>PRF Extension:</span>
            <span>{details.prfExtensionSupported ? 'Supported' : 'Not Supported'}</span>

            <span>Platform Authenticator:</span>
            <span>{details.platformAuthenticatorAvailable ? 'Available' : 'Not Available'}</span>

            <span>User Verification:</span>
            <span>{details.userVerificationSupported ? 'Supported' : 'Not Supported'}</span>
          </div>

          {details.limitations.length > 0 && (
            <div className="mt-2">
              <span>Limitations:</span>
              <ul className="mt-1 list-inside list-disc">
                {details.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Hook to check PRF support status
 * Returns the support result and loading state
 */
export function usePRFSupport() {
  const [result, setResult] = useState<PRFSupportResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectSupport() {
      const supportResult = await checkPRFSupport();
      setResult(supportResult);
      setIsLoading(false);
    }
    detectSupport();
  }, []);

  return { result, isLoading, isSupported: result?.supported ?? false };
}

/**
 * Check if browser is supported for passkey wallet
 * Synchronous check for initial render decisions
 */
export function isBrowserSupportedForPasskey(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('PublicKeyCredential' in window)) return false;
  return true;
}
