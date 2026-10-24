import type { EventRSVP } from '@/lib/types/api';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import EventDetailPageClient from '@/app/e/[id]/page-client';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSetTopBarForRoute = jest.fn();
const mockApplyRouteConfig = jest.fn();
const mockClearRoute = jest.fn();
const mockDeleteGalleryItem = jest.fn();
let mockGalleryData: any[] = [];
let mockHostsData: any[] = [];
let mockVisibilitySettings: Record<string, boolean> | null = null;
let mockUserRsvpStatus: EventRSVP['status'] | null = 'yes';
let mockEventRsvps: Array<Pick<EventRSVP, 'id' | 'status' | 'user_details'>> = [];

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
      visibility_settings: mockVisibilitySettings,
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
  useEventGallery: () => ({ data: mockGalleryData, isLoading: false }),
}));

jest.mock('@/lib/hooks/use-event-hosts', () => ({
  useEventHosts: () => ({ data: mockHostsData, isLoading: false }),
}));

jest.mock('@/lib/hooks/use-event-rsvps', () => ({
  useEventRSVPs: () => ({ data: mockEventRsvps }),
}));

jest.mock('@/lib/hooks/use-delete-gallery-item', () => ({
  useDeleteGalleryItem: () => ({ mutateAsync: mockDeleteGalleryItem }),
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
    data: mockUserRsvpStatus
      ? { status: mockUserRsvpStatus, rsvp: { id: 'rsvp-1' } }
      : { status: null, rsvp: null },
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
  default: ({ isEventHost }: { isEventHost: boolean }) => (
    <div data-testid='comments-section-content' data-is-event-host={String(isEventHost)}>
      Comments Section
    </div>
  ),
}));

jest.mock('@/components/event-detail/event-gallery', () => ({
  __esModule: true,
  default: ({
    galleryItems,
    isEventHost,
    onImageClick,
  }: {
    galleryItems: Array<{ id: string }>;
    isEventHost: boolean;
    onImageClick: (index: number) => void;
  }) => (
    <div data-testid='gallery-section-content' data-is-event-host={String(isEventHost)}>
      Gallery Section
      {galleryItems.length > 0 && (
        <button type='button' onClick={() => onImageClick(0)}>
          Open gallery photo
        </button>
      )}
    </div>
  ),
}));

jest.mock('@/components/event-detail/event-password-gate', () => ({
  EventPasswordGate: () => <div>Password Gate</div>,
}));

jest.mock('@/components/event-detail/save-event-sheet', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/lightbox-viewer', () => ({
  LightboxViewer: ({
    images,
    selectedImage,
    showDropdownMenu,
    handleDelete,
  }: {
    images: Array<{ id: string; image: string }>;
    selectedImage: number | null;
    showDropdownMenu: boolean;
    handleDelete: (photoId: string) => Promise<{ success: boolean }>;
  }) => (
    <div
      data-testid='event-gallery-lightbox'
      data-show-delete={String(showDropdownMenu)}
      data-selected-image-url={selectedImage === null ? 'none' : images[selectedImage].image}
    >
      {selectedImage !== null && (
        <button type='button' onClick={() => void handleDelete(images[selectedImage].id)}>
          Delete event gallery photo
        </button>
      )}
    </div>
  ),
}));

jest.mock('@/components/ui/animated-tabs', () => ({
  AnimatedTabs: ({
    tabs,
    selected,
  }: {
    tabs: Array<{ title: string; onClick?: () => void }>;
    selected?: number | null;
  }) => (
    <div>
      {tabs.map((tab, index) => (
        <button
          key={tab.title}
          onClick={tab.onClick}
          type='button'
          data-selected={selected === index ? 'true' : 'false'}
        >
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
    jest.useFakeTimers();
    jest.clearAllMocks();
    detailsScrollIntoView.mockClear();
    commentsScrollIntoView.mockClear();
    galleryScrollIntoView.mockClear();
    mockSearchParams.delete('tab');
    mockGalleryData = [];
    mockHostsData = [];
    mockVisibilitySettings = null;
    mockUserRsvpStatus = 'yes';
    mockEventRsvps = [];
    mockDeleteGalleryItem.mockResolvedValue({
      galleryItemId: 'photo-1',
      eventId: 'event-123',
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders details, comments, and gallery sections together on the same page', () => {
    render(<EventDetailPageClient />);

    expect(screen.getByTestId('details-section-content')).toBeInTheDocument();
    expect(screen.getByTestId('comments-section-content')).toBeInTheDocument();
    expect(screen.getByTestId('gallery-section-content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Photos' })).toBeInTheDocument();
  });

  it('tells RSVP-event viewers that some details are hidden until they RSVP', () => {
    mockUserRsvpStatus = null;
    mockVisibilitySettings = { hide_location_for_unapproved: true };

    render(<EventDetailPageClient />);

    expect(screen.getByText('Some event details are hidden until you RSVP.')).toBeInTheDocument();
  });

  it('hides the guest summary when the guest list is hidden for unapproved viewers', () => {
    mockUserRsvpStatus = null;
    mockVisibilitySettings = { hide_guest_list_for_unapproved: true };
    mockEventRsvps = [{ id: 'rsvp-2', status: 'yes', user_details: undefined }];

    render(<EventDetailPageClient />);

    expect(screen.queryByText('going')).not.toBeInTheDocument();
  });

  it('shows the going count and quick actions in the desktop summary card', () => {
    mockEventRsvps = [
      { id: 'rsvp-2', status: 'yes', user_details: undefined },
      { id: 'rsvp-3', status: 'no', user_details: undefined },
    ];

    render(<EventDetailPageClient />);

    expect(screen.getByText('going')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('passes cohost moderation through the main comment, gallery grid, and lightbox paths', () => {
    mockHostsData = [{ user_details: { id: 'user-1' } }];
    mockGalleryData = [
      {
        id: 'photo-1',
        url: '/eventos/gallery/photo.jpg',
        created_at: '2026-07-14T12:00:00.000Z',
        user_details: { id: 'uploader-1' },
        events: { id: 'event-123', title: 'Test Event' },
      },
    ];

    render(<EventDetailPageClient />);

    expect(screen.getByTestId('comments-section-content')).toHaveAttribute(
      'data-is-event-host',
      'true'
    );
    expect(screen.getByTestId('gallery-section-content')).toHaveAttribute(
      'data-is-event-host',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open gallery photo' }));
    expect(screen.getByTestId('event-gallery-lightbox')).toHaveAttribute(
      'data-show-delete',
      'true'
    );
    expect(screen.getByTestId('event-gallery-lightbox')).toHaveAttribute(
      'data-selected-image-url',
      'https://api.evento.so/storage/v1/object/public/cdn/eventos/gallery/photo.jpg?width=1200&quality=90'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete event gallery photo' }));
    expect(mockDeleteGalleryItem).toHaveBeenCalledWith({
      galleryItemId: 'photo-1',
      eventId: 'event-123',
    });
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

  it('returns the tab highlight to Details shortly after section navigation', async () => {
    render(<EventDetailPageClient />);

    Object.defineProperty(
      screen.getByText('Gallery Section').closest('section'),
      'scrollIntoView',
      {
        value: galleryScrollIntoView,
        configurable: true,
      }
    );

    const detailsTab = screen.getByRole('button', { name: 'Details' });
    const galleryTab = screen.getByRole('button', { name: 'Gallery' });

    fireEvent.click(galleryTab);

    expect(galleryTab).toHaveAttribute('data-selected', 'true');

    act(() => {
      jest.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(detailsTab).toHaveAttribute('data-selected', 'true');
    });
    expect(galleryTab).toHaveAttribute('data-selected', 'false');
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
