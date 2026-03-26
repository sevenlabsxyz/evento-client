import { Env } from '@/lib/constants/env';
import {
  clearErrorAlertCache,
  ErrorReportInput,
  getErrorAlertCacheSize,
  isErrorAlertingEnabled,
  reportErrorAlert,
} from '@/lib/observability/error-alert-client';

// Helper to read Blob content in tests
async function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}
describe('error-alert-client', () => {
  const originalEnv = { ...Env };
  let sendBeaconMock: jest.Mock;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    // Reset deduplication cache
    clearErrorAlertCache();

    // Mock navigator.sendBeacon
    sendBeaconMock = jest.fn();
    Object.defineProperty(global, 'navigator', {
      value: {
        sendBeacon: sendBeaconMock,
        userAgent: 'test-user-agent',
      },
      writable: true,
      configurable: true,
    });

    // Mock fetch
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    // Reset environment
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore original env values
    Object.assign(Env, originalEnv);
  });

  describe('production gating', () => {
    it('should not send alerts when not in production', () => {
      // Arrange
      Object.assign(Env, {
        NODE_ENV: 'development',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });

      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Test error',
        path: '/test/path',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      expect(sendBeaconMock).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should not send alerts when alerts are disabled', () => {
      // Arrange
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: false,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });

      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Test error',
        path: '/test/path',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      expect(sendBeaconMock).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should send alerts when in production and enabled', () => {
      // Arrange
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });

      sendBeaconMock.mockReturnValue(true);

      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Test error',
        path: '/test/path',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
      expect(sendBeaconMock).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/observability/errors',
        expect.any(Blob)
      );
    });

    it('isErrorAlertingEnabled returns false when not in production', () => {
      Object.assign(Env, {
        NODE_ENV: 'development',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
      });

      expect(isErrorAlertingEnabled()).toBe(false);
    });

    it('isErrorAlertingEnabled returns false when disabled', () => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: false,
      });

      expect(isErrorAlertingEnabled()).toBe(false);
    });

    it('isErrorAlertingEnabled returns true when in production and enabled', () => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
      });

      expect(isErrorAlertingEnabled()).toBe(true);
    });
  });

  describe('sendBeacon path', () => {
    beforeEach(() => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });
    });

    it('should send via sendBeacon with correct payload structure', async () => {
      // Arrange
      sendBeaconMock.mockReturnValue(true);

      const input: ErrorReportInput = {
        kind: 'client-http',
        message: 'API request failed',
        path: '/api/v1/events',
        status: 500,
        method: 'POST',
        requestId: 'req_123',
        stack: 'Error: at line 1',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);

      const [url, blob] = sendBeaconMock.mock.calls[0];
      expect(url).toBe('http://localhost:3002/api/v1/observability/errors');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');

      // Verify payload structure
      const payload = JSON.parse(await readBlobText(blob));
      expect(payload).toMatchObject({
        source: 'client',
        kind: 'client-http',
        message: 'API request failed',
        path: '/api/v1/events',
        status: 500,
        method: 'POST',
        requestId: 'req_123',
        stack: 'Error: at line 1',
        userAgent: 'test-user-agent',
      });
      expect(payload.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should strip query strings from path', async () => {
      // Arrange
      sendBeaconMock.mockReturnValue(true);

      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Test error',
        path: '/api/v1/events?token=secret&userId=123',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      const [, blob] = sendBeaconMock.mock.calls[0];
      const payload = JSON.parse(await readBlobText(blob));
      expect(payload.path).toBe('/api/v1/events');
      expect(payload.path).not.toContain('?');
      expect(payload.path).not.toContain('token');
    });

    it('should handle paths without query strings', async () => {
      // Arrange
      sendBeaconMock.mockReturnValue(true);

      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Test error',
        path: '/api/v1/events',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      const [, blob] = sendBeaconMock.mock.calls[0];
      const payload = JSON.parse(await readBlobText(blob));
      expect(payload.path).toBe('/api/v1/events');
    });

    it('should include optional fields only when provided', async () => {
      // Arrange
      sendBeaconMock.mockReturnValue(true);

      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Simple error',
        path: '/',
      };

      // Act
      reportErrorAlert(input);

      // Assert
      const [, blob] = sendBeaconMock.mock.calls[0];
      const payload = JSON.parse(await readBlobText(blob));
      expect(payload.status).toBeUndefined();
      expect(payload.method).toBeUndefined();
      expect(payload.requestId).toBeUndefined();
      expect(payload.stack).toBeUndefined();
      expect(payload.componentStack).toBeUndefined();
    });
  });

  describe('fetch fallback path', () => {
    beforeEach(() => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });
    });

    it('should fallback to fetch when sendBeacon returns false', async () => {
      // Arrange
      sendBeaconMock.mockReturnValue(false);

      const input: ErrorReportInput = {
        kind: 'client-http',
        message: 'Network failure',
        path: '/api/v1/data',
      };

      // Act
      reportErrorAlert(input);

      // Wait for async fetch
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3002/api/v1/observability/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
        keepalive: true,
        mode: 'cors',
      });
    });

    it('should fallback to fetch when sendBeacon is not available', async () => {
      // Arrange
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'test-user-agent' }, // no sendBeacon
        writable: true,
        configurable: true,
      });

      const input: ErrorReportInput = {
        kind: 'client-http',
        message: 'Request timeout',
        path: '/api/v1/slow',
      };

      // Act
      reportErrorAlert(input);

      // Wait for async fetch
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should swallow fetch errors without throwing', async () => {
      // Arrange
      sendBeaconMock.mockReturnValue(false);
      fetchMock.mockRejectedValue(new Error('Network failure'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const input: ErrorReportInput = {
        kind: 'api-http',
        message: 'Server error',
        path: '/api/v1/crash',
      };

      // Act - should not throw
      expect(() => reportErrorAlert(input)).not.toThrow();

      // Wait for async fetch to fail
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert - no console error should be logged (errors are swallowed)
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('5-second deduplication', () => {
    beforeEach(() => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });
      sendBeaconMock.mockReturnValue(true);
    });

    it('should suppress duplicate errors within 5 seconds', () => {
      // Arrange
      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Same error',
        path: '/test',
      };

      // Act
      reportErrorAlert(input);
      reportErrorAlert(input);
      reportErrorAlert(input);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    });

    it('should allow different error kinds through', () => {
      // Arrange
      const input1: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Same message',
        path: '/test',
      };
      const input2: ErrorReportInput = {
        kind: 'unhandled-rejection',
        message: 'Same message',
        path: '/test',
      };

      // Act
      reportErrorAlert(input1);
      reportErrorAlert(input2);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(2);
    });

    it('should allow different paths through', () => {
      // Arrange
      const input1: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Same message',
        path: '/test1',
      };
      const input2: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Same message',
        path: '/test2',
      };

      // Act
      reportErrorAlert(input1);
      reportErrorAlert(input2);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(2);
    });

    it('should allow different messages through', () => {
      // Arrange
      const input1: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Error one',
        path: '/test',
      };
      const input2: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Error two',
        path: '/test',
      };

      // Act
      reportErrorAlert(input1);
      reportErrorAlert(input2);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(2);
    });

    it('should allow same error after 5 seconds', async () => {
      // Arrange
      jest.useFakeTimers();
      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Same error',
        path: '/test',
      };

      // Act
      reportErrorAlert(input);
      jest.advanceTimersByTime(6000); // 6 seconds
      reportErrorAlert(input);

      // Assert
      expect(sendBeaconMock).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should track cache size correctly', () => {
      // Arrange
      const input1: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Error 1',
        path: '/test1',
      };
      const input2: ErrorReportInput = {
        kind: 'browser-error',
        message: 'Error 2',
        path: '/test2',
      };

      // Act
      expect(getErrorAlertCacheSize()).toBe(0);
      reportErrorAlert(input1);
      expect(getErrorAlertCacheSize()).toBe(1);
      reportErrorAlert(input2);
      expect(getErrorAlertCacheSize()).toBe(2);

      // Duplicate should not increase cache
      reportErrorAlert(input1);
      expect(getErrorAlertCacheSize()).toBe(2);
    });

    it('should dedupe based on fingerprint including status', () => {
      // Arrange
      const input1: ErrorReportInput = {
        kind: 'client-http',
        message: 'API error',
        path: '/api/test',
        status: 500,
      };
      const input2: ErrorReportInput = {
        kind: 'client-http',
        message: 'API error',
        path: '/api/test',
        status: 404, // different status
      };

      // Act
      reportErrorAlert(input1);
      reportErrorAlert(input2);

      // Assert - both should send because status differs
      expect(sendBeaconMock).toHaveBeenCalledTimes(2);
    });

    it('should use only first line of message for fingerprint', () => {
      // Arrange
      const input1: ErrorReportInput = {
        kind: 'browser-error',
        message: 'First line\nSecond line\nThird line',
        path: '/test',
      };
      const input2: ErrorReportInput = {
        kind: 'browser-error',
        message: 'First line\nDifferent second line',
        path: '/test',
      };

      // Act
      reportErrorAlert(input1);
      reportErrorAlert(input2);

      // Assert - second should be deduped because first line matches
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('error kind types', () => {
    beforeEach(() => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });
      sendBeaconMock.mockReturnValue(true);
    });

    it('should accept all valid error kinds', () => {
      const kinds = [
        'browser-error',
        'unhandled-rejection',
        'client-http',
        'api-http',
        'api-exception',
      ] as const;

      kinds.forEach((kind, index) => {
        reportErrorAlert({
          kind,
          message: `Test ${kind}`,
          path: `/test/${index}`,
        });
      });

      expect(sendBeaconMock).toHaveBeenCalledTimes(kinds.length);
    });
  });

  describe('componentStack handling', () => {
    beforeEach(() => {
      Object.assign(Env, {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
        NEXT_PUBLIC_API_URL: 'http://localhost:3002/api',
      });
      sendBeaconMock.mockReturnValue(true);
    });

    it('should include componentStack when provided', async () => {
      const input: ErrorReportInput = {
        kind: 'browser-error',
        message: 'React error',
        path: '/',
        componentStack: '    at ComponentA\n    at ComponentB',
      };

      reportErrorAlert(input);

      const [, blob] = sendBeaconMock.mock.calls[0];
      const payload = JSON.parse(await readBlobText(blob));
      expect(payload.componentStack).toBe('    at ComponentA\n    at ComponentB');
    });
  });
});
