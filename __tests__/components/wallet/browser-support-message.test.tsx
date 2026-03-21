/**
 * Unit tests for BrowserSupportMessage component
 *
 * Tests browser-specific messaging and PIN fallback functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  BrowserSupportMessage,
  usePRFSupport,
  isBrowserSupportedForPasskey,
} from '@/components/wallet/browser-support-message';

// Mock the webauthn-capabilities module
jest.mock('@/lib/utils/webauthn-capabilities', () => ({
  checkPRFSupport: jest.fn(),
}));

import { checkPRFSupport } from '@/lib/utils/webauthn-capabilities';

const mockedCheckPRFSupport = checkPRFSupport as jest.MockedFunction<typeof checkPRFSupport>;

describe('BrowserSupportMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading skeleton while detecting support', async () => {
      // Delay the promise resolution
      mockedCheckPRFSupport.mockImplementation(() => new Promise(() => {}));

      render(<BrowserSupportMessage />);

      // Should show loading state (skeleton has animate-pulse class)
      const skeleton = screen.getByText((_, element) => {
        return element?.className?.includes('animate-pulse') ?? false;
      });
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Supported browser', () => {
    it('returns null when PRF is supported', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: true,
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: true,
          browser: { name: 'chrome', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: [],
        },
      });

      const { container } = render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Windows Hello message', () => {
    it('shows Windows Hello specific message', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Use Security Key or PIN')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Windows Hello does not support passkey wallet recovery/)
      ).toBeInTheDocument();
    });

    it('includes link to YubiKey documentation for Windows', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        const link = screen.getByText('Learn about security keys');
        expect(link).toHaveAttribute('href', expect.stringContaining('yubico.com'));
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Firefox version message', () => {
    it('shows Firefox update message for old versions', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Firefox 138 does not support PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'firefox', version: 138, fullVersion: '138.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['firefox-version-too-old'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Update Firefox or Use PIN')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Firefox 138 doesn't support passkey wallet recovery/)
      ).toBeInTheDocument();
    });

    it('includes Firefox download link', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Firefox 138 does not support PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'firefox', version: 138, fullVersion: '138.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['firefox-version-too-old'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        const link = screen.getByText('Download Firefox 139+');
        expect(link).toHaveAttribute('href', expect.stringContaining('mozilla.org'));
      });
    });

    it('includes Firefox PRF documentation link', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Firefox 138 does not support PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'firefox', version: 138, fullVersion: '138.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['firefox-version-too-old'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        const link = screen.getByText('Firefox PRF documentation');
        expect(link).toHaveAttribute('href', expect.stringContaining('bugzilla.mozilla.org'));
      });
    });
  });

  describe('Chrome version message', () => {
    it('shows Chrome update message for old versions', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Chrome 129 does not support PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'chrome', version: 129, fullVersion: '129.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['chrome-version-too-old'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Update Chrome or Use PIN')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Chrome 129 doesn't support passkey wallet recovery/)
      ).toBeInTheDocument();
    });
  });

  describe('Safari version message', () => {
    it('shows Safari update message for old versions', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Safari 18.1 does not support PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'safari', version: 18.1, fullVersion: '18.1', isMobile: false, os: 'macos' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['safari-version-too-old'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Update Safari or Use PIN')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Safari 18.1 doesn't support passkey wallet recovery/)
      ).toBeInTheDocument();
    });
  });

  describe('iOS Safari message', () => {
    it('shows Face ID/Touch ID guidance for iOS', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'iOS Safari requires Face ID or Touch ID for PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: true,
          browser: { name: 'safari', version: 18.2, fullVersion: '18.2', isMobile: true, os: 'ios' },
          platformAuthenticatorAvailable: false,
          userVerificationSupported: true,
          limitations: ['ios-safari-platform-only'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Use Face ID or Touch ID on iOS')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/iOS Safari requires Face ID or Touch ID/)
      ).toBeInTheDocument();
    });

    it('includes iOS passkey setup guide link', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'iOS Safari requires Face ID or Touch ID for PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: true,
          browser: { name: 'safari', version: 18.2, fullVersion: '18.2', isMobile: true, os: 'ios' },
          platformAuthenticatorAvailable: false,
          userVerificationSupported: true,
          limitations: ['ios-safari-platform-only'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        const link = screen.getByText('iOS Passkey setup guide');
        expect(link).toHaveAttribute('href', expect.stringContaining('support.apple.com'));
      });
    });
  });

  describe('Chrome on iOS message', () => {
    it('shows Chrome on iOS specific guidance', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'PRF extension is not supported',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'chrome', version: 120, fullVersion: '120.0', isMobile: true, os: 'ios' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['prf-extension-not-supported'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Use Chrome on iOS')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Chrome on iOS uses Apple's WebKit engine/)
      ).toBeInTheDocument();
    });
  });

  describe('Android Chrome message', () => {
    it('shows Android passkey guidance', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'PRF extension is not supported',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'chrome', version: 120, fullVersion: '120.0', isMobile: true, os: 'android' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['prf-extension-not-supported'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Android Passkey Support')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Chrome on Android supports passkeys with screen lock/)
      ).toBeInTheDocument();
    });
  });

  describe('Edge on Windows message', () => {
    it('shows Edge-specific guidance for Windows', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'PRF extension is not supported',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['prf-extension-not-supported'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Microsoft Edge Passkey Support')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Edge supports passkeys but Windows Hello has limitations/)
      ).toBeInTheDocument();
    });
  });

  describe('PIN fallback', () => {
    it('shows PIN fallback button when onUsePinFallback is provided', async () => {
      const onUsePinFallback = jest.fn();
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage onUsePinFallback={onUsePinFallback} />);

      await waitFor(() => {
        const pinButton = screen.getByText('Use PIN Instead');
        expect(pinButton).toBeInTheDocument();
      });
    });

    it('calls onUsePinFallback when PIN button is clicked', async () => {
      const onUsePinFallback = jest.fn();
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage onUsePinFallback={onUsePinFallback} />);

      await waitFor(() => {
        const pinButton = screen.getByText('Use PIN Instead');
        fireEvent.click(pinButton);
      });

      expect(onUsePinFallback).toHaveBeenCalledTimes(1);
    });

    it('does not show PIN fallback for webauthn-not-available', async () => {
      const onUsePinFallback = jest.fn();
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'WebAuthn is not available',
        details: {
          webauthnAvailable: false,
          publicKeyCredentialSupported: false,
          prfExtensionSupported: false,
          browser: { name: 'unknown', version: 0, fullVersion: 'unknown', isMobile: false, os: 'unknown' },
          platformAuthenticatorAvailable: false,
          userVerificationSupported: false,
          limitations: ['webauthn-not-available'],
        },
      });

      render(<BrowserSupportMessage onUsePinFallback={onUsePinFallback} />);

      await waitFor(() => {
        expect(screen.getByText('Browser Not Supported')).toBeInTheDocument();
      });

      // PIN fallback should not be shown when WebAuthn is completely unavailable
      expect(screen.queryByText('Use PIN Instead')).not.toBeInTheDocument();
    });
  });

  describe('Compact mode', () => {
    it('renders compact version when compact prop is true', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage compact onUsePinFallback={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText('Use Security Key or PIN')).toBeInTheDocument();
      });

      // Compact mode should have smaller text
      const message = screen.getByText(/Windows Hello does not support/);
      expect(message).toHaveClass('text-xs');
    });

    it('shows Use PIN instead link in compact mode', async () => {
      const onUsePinFallback = jest.fn();
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage compact onUsePinFallback={onUsePinFallback} />);

      await waitFor(() => {
        const pinLink = screen.getByText('Use PIN instead');
        expect(pinLink).toBeInTheDocument();
      });
    });
  });

  describe('Technical details', () => {
    it('shows technical details when expanded', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Use Security Key or PIN')).toBeInTheDocument();
      });

      // Click to expand technical details
      const expandButton = screen.getByText('Show technical details');
      fireEvent.click(expandButton);

      // Should show technical details
      expect(screen.getByText('WebAuthn Available:')).toBeInTheDocument();
      expect(screen.getByText('PRF Extension:')).toBeInTheDocument();
      expect(screen.getByText('Platform Authenticator:')).toBeInTheDocument();
    });

    it('hides technical details when collapsed', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Windows Hello does not support PRF extension',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'edge', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['windows-hello-no-prf'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Use Security Key or PIN')).toBeInTheDocument();
      });

      // Expand first
      const expandButton = screen.getByText('Show technical details');
      fireEvent.click(expandButton);

      // Then collapse
      const collapseButton = screen.getByText('Hide technical details');
      fireEvent.click(collapseButton);

      // Technical details should be hidden
      expect(screen.queryByText('WebAuthn Available:')).not.toBeInTheDocument();
    });
  });

  describe('Browser info display', () => {
    it('displays browser name and version', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Firefox 138 does not support PRF',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'firefox', version: 138, fullVersion: '138.0', isMobile: false, os: 'windows' },
          platformAuthenticatorAvailable: true,
          userVerificationSupported: true,
          limitations: ['firefox-version-too-old'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText(/Firefox 138 on Windows/)).toBeInTheDocument();
      });
    });
  });

  describe('Generic unsupported message', () => {
    it('shows fallback message for unknown limitations', async () => {
      mockedCheckPRFSupport.mockResolvedValue({
        supported: false,
        reason: 'Custom unsupported reason',
        details: {
          webauthnAvailable: true,
          publicKeyCredentialSupported: true,
          prfExtensionSupported: false,
          browser: { name: 'unknown', version: 0, fullVersion: 'unknown', isMobile: false, os: 'unknown' },
          platformAuthenticatorAvailable: false,
          userVerificationSupported: false,
          limitations: ['prf-extension-not-supported'],
        },
      });

      render(<BrowserSupportMessage />);

      await waitFor(() => {
        expect(screen.getByText('Browser Update Required')).toBeInTheDocument();
      });
    });
  });
});

describe('usePRFSupport hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockedCheckPRFSupport.mockResolvedValue({
      supported: true,
      details: {
        webauthnAvailable: true,
        publicKeyCredentialSupported: true,
        prfExtensionSupported: true,
        browser: { name: 'chrome', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
        platformAuthenticatorAvailable: true,
        userVerificationSupported: true,
        limitations: [],
      },
    });

    function TestComponent() {
      const { isLoading, isSupported } = usePRFSupport();
      return (
        <div>
          <span data-testid="loading">{isLoading ? 'loading' : 'done'}</span>
          <span data-testid="supported">{isSupported ? 'yes' : 'no'}</span>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('returns support result after detection', async () => {
    mockedCheckPRFSupport.mockResolvedValue({
      supported: true,
      details: {
        webauthnAvailable: true,
        publicKeyCredentialSupported: true,
        prfExtensionSupported: true,
        browser: { name: 'chrome', version: 130, fullVersion: '130.0', isMobile: false, os: 'windows' },
        platformAuthenticatorAvailable: true,
        userVerificationSupported: true,
        limitations: [],
      },
    });

    function TestComponent() {
      const { isLoading, isSupported } = usePRFSupport();
      return (
        <div>
          <span data-testid="loading">{isLoading ? 'loading' : 'done'}</span>
          <span data-testid="supported">{isSupported ? 'yes' : 'no'}</span>
        </div>
      );
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('done');
    });

    expect(screen.getByTestId('supported')).toHaveTextContent('yes');
  });
});

describe('isBrowserSupportedForPasskey', () => {
  const originalPublicKeyCredential = window.PublicKeyCredential;

  afterEach(() => {
    // Restore original
    if (originalPublicKeyCredential) {
      (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPublicKeyCredential;
    } else {
      delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
    }
  });

  it('returns true when PublicKeyCredential is available', () => {
    (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = jest.fn();
    expect(isBrowserSupportedForPasskey()).toBe(true);
  });

  it('returns false when PublicKeyCredential is not available', () => {
    delete (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
    expect(isBrowserSupportedForPasskey()).toBe(false);
  });

  it('returns false during server-side rendering', () => {
    const originalWindow = global.window;
    // @ts-expect-error - simulating SSR
    global.window = undefined;
    expect(isBrowserSupportedForPasskey()).toBe(false);
    global.window = originalWindow;
  });
});
