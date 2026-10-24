import { render, screen } from '@testing-library/react';
import type { ImgHTMLAttributes } from 'react';

import HubPageClient from '@/app/e/hub/page-client';

const mockPush = jest.fn();
const mockUseHubData = jest.fn();
const mockUseMyCohostInvites = jest.fn();
const mockSetTopBarForRoute = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useRequireAuth: () => ({ isLoading: false }),
}));

jest.mock('@/lib/hooks/use-require-onboarding', () => ({
  useRequireOnboarding: () => ({ isLoading: false }),
}));

jest.mock('@/lib/hooks/use-hub-data', () => ({
  useHubData: () => mockUseHubData(),
}));

jest.mock('@/lib/hooks/use-cohost-invites', () => ({
  useMyCohostInvites: (status: string, enabled: boolean) => mockUseMyCohostInvites(status, enabled),
  useAcceptCohostInvite: () => ({ mutate: jest.fn(), isPending: false }),
  useRejectCohostInvite: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBar: () => ({
    applyRouteConfig: jest.fn(),
    setTopBarForRoute: mockSetTopBarForRoute,
    clearRoute: jest.fn(),
  }),
}));

jest.mock('@/components/hub/event-invites-sheet', () => ({
  EventInvitesSheet: () => null,
}));

jest.mock('@/components/hub/event-invite-detail-sheet', () => ({
  EventInviteDetailSheet: () => null,
}));

jest.mock('@/components/event-detail/event-rsvp-sheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/hub/get-started-card', () => ({
  GetStartedCard: () => <div data-testid='get-started-card' />,
}));

jest.mock('@/components/hub/my-events-section', () => ({
  MyEventsSection: () => <div data-testid='my-events-section' />,
}));

jest.mock('@/components/hub/discover-section', () => ({
  DiscoverSection: () => <div data-testid='discover-section' />,
}));

jest.mock('@/components/hub/hub-blog-gallery', () => ({
  HubBlogGallery: () => <div data-testid='hub-blog-gallery' />,
}));

jest.mock('@/components/hub/hub-blog-rail', () => ({
  HubBlogRail: () => <div data-testid='hub-blog-rail' />,
}));

jest.mock('@/components/hub/build-with-evento-card', () => ({
  BuildWithEventoCard: () => <div data-testid='build-with-evento-card' />,
}));

function emptyHubSection() {
  return {
    items: [],
    total_count: 0,
    has_more: false,
    error: undefined,
  };
}

function mockHub(overrides: Record<string, unknown> = {}) {
  mockUseHubData.mockReturnValue({
    data: {
      viewer: { id: 'user-1', username: 'alice', name: 'Alice Smith' },
      sections: {
        pending_cohost_invites: emptyHubSection(),
        my_upcoming_events: emptyHubSection(),
        discover_events: emptyHubSection(),
        pending_event_invites: emptyHubSection(),
        ...overrides,
      },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });
}

const fallbackCohostInvite = {
  id: 'invite-1',
  event_id: 'event-1',
  inviter_id: 'inviter-1',
  invitee_id: 'user-1',
  status: 'pending',
  message: null,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  events: {
    id: 'event-1',
    title: 'Fallback Cohost Event',
    location: 'Lisbon',
    cover: null,
  },
  inviter: {
    id: 'inviter-1',
    username: 'host',
    name: 'Host User',
    image: null,
    verification_status: null,
  },
};

describe('HubPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHub();
    mockUseMyCohostInvites.mockReturnValue({ data: [] });
  });

  it('hides the desktop header while keeping the mobile menu top bar', () => {
    render(<HubPageClient posts={[]} />);

    expect(mockSetTopBarForRoute).toHaveBeenCalledWith(
      '/e/hub',
      expect.objectContaining({
        desktopHidden: true,
        leftMode: 'menu',
        hideMobileBreadcrumb: true,
      })
    );
  });

  it('renders the greeting, layout sections, and empty up-next card', () => {
    render(<HubPageClient posts={[]} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening), Alice$/ })
    ).toBeInTheDocument();
    expect(screen.getByText('Nothing on your calendar this week')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find events/i })).toHaveAttribute('href', '/e/search');
    expect(screen.getByRole('link', { name: /create/i })).toHaveAttribute('href', '/e/create');

    expect(screen.getByTestId('get-started-card')).toBeInTheDocument();
    expect(screen.getByTestId('my-events-section')).toBeInTheDocument();
    expect(screen.getByTestId('discover-section')).toBeInTheDocument();
    expect(screen.getByTestId('hub-blog-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('hub-blog-rail')).toBeInTheDocument();
    expect(screen.getByTestId('build-with-evento-card')).toBeInTheDocument();
    expect(screen.getByText('No upcoming events')).toBeInTheDocument();
  });

  it('renders nothing for invites when there are no pending invites', () => {
    render(<HubPageClient posts={[]} />);

    expect(screen.queryByText('Needs your response')).not.toBeInTheDocument();
  });

  it('renders direct pending cohost invites when hub cohost items are empty', () => {
    mockUseMyCohostInvites.mockReturnValue({ data: [fallbackCohostInvite] });

    render(<HubPageClient posts={[]} />);

    expect(mockUseMyCohostInvites).toHaveBeenCalledWith('pending', true);
    expect(screen.getByText('Needs your response')).toBeInTheDocument();
    expect(screen.getByText('Fallback Cohost Event')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
  });

  it('shows the next upcoming event with host actions', () => {
    mockHub({
      my_upcoming_events: {
        ...emptyHubSection(),
        total_count: 1,
        items: [
          {
            id: 'event-9',
            title: 'Rooftop Mixer',
            location: 'Lisbon',
            cover: null,
            timezone: 'UTC',
            creator_user_id: 'user-1',
            start_date_year: 2099,
            start_date_month: 1,
            start_date_day: 15,
            start_date_hours: 19,
            start_date_minutes: 0,
            computed_start_date: '2099-01-15T19:00:00.000Z',
            computed_end_date: '2099-01-15T22:00:00.000Z',
          },
        ],
      },
    });

    render(<HubPageClient posts={[]} />);

    expect(screen.getByText('Rooftop Mixer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage/i })).toHaveAttribute(
      'href',
      '/e/event-9/manage'
    );
    expect(screen.getByRole('link', { name: /directions/i })).toBeInTheDocument();
  });
});
