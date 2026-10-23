import { MyEventsSection } from '@/components/hub/my-events-section';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockUseIsMobile = jest.fn();
const mockUseUserProfile = jest.fn();
const mockUseUserEvents = jest.fn();
const mockUseMyDraftEvents = jest.fn();

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

jest.mock('@/lib/hooks/use-user-events', () => ({
  useUserEvents: (params: unknown) => mockUseUserEvents(params),
}));

jest.mock('@/lib/hooks/use-my-draft-events', () => ({
  useMyDraftEvents: (params: unknown) => mockUseMyDraftEvents(params),
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

jest.mock('@/components/circled-icon-button', () => ({
  CircledIconButton: ({ onClick }: { onClick?: () => void }) => (
    <button type='button' onClick={onClick}>
      Search
    </button>
  ),
}));

jest.mock('@/components/master-event-card', () => ({
  MasterEventCard: ({ event }: { event: { title: string } }) => <div>{event.title}</div>,
}));

jest.mock('@/components/event-search-sheet', () => ({
  __esModule: true,
  default: ({
    isOpen,
  }: {
    isOpen: boolean;
    onClose: () => void;
    username?: string;
    isOwnProfile?: boolean;
    initialFilter?: string;
  }) => (isOpen ? <div>Sheet Open</div> : null),
}));

function createInfiniteResult(events: unknown[]) {
  return {
    data: {
      pages: [
        {
          events,
          pagination: {
            totalCount: events.length,
            totalPages: 1,
            currentPage: 1,
            limit: 6,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      ],
    },
    isLoading: false,
  };
}

describe('MyEventsSection', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
    mockUseUserProfile.mockReturnValue({
      user: {
        username: 'andre',
      },
    });
    mockUseUserEvents.mockReturnValue(createInfiniteResult([]));
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-22T12:00:00Z').getTime());
    mockUseMyDraftEvents.mockImplementation(({ enabled }: { enabled?: boolean }) =>
      enabled
        ? createInfiniteResult([
            {
              id: 'draft-1',
              title: 'Draft without date',
              computed_start_date: null,
              start_date_year: null,
              start_date_month: null,
              start_date_day: null,
              start_date_hours: null,
              start_date_minutes: null,
              timezone: 'America/Los_Angeles',
              user_details: {
                id: 'user-1',
                username: 'andre',
                name: 'Andre',
                image: null,
                verification_status: null,
              },
            },
          ])
        : createInfiniteResult([])
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('renders drafts with missing dates without crashing', async () => {
    render(<MyEventsSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Drafts' }));

    await waitFor(() => {
      expect(screen.getByText('No date set')).toBeInTheDocument();
    });

    expect(screen.getByText('Draft without date')).toBeInTheDocument();
  });
});

it('requests past events when the Past tab is selected', async () => {
  render(<MyEventsSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Past' }));

  await waitFor(() => {
    expect(mockUseUserEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'upcoming',
        timeframe: 'past',
        sortBy: 'date-desc',
        enabled: true,
      })
    );
  });
});

it('shows the empty state for the Past tab when there are no past events', async () => {
  render(<MyEventsSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Past' }));

  await waitFor(() => {
    expect(screen.getByText('No past events')).toBeInTheDocument();
  });
  expect(screen.getByText('Events you hosted or attended will appear here')).toBeInTheDocument();
});

it('groups past events oldest-to-newest under date headers', async () => {
  mockUseUserEvents.mockImplementation((params: { timeframe?: string }) =>
    params?.timeframe === 'past'
      ? createInfiniteResult([
          { id: 'newer', title: 'Newer Pinned Hike', computed_start_date: '2026-10-05T10:00:00Z' },
          {
            id: 'older',
            title: 'Older Rooftop Dinner',
            computed_start_date: '2026-09-01T10:00:00Z',
          },
        ])
      : createInfiniteResult([])
  );

  render(<MyEventsSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Past' }));

  await waitFor(() => {
    expect(screen.getByText('Older Rooftop Dinner')).toBeInTheDocument();
  });

  const older = screen.getByText('Older Rooftop Dinner');
  const newer = screen.getByText('Newer Pinned Hike');
  expect(older.compareDocumentPosition(newer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
