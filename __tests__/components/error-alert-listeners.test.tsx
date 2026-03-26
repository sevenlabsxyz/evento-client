import { ErrorAlertListeners } from '@/components/observability/error-alert-listeners';
import { clearErrorAlertCache, reportErrorAlert } from '@/lib/observability/error-alert-client';
import { act, render } from '@testing-library/react';

// Mock the error alert client
jest.mock('@/lib/observability/error-alert-client', () => ({
  reportErrorAlert: jest.fn(),
  clearErrorAlertCache: jest.fn(),
  isErrorAlertingEnabled: jest.fn(() => true),
}));

const mockReportErrorAlert = reportErrorAlert as jest.MockedFunction<typeof reportErrorAlert>;

// Mock PromiseRejectionEvent for Node/Jest environment
// This class is not available in Node.js, only in browsers
class MockPromiseRejectionEvent extends Event {
  public readonly promise: Promise<unknown>;
  public readonly reason: unknown;

  constructor(type: string, eventInitDict: { promise: Promise<unknown>; reason: unknown }) {
    super(type);
    this.promise = eventInitDict.promise;
    this.reason = eventInitDict.reason;
  }
}

// Assign to global to make it available
(global as any).PromiseRejectionEvent = MockPromiseRejectionEvent;

describe('ErrorAlertListeners', () => {
  // Store original window location
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    clearErrorAlertCache();

    // Mock window.location.pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/test-path' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('window.error forwarding', () => {
    it('reports browser-error for runtime errors', () => {
      render(<ErrorAlertListeners />);

      // Simulate a window error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error message',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error message'),
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'browser-error',
          message: 'Test error message',
          path: '/test-path',
          stack: expect.any(String),
        })
      );
    });

    it('reports browser-error with message when error object is missing', () => {
      render(<ErrorAlertListeners />);

      const errorEvent = new ErrorEvent('error', {
        message: 'Script error',
        filename: 'external.js',
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'browser-error',
          message: 'Script error',
          path: '/test-path',
        })
      );
    });

    it('suppresses empty/errorless events', () => {
      render(<ErrorAlertListeners />);

      // Event with no message and no error
      const errorEvent = new ErrorEvent('error', {
        message: '',
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      expect(mockReportErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('window.unhandledrejection forwarding', () => {
    it('reports unhandled-rejection for Error rejections', () => {
      render(<ErrorAlertListeners />);

      const error = new Error('Async error');
      // Create a caught promise to avoid Jest unhandled rejection warning
      const caughtPromise = Promise.reject(error).catch(() => {});
      const rejectionEvent = new MockPromiseRejectionEvent('unhandledrejection', {
        promise: caughtPromise,
        reason: error,
      });

      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'unhandled-rejection',
          message: 'Async error',
          path: '/test-path',
          stack: expect.any(String),
        })
      );
    });

    it('reports unhandled-rejection for string rejections', () => {
      render(<ErrorAlertListeners />);

      const caughtPromise = Promise.reject('String rejection reason').catch(() => {});
      const rejectionEvent = new MockPromiseRejectionEvent('unhandledrejection', {
        promise: caughtPromise,
        reason: 'String rejection reason',
      });

      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'unhandled-rejection',
          message: 'String rejection reason',
          path: '/test-path',
        })
      );
    });

    it('converts non-Error, non-string reasons to string', () => {
      render(<ErrorAlertListeners />);

      const objectReason = { code: 'ERR_001', detail: 'Some error' };
      const caughtPromise = Promise.reject(objectReason).catch(() => {});
      const rejectionEvent = new MockPromiseRejectionEvent('unhandledrejection', {
        promise: caughtPromise,
        reason: objectReason,
      });

      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'unhandled-rejection',
          message: expect.stringContaining('Unhandled rejection'),
          path: '/test-path',
        })
      );
    });

    it('suppresses null/undefined rejections', () => {
      render(<ErrorAlertListeners />);

      const caughtPromise = Promise.reject(null).catch(() => {});
      const rejectionEvent = new MockPromiseRejectionEvent('unhandledrejection', {
        promise: caughtPromise,
        reason: null,
      });

      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      expect(mockReportErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('cleanup and remount behavior', () => {
    it('removes listeners on unmount', () => {
      const { unmount } = render(<ErrorAlertListeners />);

      // Verify listener is active
      const errorEvent = new ErrorEvent('error', {
        message: 'Before unmount',
        error: new Error('Before unmount'),
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);

      mockReportErrorAlert.mockClear();

      // Unmount and verify listener is removed
      unmount();

      // Add a temporary catch-all listener to prevent jsdom from throwing
      // when we dispatch an error event with no handler
      const tempHandler = jest.fn((e: ErrorEvent) => e.preventDefault());
      window.addEventListener('error', tempHandler);

      const afterUnmountEvent = new ErrorEvent('error', {
        message: 'After unmount',
        error: new Error('After unmount'),
      });

      act(() => {
        window.dispatchEvent(afterUnmountEvent);
      });

      // Clean up temp listener
      window.removeEventListener('error', tempHandler);

      // The temp handler caught the event, but our listener should NOT have reported
      expect(tempHandler).toHaveBeenCalled();
      expect(mockReportErrorAlert).not.toHaveBeenCalled();
    });

    it('does not double-subscribe on remount (StrictMode safety)', () => {
      // Simulate React StrictMode double-mount behavior
      const { unmount } = render(<ErrorAlertListeners />);

      // Trigger an error
      const errorEvent = new ErrorEvent('error', {
        message: 'First mount',
        error: new Error('First mount'),
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);

      mockReportErrorAlert.mockClear();

      // Unmount (cleanup runs)
      unmount();

      // Remount (should register listeners again)
      render(<ErrorAlertListeners />);

      const secondErrorEvent = new ErrorEvent('error', {
        message: 'Second mount',
        error: new Error('Second mount'),
      });

      act(() => {
        window.dispatchEvent(secondErrorEvent);
      });

      // Should only be called once (not doubled)
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
    });
  });
});
