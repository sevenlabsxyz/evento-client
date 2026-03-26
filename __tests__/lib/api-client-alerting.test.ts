// Test the real Axios interceptor from lib/api/client.ts
// This test uses jest.doMock to override the global mock in jest.setup.ts

import { Env } from '@/lib/constants/env';
import { reportErrorAlert } from '@/lib/observability/error-alert-client';

// Mock the error-alert-client module (hoisted)
jest.mock('@/lib/observability/error-alert-client', () => ({
  reportErrorAlert: jest.fn(),
}));

// Use global to capture handler across hoisted mock and test code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__capturedResponseErrorHandler = null;

// Override the global mock from jest.setup.ts using doMock (not hoisted)
// This must be called before importing the module
jest.doMock('@/lib/api/client', () => {
  // Import axios within the mock factory
  const axios = require('axios');

  // Create a mock axios instance that captures the interceptor
  const mockInterceptors = {
    request: { use: jest.fn() },
    response: {
      use: jest.fn((fulfilled, rejected) => {
        // Capture the real error handler
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).__capturedResponseErrorHandler = rejected;
      }),
    },
  };

  const mockAxiosInstance = {
    interceptors: mockInterceptors,
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
  };

  // Mock axios.create to return our capturing mock
  jest.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance);

  // Now import and execute the real module code
  // This will trigger the interceptor registration with our mock
  jest.unmock('@/lib/api/client');
  const realModule = jest.requireActual('@/lib/api/client');

  return realModule;
});

// Mock console.error to keep test output clean
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('API Client HTTP Alerting', () => {
  const mockedReportErrorAlert = reportErrorAlert as jest.MockedFunction<typeof reportErrorAlert>;

  // Import the module in beforeAll to ensure mocks are ready
  beforeAll(() => {
    // Clear any previous captured handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__capturedResponseErrorHandler = null;
    // Import the module to trigger interceptor registration
    require('@/lib/api/client');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();

    // Enable production alerting for tests
    Object.assign(Env, {
      NODE_ENV: 'production',
      NEXT_PUBLIC_ERROR_ALERTS_ENABLED: true,
      NEXT_PUBLIC_API_URL: 'http://localhost:3002',
    });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    // Clean up global
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).__capturedResponseErrorHandler;
  });

  // Helper to invoke the real response error handler
  const invokeRealHandler = (error: any): Promise<any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (globalThis as any).__capturedResponseErrorHandler;
    if (!handler) {
      throw new Error(
        'Response error handler was not captured - ensure lib/api/client.ts was imported'
      );
    }
    return handler(error);
  };

  describe('HTTP error reporting', () => {
    it('should report 404 errors with client-http kind', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
        config: {
          url: '/v1/events/event-123',
          method: 'get',
          metadata: {
            requestId: 'req_test_123',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 404',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Event not found',
        status: 404,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockedReportErrorAlert).toHaveBeenCalledWith({
        kind: 'client-http',
        message: 'Event not found',
        path: '/v1/events/event-123',
        status: 404,
        method: 'GET',
        requestId: 'req_test_123',
      });
    });

    it('should report 500 errors with client-http kind', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        config: {
          url: '/v1/events',
          method: 'post',
          metadata: {
            requestId: 'req_test_456',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 500',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Internal server error',
        status: 500,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockedReportErrorAlert).toHaveBeenCalledWith({
        kind: 'client-http',
        message: 'Internal server error',
        path: '/v1/events',
        status: 500,
        method: 'POST',
        requestId: 'req_test_456',
      });
    });

    it('should report 401 errors with client-http kind', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          url: '/v1/user/me',
          method: 'get',
          metadata: {
            requestId: 'req_test_789',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 401',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Unauthorized',
        status: 401,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockedReportErrorAlert).toHaveBeenCalledWith({
        kind: 'client-http',
        message: 'Unauthorized',
        path: '/v1/user/me',
        status: 401,
        method: 'GET',
        requestId: 'req_test_789',
      });
    });

    it('should strip query strings from path before reporting', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
        config: {
          url: '/v1/events?token=secret123&userId=abc',
          method: 'get',
          metadata: {
            requestId: 'req_test_query',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 400',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Bad request',
        status: 400,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledTimes(1);
      const callArg = mockedReportErrorAlert.mock.calls[0][0];
      expect(callArg.path).toBe('/v1/events');
      expect(callArg.path).not.toContain('?');
      expect(callArg.path).not.toContain('token');
      expect(callArg.path).not.toContain('secret');
    });

    it('should use error.message when response data has no message', async () => {
      const mockError = {
        response: {
          status: 503,
          data: {}, // No message field
        },
        config: {
          url: '/v1/health',
          method: 'get',
          metadata: {
            requestId: 'req_test_no_msg',
            startTime: Date.now(),
          },
        },
        message: 'Network Error',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Network Error',
        status: 503,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          message: 'Network Error',
        })
      );
    });

    it('should use default message when neither response nor error has message', async () => {
      const mockError = {
        response: {
          status: 502,
          data: {}, // No message
        },
        config: {
          url: '/v1/data',
          method: 'get',
          metadata: {
            requestId: 'req_test_default',
            startTime: Date.now(),
          },
        },
        message: '', // Empty message
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'An unexpected error occurred',
        status: 502,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          message: 'An unexpected error occurred',
        })
      );
    });
  });

  describe('suppressErrorStatuses', () => {
    it('should NOT report errors when status is in suppressErrorStatuses', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
        config: {
          url: '/v1/events/missing',
          method: 'get',
          metadata: {
            requestId: 'req_test_suppress',
            startTime: Date.now(),
          },
          suppressErrorStatuses: [404, 401],
        },
        message: 'Request failed with status code 404',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Not found',
        status: 404,
        success: false,
      });

      expect(mockedReportErrorAlert).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should report errors when status is NOT in suppressErrorStatuses', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
        config: {
          url: '/v1/events',
          method: 'post',
          metadata: {
            requestId: 'req_test_not_suppressed',
            startTime: Date.now(),
          },
          suppressErrorStatuses: [404],
        },
        message: 'Request failed with status code 500',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Server error',
        status: 500,
        success: false,
      });

      expect(mockedReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          status: 500,
        })
      );
    });

    it('should handle multiple suppressed statuses', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          url: '/v1/protected',
          method: 'get',
          metadata: {
            requestId: 'req_test_multi',
            startTime: Date.now(),
          },
          suppressErrorStatuses: [401, 403, 404],
        },
        message: 'Request failed with status code 401',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Unauthorized',
        status: 401,
        success: false,
      });

      expect(mockedReportErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('rejected value contract', () => {
    it('should maintain standardized rejected value shape', async () => {
      const mockError = {
        response: {
          status: 422,
          data: { message: 'Validation failed' },
        },
        config: {
          url: '/v1/events',
          method: 'post',
          metadata: {
            requestId: 'req_test_contract',
            startTime: Date.now(),
          },
        },
        message: 'Request failed',
      };

      const rejectionPromise = invokeRealHandler(mockError);

      await expect(rejectionPromise).rejects.toEqual({
        message: 'Validation failed',
        status: 422,
        success: false,
      });

      try {
        await rejectionPromise;
      } catch (error) {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('status');
        expect(error).toHaveProperty('success');
        expect(Object.keys(error as object)).toHaveLength(3);
      }
    });

    it('should include undefined status when response has no status', async () => {
      const mockError = {
        response: undefined,
        config: {
          url: '/v1/events',
          method: 'get',
          metadata: {
            requestId: 'req_test_network',
            startTime: Date.now(),
          },
        },
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Network Error',
        status: undefined,
        success: false,
      });

      expect(mockedReportErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('status-less errors', () => {
    it('should NOT report errors without numeric status (network errors)', async () => {
      const mockError = {
        response: undefined,
        config: {
          url: '/v1/events',
          method: 'get',
          metadata: {
            requestId: 'req_test_no_status',
            startTime: Date.now(),
          },
        },
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Network Error',
        status: undefined,
        success: false,
      });

      expect(mockedReportErrorAlert).not.toHaveBeenCalled();
    });

    it('should NOT report request setup errors', async () => {
      const mockError = {
        response: undefined,
        config: {
          url: '/v1/events',
          method: 'get',
          metadata: {
            requestId: 'req_test_setup',
            startTime: Date.now(),
          },
        },
        message: 'Invalid request configuration',
      };

      await expect(invokeRealHandler(mockError)).rejects.toEqual({
        message: 'Invalid request configuration',
        status: undefined,
        success: false,
      });

      expect(mockedReportErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('various HTTP methods', () => {
    it('should report errors for POST requests', async () => {
      const mockError = {
        response: {
          status: 409,
          data: { message: 'Conflict' },
        },
        config: {
          url: '/v1/events',
          method: 'post',
          metadata: {
            requestId: 'req_test_post',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 409',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          method: 'POST',
        })
      );
    });

    it('should report errors for PUT requests', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
        config: {
          url: '/v1/events/event-123',
          method: 'put',
          metadata: {
            requestId: 'req_test_put',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 403',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          method: 'PUT',
        })
      );
    });

    it('should report errors for PATCH requests', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
        config: {
          url: '/v1/events/event-123',
          method: 'patch',
          metadata: {
            requestId: 'req_test_patch',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 400',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          method: 'PATCH',
        })
      );
    });

    it('should report errors for DELETE requests', async () => {
      const mockError = {
        response: {
          status: 410,
          data: { message: 'Gone' },
        },
        config: {
          url: '/v1/events/event-123',
          method: 'delete',
          metadata: {
            requestId: 'req_test_delete',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 410',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          method: 'DELETE',
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle missing requestId gracefully', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
        config: {
          url: '/v1/events',
          method: 'get',
          // No metadata
        },
        message: 'Request failed with status code 500',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          requestId: undefined,
        })
      );
    });

    it('should handle missing method gracefully', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
        config: {
          url: '/v1/events',
          metadata: {
            requestId: 'req_test_no_method',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 500',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          method: undefined,
        })
      );
    });

    it('should handle unknown URL gracefully', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
        config: {
          method: 'get',
          metadata: {
            requestId: 'req_test_no_url',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 500',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          path: 'unknown',
        })
      );
    });

    it('should handle URL with only query string (empty path)', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
        config: {
          url: '?foo=bar',
          method: 'get',
          metadata: {
            requestId: 'req_test_empty_path',
            startTime: Date.now(),
          },
        },
        message: 'Request failed with status code 400',
      };

      await expect(invokeRealHandler(mockError)).rejects.toBeDefined();

      expect(mockedReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'client-http',
          path: '',
        })
      );
    });
  });
});
