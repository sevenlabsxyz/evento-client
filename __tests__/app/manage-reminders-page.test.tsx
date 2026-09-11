import EventRemindersPage from '@/app/e/[id]/manage/reminders/page';
import {
  FOURTH_REMINDER_ERROR,
  toggleReminderOffset,
  useEventReminders,
  useUpdateEventReminders,
} from '@/lib/hooks/use-event-reminders';
import { toast } from '@/lib/utils/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockRouterPush = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
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

const mockUseEventReminders = useEventReminders as jest.MockedFunction<typeof useEventReminders>;
const mockUseUpdateEventReminders = useUpdateEventReminders as jest.MockedFunction<
  typeof useUpdateEventReminders
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('EventRemindersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateEventReminders.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  it('shows an empty state when no reminders are selected', () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: [] },
      isLoading: false,
      error: null,
    } as any);

    render(<EventRemindersPage />);

    expect(screen.getByTestId('reminders-empty-state')).toHaveTextContent('No reminders scheduled');
    expect(screen.getByText(/guests who RSVP'd Yes/i)).toBeInTheDocument();
  });

  it('blocks a fourth reminder and shows an error', () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: ['1h', '2h', '1d'] },
      isLoading: false,
      error: null,
    } as any);

    render(<EventRemindersPage />);

    fireEvent.click(screen.getByLabelText('3 days before'));

    expect(mockToast.error).toHaveBeenCalledWith(FOURTH_REMINDER_ERROR);
    expect(toggleReminderOffset(['1h', '2h', '1d'], '3d')).toEqual({
      offsets: ['1h', '2h', '1d'],
      error: FOURTH_REMINDER_ERROR,
    });
  });

  it('saves the selected offsets array to the API', async () => {
    mockUseEventReminders.mockReturnValue({
      data: { offsets: [] },
      isLoading: false,
      error: null,
    } as any);
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
});
