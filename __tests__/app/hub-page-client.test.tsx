import { render, screen, within } from '@testing-library/react';

import HubPageClient from '@/app/e/hub/page-client';

const mockPush = jest.fn();
const mockUseHubData = jest.fn();
const mockUseMyCohostInvites = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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
    setTopBarForRoute: jest.fn(),
    clearRoute: jest.fn(),
  }),
}));

jest.mock('@/components/hub/my-events-section', () => ({
  MyEventsSection: () => <div data-testid='my-events-section' />,
}));

jest.mock('@/components/hub/for-you-section', () => ({
  ForYouSection: () => <div data-testid='for-you-section' />,
}));

jest.mock('@/components/hub/event-invites-section', () => ({
  EventInvitesSection: () => <div data-testid='event-invites-section' />,
}));

jest.mock('@/components/hub/hub-blog-gallery', () => ({
  HubBlogGallery: () => <div data-testid='hub-blog-gallery' />,
}));

function emptyHubSection() {
  return {
    items: [],
    total_count: 0,
    has_more: false,
    error: undefined,
  };
}

describe('HubPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHubData.mockReturnValue({
      data: {
        viewer: { id: 'user-1', username: 'alice' },
        sections: {
          pending_cohost_invites: emptyHubSection(),
          my_upcoming_events: emptyHubSection(),
          discover_events: emptyHubSection(),
          pending_event_invites: emptyHubSection(),
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseMyCohostInvites.mockReturnValue({
      data: [
        {
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
        },
      ],
    });
  });

  it('renders direct pending cohost invites when hub cohost items are empty', () => {
    render(<HubPageClient posts={[]} />);

    expect(mockUseMyCohostInvites).toHaveBeenCalledWith('pending', true);
    expect(screen.getByText('Cohost Invitations')).toBeInTheDocument();
    expect(screen.getByText('Fallback Cohost Event')).toBeInTheDocument();

    const section = screen.getByText('Cohost Invitations').closest('div')!;
    expect(within(section).getByText('1')).toBeInTheDocument();
  });
});
