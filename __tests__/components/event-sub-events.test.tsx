import { EventCompactItem } from '@/components/event-compact-item';
import EventSubEvents from '@/components/event-detail/event-sub-events';
import type { EventWithUser } from '@/lib/types/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockPush = jest.fn();
let mockIsMobile = false;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/hooks/use-media-query', () => ({
  useMediaQuery: () => ({
    isMobile: mockIsMobile,
    isTablet: false,
    isDesktop: !mockIsMobile,
    device: mockIsMobile ? 'mobile' : 'desktop',
  }),
}));

const subEvent = {
  id: 'evt_child',
  title: 'A long sub-event title that needs two lines before it is truncated',
  cover: null,
  location: 'São Paulo',
  timezone: 'America/Sao_Paulo',
  start_date_year: 2026,
  start_date_month: 7,
  start_date_day: 12,
  start_date_hours: 14,
  start_date_minutes: 0,
  end_date_year: 2026,
  end_date_month: 7,
  end_date_day: 12,
  end_date_hours: 15,
  end_date_minutes: 0,
  computed_start_date: '2026-07-12T17:00:00.000Z',
  computed_end_date: '2026-07-12T18:00:00.000Z',
  user_details: {
    id: 'usr_host',
    username: 'casa21',
    name: 'Casa21',
    image: null,
    verification_status: 'verified',
  },
} as unknown as EventWithUser;

function makeSubEvent(index: number, overrides: Partial<EventWithUser> = {}): EventWithUser {
  return {
    ...subEvent,
    id: `evt_child_${index}`,
    title: `Sub event ${index}`,
    start_date_hours: 8 + index,
    end_date_hours: 9 + index,
    computed_start_date: `2026-07-12T${(11 + index).toString().padStart(2, '0')}:00:00.000Z`,
    computed_end_date: `2026-07-12T${(12 + index).toString().padStart(2, '0')}:00:00.000Z`,
    ...overrides,
  };
}

function renderSubEvents(events: EventWithUser[], props: { isHost?: boolean } = {}) {
  return render(
    <EventSubEvents
      eventId='evt_parent'
      parentTimezone='America/Sao_Paulo'
      subEvents={events}
      subEventsLoading={false}
      subEventsError={null}
      {...props}
    />
  );
}

describe('EventSubEvents', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockIsMobile = false;
  });

  it('renders the clean sub-event card variant with a chevron and two-line title', () => {
    const { container } = renderSubEvents([subEvent]);

    expect(screen.getByText(subEvent.title)).toHaveClass('line-clamp-2');
    expect(container.querySelector('.lucide-chevron-right')).toBeInTheDocument();
    expect(container.querySelector('.lucide-ellipsis')).not.toBeInTheDocument();
    expect(screen.queryByText('São Paulo')).not.toBeInTheDocument();
    expect(screen.queryByText('@casa21')).not.toBeInTheDocument();
  });

  it('keeps the entire sub-event card navigating to the event page', () => {
    const { container } = renderSubEvents([subEvent]);

    const card = container.querySelector('.group');
    expect(card).not.toBeNull();
    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith('/e/evt_child');
  });

  it('makes sub-event card navigation keyboard accessible', () => {
    renderSubEvents([subEvent]);

    fireEvent.keyDown(screen.getByRole('link', { name: `View ${subEvent.title}` }), {
      key: 'Enter',
    });

    expect(mockPush).toHaveBeenCalledWith('/e/evt_child');
  });

  it('shows the first four cards with a fade, then expands and collapses the full list', () => {
    const events = Array.from({ length: 6 }, (_, index) => makeSubEvent(index + 1));
    const { container } = renderSubEvents(events);

    expect(container.querySelectorAll('.group')).toHaveLength(4);
    expect(screen.queryByText('Sub event 5')).not.toBeInTheDocument();
    expect(container.querySelector('.bg-gradient-to-t')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View all' }));

    expect(container.querySelectorAll('.group')).toHaveLength(6);
    expect(screen.getByText('Sub event 6')).toBeInTheDocument();
    expect(container.querySelector('.bg-gradient-to-t')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));

    expect(container.querySelectorAll('.group')).toHaveLength(4);
    expect(screen.queryByText('Sub event 5')).not.toBeInTheDocument();
  });

  it('does not show expansion controls for four or fewer cards', () => {
    renderSubEvents(Array.from({ length: 4 }, (_, index) => makeSubEvent(index + 1)));

    expect(screen.queryByRole('button', { name: 'View all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show less' })).not.toBeInTheDocument();
  });

  it('shows View Calendar for midnight but not for a missing start time', () => {
    const midnight = makeSubEvent(1, {
      start_date_hours: 0,
      start_date_minutes: 0,
      computed_start_date: '2026-07-12T03:00:00.000Z',
    });
    const { rerender } = renderSubEvents([midnight]);

    expect(screen.getByRole('button', { name: 'View Calendar' })).toBeInTheDocument();

    rerender(
      <EventSubEvents
        eventId='evt_parent'
        parentTimezone='America/Sao_Paulo'
        subEvents={[makeSubEvent(2, { start_date_hours: null as unknown as number })]}
        subEventsLoading={false}
        subEventsError={null}
      />
    );

    expect(screen.queryByRole('button', { name: 'View Calendar' })).not.toBeInTheDocument();
  });

  it('keeps calendar and host management actions available together', () => {
    renderSubEvents([subEvent], { isHost: true });

    expect(screen.getByRole('button', { name: 'View Calendar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Manage sub events' }));
    expect(mockPush).toHaveBeenCalledWith('/e/evt_parent/manage/sub-events');
  });

  it('opens the schedule and routes from a calendar event block', () => {
    renderSubEvents([subEvent]);

    fireEvent.click(screen.getByRole('button', { name: 'View Calendar' }));

    const dialog = screen.getByRole('dialog');
    const eventBlock = screen.getByRole('button', {
      name: new RegExp(subEvent.title),
    });
    expect(dialog).toHaveClass('rounded-3xl', 'sm:rounded-3xl');
    expect(screen.getByRole('heading', { name: 'Sub-Events Calendar' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('border', 'bg-gray-50');
    expect(eventBlock).toHaveClass('rounded-2xl');
    fireEvent.click(eventBlock);

    expect(mockPush).toHaveBeenCalledWith('/e/evt_child');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists untimed events under Time TBD when another event enables the calendar', () => {
    const untimed = makeSubEvent(2, {
      title: 'Waiting on a time',
      start_date_hours: null as unknown as number,
    });
    renderSubEvents([subEvent, untimed]);

    fireEvent.click(screen.getByRole('button', { name: 'View Calendar' }));

    expect(screen.getByText('Time TBD')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Waiting on a time, time to be determined' })
    );
    expect(mockPush).toHaveBeenCalledWith('/e/evt_child_2');
  });

  it('renders a full-screen mobile drawer with a working close button', async () => {
    mockIsMobile = true;
    renderSubEvents([subEvent]);

    fireEvent.click(screen.getByRole('button', { name: 'View Calendar' }));

    const drawer = screen
      .getByRole('heading', { name: 'Sub-Events Calendar' })
      .closest('[data-vaul-drawer]');
    const calendarContent = screen.getByTestId('sub-event-calendar-content');
    const calendarGrid = screen.getByTestId('sub-event-calendar-grid');
    expect(drawer).toHaveAttribute('data-state', 'open');
    expect(drawer).toHaveClass('rounded-t-3xl');
    expect(drawer?.querySelector('[data-vaul-handle]')).toBeInTheDocument();
    expect(calendarContent).toHaveAttribute('data-vaul-no-drag');
    expect(calendarGrid).toHaveClass(
      'overflow-auto',
      'overscroll-contain',
      '[touch-action:pan-x_pan-y]',
      '[-webkit-overflow-scrolling:touch]'
    );
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('border', 'bg-gray-50');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(drawer).toHaveAttribute('data-state', 'closed');
    });
  });
});

describe('EventCompactItem default variant', () => {
  it('preserves location and creator details outside the sub-event section', () => {
    render(<EventCompactItem event={subEvent} />);

    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(screen.getByText('@casa21')).toBeInTheDocument();
  });
});
