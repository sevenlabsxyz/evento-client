import { DiscoverSection } from '@/components/hub/discover-section';
import { EventWithUser } from '@/lib/types/api';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ImgHTMLAttributes, ReactNode } from 'react';

const mockUseFollowingEvents = jest.fn();
const mockUseForYouEvents = jest.fn();

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

jest.mock('@/lib/hooks/use-following-events', () => ({
  useFollowingEvents: (params: { enabled?: boolean }) => mockUseFollowingEvents(params),
}));

jest.mock('@/lib/hooks/use-for-you-events', () => ({
  useForYouEvents: (params: { enabled?: boolean }) => mockUseForYouEvents(params),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}));

jest.mock('@/components/ui/animated-tabs', () => ({
  AnimatedTabs: ({ tabs }: { tabs: Array<{ title: string; onClick?: () => void }> }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.title} type='button' onClick={tab.onClick}>
          {tab.title}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({
    open,
    title,
    children,
  }: {
    open?: boolean;
    title: string;
    children: ReactNode;
  }) =>
    open ? (
      <div role='dialog' aria-label={title}>
        {children}
      </div>
    ) : null,
}));

jest.mock('@/components/master-event-card', () => ({
  MasterEventCard: ({ event }: { event: { title: string } }) => <div>{event.title}</div>,
}));

const NOW = new Date('2026-10-22T12:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function makeEvent(id: string, title: string, startOffsetDays: number): EventWithUser {
  const start = new Date(NOW + startOffsetDays * DAY);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    id,
    title,
    description: '',
    cover: '',
    location: 'Somewhere',
    event_locations: {
      id: `loc-${id}`,
      name: null,
      address: null,
      city: 'Lisbon',
      state_province: null,
      country: null,
      latitude: null,
      longitude: null,
    },
    timezone: 'UTC',
    status: 'published',
    visibility: 'public',
    cost: null,
    creator_user_id: 'host-1',
    hosts: [],
    start_date_day: start.getUTCDate(),
    start_date_month: start.getUTCMonth() + 1,
    start_date_year: start.getUTCFullYear(),
    start_date_hours: start.getUTCHours(),
    start_date_minutes: start.getUTCMinutes(),
    end_date_day: end.getUTCDate(),
    end_date_month: end.getUTCMonth() + 1,
    end_date_year: end.getUTCFullYear(),
    end_date_hours: end.getUTCHours(),
    end_date_minutes: end.getUTCMinutes(),
    computed_start_date: start.toISOString(),
    computed_end_date: end.toISOString(),
    spotify_url: '',
    wavlake_url: '',
    contrib_cashapp: '',
    contrib_venmo: '',
    contrib_paypal: '',
    contrib_btclightning: '',
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
    user_details: {
      id: 'host-1',
      username: 'host',
      name: 'Host',
      image: '',
      verification_status: null,
    } as EventWithUser['user_details'],
  };
}

function idleQuery(data?: EventWithUser[]) {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  };
}

const discoverEvents = [
  makeEvent('e1', 'Tomorrow meetup', 1),
  makeEvent('e2', 'Weekend party', 4),
  makeEvent('e3', 'Next month summit', 30),
  makeEvent('e4', 'Far conference', 40),
  makeEvent('e5', 'Winter fair', 50),
  makeEvent('e6', 'Holiday market', 60),
  makeEvent('e7', 'New year gala', 70),
];

function renderSection(overrides: Partial<Parameters<typeof DiscoverSection>[0]> = {}) {
  return render(
    <DiscoverSection
      discoverEvents={discoverEvents}
      discoverHasMore
      discoverTotalCount={12}
      {...overrides}
    />
  );
}

describe('DiscoverSection', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    mockUseFollowingEvents.mockReturnValue(idleQuery());
    mockUseForYouEvents.mockReturnValue(idleQuery());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('renders a grid of 6 featured cards linking to the event page', () => {
    const { container } = renderSection();

    expect(container.querySelector('#discover')).not.toBeNull();
    expect(screen.getByText('Tomorrow meetup')).toBeInTheDocument();
    expect(screen.getByText('Holiday market')).toBeInTheDocument();
    expect(screen.queryByText('New year gala')).not.toBeInTheDocument();
    expect(screen.getByText('Tomorrow meetup').closest('a')).toHaveAttribute('href', '/e/e1');
    expect(screen.getAllByText('Lisbon')).toHaveLength(6);
  });

  it('filters to events starting within the next 7 days', () => {
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'This week' }));

    expect(screen.getByText('Tomorrow meetup')).toBeInTheDocument();
    expect(screen.getByText('Weekend party')).toBeInTheDocument();
    expect(screen.queryByText('Next month summit')).not.toBeInTheDocument();
  });

  it('explains when nothing starts this week', () => {
    renderSection({ discoverEvents: [makeEvent('later', 'Later event', 20)] });

    fireEvent.click(screen.getByRole('button', { name: 'This week' }));

    expect(screen.getByText('Nothing starting this week')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See featured' }));
    expect(screen.getByText('Later event')).toBeInTheDocument();
  });

  it('loads following events lazily and shows the follow empty state', () => {
    renderSection();

    expect(mockUseFollowingEvents).toHaveBeenLastCalledWith({ enabled: false });

    fireEvent.click(screen.getByRole('button', { name: 'Following' }));

    expect(mockUseFollowingEvents).toHaveBeenLastCalledWith({ enabled: true });
    expect(screen.getByText('Follow hosts to see their events here')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find hosts/i })).toHaveAttribute('href', '/e/search');
  });

  it('shows a skeleton while following events load', () => {
    mockUseFollowingEvents.mockReturnValue({ ...idleQuery(), isLoading: true });
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Following' }));

    expect(screen.getByTestId('discover-skeleton')).toBeInTheDocument();
  });

  it('shows the discover error message', () => {
    renderSection({ discoverEvents: [], discoverError: 'Discover is down' });

    expect(screen.getByRole('alert')).toHaveTextContent('Discover is down');
  });

  it('opens the full feed sheet with the complete featured list', () => {
    mockUseForYouEvents.mockImplementation(({ enabled }: { enabled?: boolean }) =>
      enabled
        ? idleQuery([
            makeEvent('f1', 'Featured only event', 10),
            makeEvent('old', 'Ended event', -3),
          ])
        : idleQuery()
    );
    renderSection();

    expect(mockUseForYouEvents).toHaveBeenLastCalledWith({ enabled: false });

    fireEvent.click(screen.getByRole('button', { name: /view all \(12\)/i }));

    expect(mockUseForYouEvents).toHaveBeenLastCalledWith({ enabled: true });
    const sheet = screen.getByRole('dialog', { name: 'Discover Feed' });
    expect(within(sheet).getByText('Featured only event')).toBeInTheDocument();
    expect(within(sheet).getByText('New year gala')).toBeInTheDocument();
    expect(within(sheet).queryByText('Ended event')).not.toBeInTheDocument();
  });

  it('opens the follow feed sheet when following has more than 6 events', () => {
    const following = Array.from({ length: 8 }, (_, index) =>
      makeEvent(`fo-${index}`, `Followed event ${index}`, index + 1)
    );
    mockUseFollowingEvents.mockReturnValue(idleQuery(following));
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Following' }));
    expect(screen.queryByText('Followed event 7')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view all \(8\)/i }));

    const sheet = screen.getByRole('dialog', { name: 'Follow Feed' });
    expect(within(sheet).getByText('Followed event 7')).toBeInTheDocument();
  });
});
