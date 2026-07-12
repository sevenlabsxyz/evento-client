import EventSubEvents from '@/components/event-detail/event-sub-events';
import type { EventWithUser } from '@/lib/types/api';
import { fireEvent, render, screen } from '@testing-library/react';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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
  computed_start_date: '2026-07-12T17:00:00.000Z',
  user_details: {
    id: 'usr_host',
    username: 'casa21',
    name: 'Casa21',
    image: null,
    verification_status: 'verified',
  },
} as unknown as EventWithUser;

describe('EventSubEvents', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders sub-event cards with a chevron and a two-line title', () => {
    const { container } = render(
      <EventSubEvents
        eventId='evt_parent'
        subEvents={[subEvent]}
        subEventsLoading={false}
        subEventsError={null}
      />
    );

    expect(screen.getByText(subEvent.title)).toHaveClass('line-clamp-2');
    expect(container.querySelector('.lucide-chevron-right')).toBeInTheDocument();
    expect(container.querySelector('.lucide-ellipsis')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the entire sub-event card navigating to the event page', () => {
    const { container } = render(
      <EventSubEvents
        eventId='evt_parent'
        subEvents={[subEvent]}
        subEventsLoading={false}
        subEventsError={null}
      />
    );

    const card = container.querySelector('.group');
    expect(card).not.toBeNull();
    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith('/e/evt_child');
  });
});
