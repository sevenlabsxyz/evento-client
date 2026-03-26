import { clearErrorAlertCache, reportErrorAlert } from '@/lib/observability/error-alert-client';
import { render, screen } from '@testing-library/react';

// Import the actual error page components (renamed to avoid shadowing global Error)
import ErrorPage from '@/app/error';
import GlobalErrorPage from '@/app/global-error';
// Mock the error alert client
jest.mock('@/lib/observability/error-alert-client', () => ({
  reportErrorAlert: jest.fn(),
  clearErrorAlertCache: jest.fn(),
  isErrorAlertingEnabled: jest.fn(() => true),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

const mockReportErrorAlert = reportErrorAlert as jest.MockedFunction<typeof reportErrorAlert>;

describe('Error page alerting', () => {
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

    // Suppress React DOM nesting warnings for global-error's <html> in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    jest.restoreAllMocks();
  });

  describe('app/error.tsx (real component)', () => {
    it('reports browser-error once when error page renders', () => {
      const error = new Error('Test route error') as Error & { digest?: string };
      error.digest = 'test-digest';
      const reset = jest.fn();

      render(<ErrorPage error={error} reset={reset} />);

      // Verify reportErrorAlert was called once
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'browser-error',
          message: 'Test route error',
          path: '/test-path',
          stack: expect.any(String),
        })
      );
    });

    it('does not resend the same error on rerender', () => {
      const error = new Error('Test route error') as Error & { digest?: string };
      const reset = jest.fn();

      const { rerender } = render(<ErrorPage error={error} reset={reset} />);

      // First render should report
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);

      // Rerender with the same error object
      rerender(<ErrorPage error={error} reset={reset} />);

      // Should still be 1 - no resend
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
    });

    it('reports a new error when error object changes', () => {
      const error1 = new Error('First error') as Error & { digest?: string };
      const error2 = new Error('Second error') as Error & { digest?: string };
      const reset = jest.fn();

      const { rerender } = render(<ErrorPage error={error1} reset={reset} />);

      // First render should report
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'First error',
        })
      );

      // Rerender with a different error object
      rerender(<ErrorPage error={error2} reset={reset} />);

      // Should now be 2 - new error reported
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(2);
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Second error',
        })
      );
    });

    it('renders fallback UI with correct text', () => {
      const error = new Error('Test error') as Error & { digest?: string };
      const reset = jest.fn();

      render(<ErrorPage error={error} reset={reset} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('calls reset when button is clicked', () => {
      const error = new Error('Test error') as Error & { digest?: string };
      const reset = jest.fn();

      render(<ErrorPage error={error} reset={reset} />);

      screen.getByRole('button', { name: 'Try again' }).click();

      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('app/global-error.tsx (real component)', () => {
    it('reports browser-error once when global error page renders', () => {
      const error = new Error('Test global error') as Error & { digest?: string };
      const reset = jest.fn();

      render(<GlobalErrorPage error={error} reset={reset} />);

      // Verify reportErrorAlert was called once
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
      expect(mockReportErrorAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'browser-error',
          message: 'Test global error',
          path: '/test-path',
          stack: expect.any(String),
        })
      );
    });

    it('does not resend the same error on rerender', () => {
      const error = new Error('Test global error') as Error & { digest?: string };
      const reset = jest.fn();

      const { rerender } = render(<GlobalErrorPage error={error} reset={reset} />);

      // First render should report
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);

      // Rerender with the same error object
      rerender(<GlobalErrorPage error={error} reset={reset} />);

      // Should still be 1 - no resend
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);
    });

    it('reports a new error when error object changes', () => {
      const error1 = new Error('First global error') as Error & { digest?: string };
      const error2 = new Error('Second global error') as Error & { digest?: string };
      const reset = jest.fn();

      const { rerender } = render(<GlobalErrorPage error={error1} reset={reset} />);

      // First render should report
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(1);

      // Rerender with a different error object
      rerender(<GlobalErrorPage error={error2} reset={reset} />);

      // Should now be 2 - new error reported
      expect(mockReportErrorAlert).toHaveBeenCalledTimes(2);
    });

    it('renders fallback UI with correct text', () => {
      const error = new Error('Test error') as Error & { digest?: string };
      const reset = jest.fn();

      render(<GlobalErrorPage error={error} reset={reset} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });
  });
});
