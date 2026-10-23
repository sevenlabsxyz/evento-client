import EventRemindersPage from '@/app/e/[id]/manage/reminders/page';
import {
  FOURTH_REMINDER_ERROR,
  useEventReminders,
  useUpdateEventReminders,
} from '@/lib/hooks/use-event-reminders';
import type { EventReminderOffset } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/e/evt_test123/manage/reminders',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'evt_test123' }),
}));

jest.mock('@/lib/hooks/use-event-reminders', () => {
  const actual = jest.requireActual('@/lib/hooks/use-event-reminders');
  return {
    ...actual,
    useEventReminders: jest.fn(),
    useUpdateEventReminders: jest.fn(),
  };
});

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBar: () => ({
    applyRouteConfig: jest.fn(),
    setTopBarForRoute: jest.fn(),
    clearRoute: jest.fn(),
  }),
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    custom: jest.fn(),
    dismiss: jest.fn(),
    clear: jest.fn(),
  },
}));

interface RemindersHookResult {
  data?: { offsets?: EventReminderOffset[]; available?: boolean };
  isLoading?: boolean;
  error?: { status?: number; message?: string } | null;
}

interface UpdateRemindersHookResult {
  mutateAsync: jest.Mock;
  isPending: boolean;
}

// Test doubles expose only the fields the page reads.
const mockUseEventReminders = useEventReminders as unknown as jest.MockedFunction<
  () => RemindersHookResult
>;
const mockUseUpdateEventReminders = useUpdateEventReminders as unknown as jest.MockedFunction<
  () => UpdateRemindersHookResult
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('EventRemindersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateEventReminders.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it('shows an empty state when no reminders are selected', () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: [] },
      isLoading: false,
      error: null,
    });

    render(<EventRemindersPage />);

    expect(screen.getByTestId('reminders-empty-state')).toHaveTextContent('No reminders scheduled');
    expect(screen.getByText(/guests who RSVP'd Yes/i)).toBeInTheDocument();
  });

  it('blocks a fourth reminder and shows an error', () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: ['1h', '2h', '1d'] },
      isLoading: false,
      error: null,
    });

    render(<EventRemindersPage />);

    fireEvent.click(screen.getByLabelText('3 days before'));

    expect(mockToast.error).toHaveBeenCalledWith(FOURTH_REMINDER_ERROR);
    expect(screen.getByLabelText('3 days before')).toHaveAttribute('aria-checked', 'false');
  });

  it('saves the selected offsets array to the API', async () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: [] },
      isLoading: false,
      error: null,
    });
    mockMutateAsync.mockResolvedValue({ offsets: ['8h', '1d'] });

    render(<EventRemindersPage />);

    fireEvent.click(screen.getByLabelText('8 hours before'));
    fireEvent.click(screen.getByLabelText('1 day before'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(['8h', '1d']);
    });
    expect(mockToast.success).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/e/evt_test123/manage');
  });

  it('keeps save disabled until an offset changes', async () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: ['1h'] },
      isLoading: false,
      error: null,
    });

    render(<EventRemindersPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });

  it('shows a coming-soon state when the reminders API is missing', () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: [], available: false },
      isLoading: false,
      error: null,
    });

    render(<EventRemindersPage />);

    expect(screen.getByTestId('reminders-unavailable')).toHaveTextContent('Reminders coming soon');
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('redirects non-hosts back to the event page', async () => {
    mockUseEventReminders.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 403, message: 'Only event hosts can manage guest reminders' },
    });

    render(<EventRemindersPage />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/e/evt_test123');
    });
  });

  it('explains when saving is not available yet', async () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: [] },
      isLoading: false,
      error: null,
    });
    mockMutateAsync.mockRejectedValue({ status: 404, message: 'Not found' });

    render(<EventRemindersPage />);

    fireEvent.click(screen.getByLabelText('8 hours before'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Guest reminders are not available yet. Please try again later.'
      );
    });
  });
});
