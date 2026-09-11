import ManageEventPage from '@/app/e/[id]/manage/page';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { render, screen } from '@testing-library/react';

const mockRouterPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/e/evt_test123/manage',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'evt_test123' }),
}));

jest.mock('@/lib/hooks/use-event-details', () => ({
  useEventDetails: jest.fn(),
}));

jest.mock('@/lib/hooks/use-publish-event', () => ({
  usePublishEvent: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBar: () => ({
    applyRouteConfig: jest.fn(),
    setTopBarForRoute: jest.fn(),
    clearRoute: jest.fn(),
  }),
}));

const mockUseEventDetails = useEventDetails as jest.MockedFunction<typeof useEventDetails>;

describe('ManageEventPage reminders row', () => {
  it('lists Reminders as a manage section', () => {
    mockUseEventDetails.mockReturnValue({
      data: { id: 'evt_test123', title: 'Test Event', type: 'rsvp', status: 'published' },
      isLoading: false,
      error: null,
    } as any);

    render(<ManageEventPage />);

    expect(screen.getByText('Reminders')).toBeInTheDocument();
    expect(screen.getByText('Automatic emails to guests who RSVP Yes')).toBeInTheDocument();
  });
});
