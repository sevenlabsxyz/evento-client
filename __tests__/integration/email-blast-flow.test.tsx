import EmailBlastCompose from '@/components/email-blast/email-blast-compose';
import EmailBlastHistory from '@/components/email-blast/email-blast-history';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestWrapper } from '../setup/test-utils';

// Mock the email blast hooks
jest.mock('@/lib/hooks/use-email-blasts', () => ({
  useEmailBlasts: () => ({
    data: [
      {
        id: 'blast1',
        event_id: 'event123',
        user_id: 'user1',
        message: '<p>Come join us!</p>',
        recipient_filter: 'all',
        status: 'sent',
        scheduled_for: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
  useCreateEmailBlast: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
}));

jest.mock('@/lib/hooks/use-rsvp-stats', () => ({
  useRSVPStats: () => ({
    data: {
      total: 25,
      yes: 15,
      maybe: 6,
      no: 4,
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock the auth hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user1', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('Email Blast Integration Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('EmailBlastHistory', () => {
    it('displays email blast history', async () => {
      const { container } = render(<EmailBlastHistory eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/email blast history/i)).toBeInTheDocument();
      });

      // Check that the blast details are displayed
      expect(screen.getByText(/come join us!/i)).toBeInTheDocument();
      expect(screen.getByText(/sent/i)).toBeInTheDocument();
      expect(screen.getByText(/all recipients/i)).toBeInTheDocument();
    });

    it('shows loading state', async () => {
      const { useEmailBlasts } = require('@/lib/hooks/use-email-blasts');
      useEmailBlasts.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<EmailBlastHistory eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('handles empty history gracefully', async () => {
      const { useEmailBlasts } = require('@/lib/hooks/use-email-blasts');
      useEmailBlasts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<EmailBlastHistory eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/no email blasts sent/i)).toBeInTheDocument();
      });
    });

    it('displays formatted date and time', async () => {
      render(<EmailBlastHistory eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/january 1, 2025/i)).toBeInTheDocument();
      });
    });
  });

  describe('EmailBlastCompose', () => {
    it('displays RSVP statistics', async () => {
      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/25.*total/i)).toBeInTheDocument();
        expect(screen.getByText(/15.*yes/i)).toBeInTheDocument();
        expect(screen.getByText(/6.*maybe/i)).toBeInTheDocument();
        expect(screen.getByText(/4.*no/i)).toBeInTheDocument();
      });
    });

    it('allows selecting recipient filter', async () => {
      const user = userEvent.setup();

      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      // Find and interact with recipient filter dropdown
      const filterSelect =
        screen.getByRole('combobox', { name: /recipients/i }) ||
        screen.getByText(/all recipients/i);

      if (filterSelect) {
        await user.click(filterSelect);

        // Look for dropdown options
        await waitFor(() => {
          expect(screen.getByText(/yes only/i)).toBeInTheDocument();
        });

        await user.click(screen.getByText(/yes only/i));
        expect(screen.getByText(/15.*yes only/i)).toBeInTheDocument();
      }
    });

    it('allows composing and sending email blast', async () => {
      const mockCreateEmailBlast = jest.fn();
      const { useCreateEmailBlast } = require('@/lib/hooks/use-email-blasts');
      useCreateEmailBlast.mockReturnValue({
        mutate: mockCreateEmailBlast,
        isPending: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      // Type a message
      const messageInput =
        screen.getByPlaceholderText(/write your message/i) || screen.getByRole('textbox');

      if (messageInput) {
        await user.type(messageInput, "Don't forget to arrive on time!");
      }

      // Click send button
      const sendButton = screen.getByRole('button', { name: /send blast/i });
      expect(sendButton).toBeInTheDocument();

      await user.click(sendButton);

      // Verify the mutation was called with correct data
      expect(mockCreateEmailBlast).toHaveBeenCalledWith({
        eventId: 'event123',
        message: expect.stringContaining('arrive on time'),
        recipientFilter: 'all',
        scheduledFor: null,
      });
    });

    it('shows loading state during send operation', async () => {
      const { useCreateEmailBlast } = require('@/lib/hooks/use-email-blasts');
      useCreateEmailBlast.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null,
      });

      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { disabled: true }) || screen.getByText(/sending/i)
      ).toBeTruthy();
    });

    it('handles send errors gracefully', async () => {
      const { useCreateEmailBlast } = require('@/lib/hooks/use-email-blasts');
      useCreateEmailBlast.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: new Error('Failed to send email blast'),
      });

      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/failed to send/i) || screen.getByText(/error/i)).toBeTruthy();
    });

    it('validates message content before sending', async () => {
      const mockCreateEmailBlast = jest.fn();
      const { useCreateEmailBlast } = require('@/lib/hooks/use-email-blasts');
      useCreateEmailBlast.mockReturnValue({
        mutate: mockCreateEmailBlast,
        isPending: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      // Try to send without message
      const sendButton = screen.getByRole('button', { name: /send blast/i });
      expect(sendButton).toBeInTheDocument();

      // Button should be disabled or show validation error
      expect(sendButton).toBeDisabled();
    });

    it('displays character count for message', async () => {
      const user = userEvent.setup();

      render(<EmailBlastCompose eventId='event123' />, {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      const messageInput =
        screen.getByPlaceholderText(/write your message/i) || screen.getByRole('textbox');

      if (messageInput) {
        await user.type(messageInput, 'A'.repeat(100));

        // Look for character count display
        expect(screen.getByText(/100.*characters/i) || screen.getByText(/100\//)).toBeTruthy();
      }
    });
  });

  describe('Email Blast Integration', () => {
    it('connects history and compose components', async () => {
      // This test verifies that both components work together
      const { container } = render(
        <div>
          <EmailBlastHistory eventId='event123' />
          <EmailBlastCompose eventId='event123' />
        </div>,
        {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        }
      );

      await waitFor(() => {
        expect(screen.getByText(/email blast history/i)).toBeInTheDocument();
        expect(screen.getByText(/compose email blast/i)).toBeInTheDocument();
      });

      // Both components should be able to load without errors
      expect(screen.getByText(/25.*total/i)).toBeInTheDocument();
      expect(screen.getByText(/come join us!/i)).toBeInTheDocument();
    });

    it('updates history after sending new blast', async () => {
      const mockCreateEmailBlast = jest.fn();
      const { useCreateEmailBlast } = require('@/lib/hooks/use-email-blasts');
      useCreateEmailBlast.mockReturnValue({
        mutate: mockCreateEmailBlast,
        isPending: false,
        error: null,
      });

      const user = userEvent.setup();

      const { rerender } = render(
        <div>
          <EmailBlastHistory eventId='event123' />
          <EmailBlastCompose eventId='event123' />
        </div>,
        {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        }
      );

      await waitFor(() => {
        expect(screen.getByText(/email blast history/i)).toBeInTheDocument();
      });

      // Send a new email blast
      const messageInput = screen.getByPlaceholderText(/write your message/i);
      const sendButton = screen.getByRole('button', { name: /send blast/i });

      await user.type(messageInput, 'New announcement!');
      await user.click(sendButton);

      // Mock successful response
      mockCreateEmailBlast.mockImplementation(() => {
        // Simulate successful creation by updating the history data
        const { useEmailBlasts } = require('@/lib/hooks/use-email-blasts');
        useEmailBlasts.mockReturnValue({
          data: [
            {
              id: 'blast2',
              event_id: 'event123',
              user_id: 'user1',
              message: '<p>New announcement!</p>',
              recipient_filter: 'all',
              status: 'sent',
              scheduled_for: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'blast1',
              event_id: 'event123',
              user_id: 'user1',
              message: '<p>Come join us!</p>',
              recipient_filter: 'all',
              status: 'sent',
              scheduled_for: null,
              created_at: '2025-01-01T10:00:00Z',
              updated_at: '2025-01-01T10:00:00Z',
            },
          ],
          isLoading: false,
          error: null,
        });
      });

      // Re-render to pick up the updated data
      rerender(
        <div>
          <EmailBlastHistory eventId='event123' />
          <EmailBlastCompose eventId='event123' />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByText(/new announcement!/i)).toBeInTheDocument();
      });
    });
  });
});
