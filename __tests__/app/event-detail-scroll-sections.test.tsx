import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import EventDetailPageClient from '@/app/e/[id]/page-client';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSetTopBarForRoute = jest.fn();
const mockApplyRouteConfig = jest.fn();
const mockClearRoute = jest.fn();

const detailsScrollIntoView = jest.fn();
const commentsScrollIntoView = jest.fn();
const galleryScrollIntoView = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'event-123' }),
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
  usePathname: () => '/e/event-123',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, isAuthenticated: true }),
}));

jest.mock('@/lib/hooks/use-event-details', () => ({
  useEventDetails: () => ({
    data: {
      id: 'event-123',
      creator_user_id: 'creator-1',
      password_protected: false,
      visibility_settings: null,
      spotify_url: null,
      wavlake_url: null,
      type: 'rsvp',
      title: 'Test Event',
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/lib/hooks/use-event-gallery', () => ({
  useEventGallery: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/lib/hooks/use-event-hosts', () => ({
  useEventHosts: () => ({ data: [], isLoading: false }),
}));

jest.mock('@/lib/hooks/use-event-weather', () => ({
  useEventWeather: () => ({ weather: null, loading: false }),
}));

jest.mock('@/lib/hooks/use-my-registration', () => ({
  useMyRegistration: () => ({ data: null }),
}));

jest.mock('@/lib/hooks/use-registration-settings', () => ({
  useRegistrationSettings: () => ({ data: { registration_required: false } }),
}));

jest.mock('@/lib/hooks/use-sub-events', () => ({
  useSubEvents: () => ({ data: [], isLoading: false, error: null }),
}));

jest.mock('@/lib/hooks/use-upsert-rsvp', () => ({
  useUpsertRSVP: () => ({ isPending: false, isSuccess: false, mutate: jest.fn() }),
}));

jest.mock('@/lib/hooks/use-user-rsvp', () => ({
  useUserRSVP: () => ({
    data: { status: 'yes', rsvp: { id: 'rsvp-1' } },
    isLoading: false,
    isFetching: false,
  }),
}));

jest.mock('@/lib/stores/topbar-store', () => ({
  useTopBarStore: (selector: (state: any) => unknown) =>
    selector({
      setTopBarForRoute: mockSetTopBarForRoute,
      applyRouteConfig: mockApplyRouteConfig,
      clearRoute: mockClearRoute,
    }),
}));

jest.mock('@/lib/utils/event-transform', () => ({
  transformApiEventToDisplay: () => ({
    id: 'event-123',
    title: 'Test Event',
    has_campaign: false,
    galleryImages: ['gallery-1'],
    coverImages: ['cover-1'],
    location: { city: 'Las Vegas', country: 'USA', coordinates: null },
    computedStartDate: '2026-04-20T00:00:00Z',
  }),
}));

jest.mock('@/lib/utils/app-session', () => ({
  getInitialAppPath: () => '/e/event-123',
  hasAppNavigated: () => false,
  setInitialAppPath: jest.fn(),
}));

jest.mock('@/lib/utils/event-access', () => ({
  hasEventAccess: () => false,
}));

jest.mock('@/lib/utils/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }));
jest.mock('@/lib/utils/toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('@/components/event-detail/swipeable-header', () => ({
  __esModule: true,
  default: () => <div>Swipeable Header</div>,
}));

jest.mock('@/components/event-detail/event-info', () => ({
  __esModule: true,
  default: () => <div>Event Info</div>,
}));

jest.mock('@/components/event-detail/event-host', () => ({
  __esModule: true,
  default: () => <div data-testid='details-section-content'>Details Section</div>,
}));

jest.mock('@/components/event-detail/event-campaign-card', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/event-detail/event-contributions', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/event-detail/event-description', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/event-detail/event-guests-section', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/event-detail/event-sub-events', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/event-detail/event-location', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/event-detail/event-spotify-embed', () => ({
  EventSpotifyEmbed: () => null,
}));

jest.mock('@/components/event-detail/event-wavlake-embed', () => ({
  WavlakeEmbed: () => null,
}));

jest.mock('@/components/event-detail/event-comments', () => ({
  __esModule: true,
  default: () => <div data-testid='comments-section-content'>Comments Section</div>,
}));

jest.mock('@/components/event-detail/event-gallery', () => ({
  __esModule: true,
  default: () => <div data-testid='gallery-section-content'>Gallery Section</div>,
}));

jest.mock('@/components/event-detail/event-password-gate', () => ({
  EventPasswordGate: () => <div>Password Gate</div>,
}));

jest.mock('@/components/event-detail/save-event-sheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/lightbox-viewer', () => ({
  LightboxViewer: () => null,
}));

jest.mock('@/components/ui/animated-tabs', () => ({
  AnimatedTabs: ({ tabs }: { tabs: Array<{ title: string; onClick?: () => void }> }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.title} onClick={tab.onClick} type='button'>
          {tab.title}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: { variant: () => <div>Loading...</div> },
}));

describe('EventDetailPageClient section scrolling tabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    detailsScrollIntoView.mockClear();
    commentsScrollIntoView.mockClear();
    galleryScrollIntoView.mockClear();
    mockSearchParams.delete('tab');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders details, comments, and gallery sections together on the same page', () => {
    render(<EventDetailPageClient />);

    expect(screen.getByTestId('details-section-content')).toBeInTheDocument();
    expect(screen.getByTestId('comments-section-content')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-section-content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument();
  });

  it('preserves a deep-linked non-default tab on first render', async () => {
    mockSearchParams.set('tab', 'gallery');

    render(<EventDetailPageClient />);

    Object.defineProperty(
      screen.getByText('Gallery Section').closest('section'),
      'scrollIntoView',
      {
        value: galleryScrollIntoView,
        configurable: true,
      }
    );

    await waitFor(() => {
      expect(galleryScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    expect(mockReplace).not.toHaveBeenCalledWith('/e/event-123', { scroll: false });
  });

  it('scrolls to the requested section instead of swapping page content when a tab is clicked', async () => {
    render(<EventDetailPageClient />);

    Object.defineProperty(
      screen.getByText('Details Section').closest('section'),
      'scrollIntoView',
      {
        value: detailsScrollIntoView,
        configurable: true,
      }
    );
    Object.defineProperty(
      screen.getByText('Comments Section').closest('section'),
      'scrollIntoView',
      {
        value: commentsScrollIntoView,
        configurable: true,
      }
    );
    Object.defineProperty(
      screen.getByText('Gallery Section').closest('section'),
      'scrollIntoView',
      {
        value: galleryScrollIntoView,
        configurable: true,
      }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));

    expect(galleryScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/e/event-123?tab=gallery', { scroll: false });
    });

    expect(screen.getByTestId('details-section-content')).toBeInTheDocument();
    expect(screen.getByTestId('comments-section-content')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-section-content')).toBeInTheDocument();
  });
});
