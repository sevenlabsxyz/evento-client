import { GetStartedCard } from '@/components/hub/get-started-card';
import { UserDetails } from '@/lib/types/api';
import { render, screen } from '@testing-library/react';

const mockUseUserEvents = jest.fn();
const mockUseMyDraftEvents = jest.fn();
const mockUseUserFollowingCount = jest.fn();
const mockGetEncryptedSeed = jest.fn();
let mockWalletInitialized = false;

jest.mock('@/lib/hooks/use-user-events', () => ({
  useUserEvents: (params: unknown) => mockUseUserEvents(params),
}));

jest.mock('@/lib/hooks/use-my-draft-events', () => ({
  useMyDraftEvents: (params: unknown) => mockUseMyDraftEvents(params),
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useUserFollowingCount: (userId: string) => mockUseUserFollowingCount(userId),
}));

jest.mock('@/lib/services/wallet-storage', () => ({
  WalletStorageService: {
    getEncryptedSeed: () => mockGetEncryptedSeed(),
  },
}));

jest.mock('@/lib/stores/wallet-store', () => ({
  useWalletStore: <T,>(selector: (state: { walletState: { isInitialized: boolean } }) => T) =>
    selector({ walletState: { isInitialized: mockWalletInitialized } }),
}));

function eventsResult(totalCount: number, overrides: Record<string, unknown> = {}) {
  return {
    data: {
      pages: [
        {
          events: Array.from({ length: Math.min(totalCount, 1) }, (_, index) => ({
            id: `event-${index}`,
          })),
          pagination: { totalCount },
        },
      ],
    },
    isPending: false,
    isError: false,
    ...overrides,
  };
}

const newViewer = {
  id: 'user-1',
  username: 'newbie',
  name: 'New User',
  bio: '',
  image: '/assets/img/evento-sublogo.svg',
  verification_status: null,
} as unknown as UserDetails;

describe('GetStartedCard', () => {
  beforeEach(() => {
    mockWalletInitialized = false;
    mockGetEncryptedSeed.mockReturnValue(null);
    mockUseUserEvents.mockReturnValue(eventsResult(0));
    mockUseMyDraftEvents.mockReturnValue(eventsResult(0));
    mockUseUserFollowingCount.mockReturnValue({ data: 0, isPending: false, isError: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows all four steps for a brand-new user', () => {
    render(<GetStartedCard viewer={newViewer} />);

    expect(screen.getByText('0 of 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create your first event' })).toHaveAttribute(
      'href',
      '/e/create'
    );
    expect(screen.getByRole('link', { name: 'Follow hosts' })).toHaveAttribute('href', '/e/search');
    expect(screen.getByRole('link', { name: 'Set up your wallet' })).toHaveAttribute(
      'href',
      '/e/wallet'
    );
    expect(screen.getByRole('link', { name: 'Complete your profile' })).toHaveAttribute(
      'href',
      '/e/profile/edit'
    );
    expect(mockUseUserEvents).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'hosting', limit: 1, enabled: true })
    );
    expect(mockUseMyDraftEvents).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1, enabled: true })
    );
  });

  it('marks completed steps and counts progress', () => {
    mockUseMyDraftEvents.mockReturnValue(eventsResult(2));
    mockGetEncryptedSeed.mockReturnValue('v2|encrypted');

    render(<GetStartedCard viewer={newViewer} />);

    expect(screen.getByText('2 of 4')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Create your first event (completed)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Set up your wallet (completed)' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Follow hosts' })).toBeInTheDocument();
  });

  it('requires both a bio and a non-default avatar for a complete profile', () => {
    const { rerender } = render(
      <GetStartedCard viewer={{ ...newViewer, bio: 'Hello there' } as UserDetails} />
    );
    expect(screen.getByRole('link', { name: 'Complete your profile' })).toBeInTheDocument();

    rerender(
      <GetStartedCard
        viewer={
          { ...newViewer, bio: 'Hello there', image: 'https://cdn.example/me.png' } as UserDetails
        }
      />
    );
    expect(
      screen.getByRole('link', { name: 'Complete your profile (completed)' })
    ).toBeInTheDocument();
  });

  it('renders nothing while status queries are loading', () => {
    mockUseUserFollowingCount.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });

    const { container } = render(<GetStartedCard viewer={newViewer} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing once every step is done', () => {
    mockUseUserEvents.mockReturnValue(eventsResult(5));
    mockUseUserFollowingCount.mockReturnValue({ data: 3, isPending: false, isError: false });
    mockWalletInitialized = true;

    const { container } = render(
      <GetStartedCard
        viewer={
          {
            ...newViewer,
            bio: 'Host of things',
            image: 'https://cdn.example/me.png',
          } as UserDetails
        }
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a viewer', () => {
    const { container } = render(<GetStartedCard viewer={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
