import { ErrorBoundary } from '@/components/ui/error-boundary';
import { clearErrorAlertCache, reportErrorAlert } from '@/lib/observability/error-alert-client';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { render, screen } from '@testing-library/react';

// Mock the error alert client
jest.mock('@/lib/observability/error-alert-client', () => ({
  reportErrorAlert: jest.fn(),
  clearErrorAlertCache: jest.fn(),
  isErrorAlertingEnabled: jest.fn(() => true),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Mock toast
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockReportErrorAlert = reportErrorAlert as jest.MockedFunction<typeof reportErrorAlert>;
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>;
const mockToastError = toast.error as jest.MockedFunction<typeof toast.error>;

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from ThrowError');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary alerting', () => {
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

    // Suppress console.error from React during error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    // Restore console.error
    jest.restoreAllMocks();
  });

  describe('componentDidCatch reporting', () => {
    it('reports browser-error with componentStack when an error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify reportErrorAlert was called once
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);

      // Verify the payload structure
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'browser-error',
          message: 'Test error from ThrowError',
          path: '/test-path',
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );

      // Verify componentStack is present (it's a React component stack trace)
      const callArgs = mockReportErrorAlert.mock.calls[0][0];
      expect(callArgs.componentStack).toBeTruthy();
      expect(typeof callArgs.componentStack).toBe('string');
      // Component stack should contain some reference to the component tree
      expect(callArgs.componentStack).toMatch(/ThrowError|ErrorBoundary/);
    });

    it('preserves existing logger.error behavior', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify logger.error was called with the expected structure
      expect(mockLoggerError).toHaveBeenCalledTimes(1);
      expect(mockLoggerError).toHaveBeenCalledWith(
        'ErrorBoundary caught an error',
        expect.objectContaining({
          error: 'Test error from ThrowError',
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );
    });

    it('preserves existing toast.error behavior', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify toast.error was called
      expect(mockToastError).toHaveBeenCalledTimes(1);
      expect(mockToastError).toHaveBeenCalledWith('Something went wrong. Please try again.');
    });

    it('calls custom onError handler if provided', () => {
      const customErrorHandler = jest.fn();

      render(
        <ErrorBoundary onError={customErrorHandler}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify custom handler was called with error and errorInfo
      expect(customErrorHandler).toHaveBeenCalledTimes(1);
      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('fallback UI', () => {
    it('renders default fallback UI with correct text', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify fallback UI text is unchanged
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(/We're sorry, but there was an error loading this content./)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('renders custom fallback if provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      // No alert should be sent
      expect(mockReportErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('reporting order', () => {
    it('calls logger, reporter, custom handler, and toast in correct order', () => {
      const callOrder: string[] = [];

      mockLoggerError.mockImplementation(() => {
        callOrder.push('logger');
      });
      mockReportErrorAlert.mockImplementation(() => {
        callOrder.push('reporter');
      });
      mockToastError.mockImplementation(() => {
        callOrder.push('toast');
        return 'toast-id';
      });

      const customHandler = jest.fn(() => {
        callOrder.push('custom');
      });

      render(
        <ErrorBoundary onError={customHandler}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify order: logger -> reporter -> custom -> toast
      expect(callOrder).toEqual(['logger', 'reporter', 'custom', 'toast']);
    });
  });
});
