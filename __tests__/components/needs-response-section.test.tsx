import { fireEvent, render, screen } from '@testing-library/react';
import type { ImgHTMLAttributes } from 'react';

import { NeedsResponseSection } from '@/components/hub/needs-response-section';
import { CohostInvite, EventInvite } from '@/lib/types/api';

const mockPush = jest.fn();
const mockAccept = jest.fn();
const mockReject = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={typeof src === 'string' ? src : ''} alt={alt} />
  ),
}));

jest.mock('@/lib/hooks/use-cohost-invites', () => ({
  useAcceptCohostInvite: () => ({ mutate: mockAccept, isPending: false }),
  useRejectCohostInvite: () => ({ mutate: mockReject, isPending: false }),
}));

jest.mock('@/components/hub/event-invites-sheet', () => ({
  EventInvitesSheet: ({ showInvitesSheet }: { showInvitesSheet: boolean }) =>
    showInvitesSheet ? <div role='dialog' aria-label='All invites' /> : null,
}));

jest.mock('@/components/hub/event-invite-detail-sheet', () => ({
  EventInviteDetailSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role='dialog' aria-label='Invite details' /> : null,
}));

jest.mock('@/components/event-detail/event-rsvp-sheet', () => ({
  __esModule: true,
  default: ({ eventId }: { eventId: string }) => (
    <div role='dialog' aria-label={`RSVP ${eventId}`} />
  ),
}));

const cohostInviteWithoutEvent = {
  id: 'cohost-1',
  event_id: 'event-without-payload',
  inviter_id: 'inviter-1',
  invitee_id: 'user-1',
  status: 'pending',
  message: null,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
  events: undefined,
  inviter: {
    id: 'inviter-1',
    username: 'host',
    name: 'Host User',
    image: null,
    verification_status: null,
  },
} as unknown as CohostInvite;

function makeEventInvite(id: string): EventInvite {
  return {
    id,
    event_id: `event-${id}`,
    inviter_id: 'inviter-2',
    invitee_id: 'user-1',
    invitee_email: '',
    message: '',
    status: 'pending',
    response: null,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    events: {
      id: `event-${id}`,
      title: `Party ${id}`,
      cover: undefined,
      location: 'Porto',
      timezone: 'UTC',
      start_date_year: 2026,
      start_date_month: 11,
      start_date_day: 7,
      start_date_hours: 20,
      start_date_minutes: 0,
      computed_start_date: '2026-11-07T20:00:00.000Z',
      user_details: { id: 'inviter-2', username: 'dj', name: 'DJ Friend', image: '' },
    },
  } as unknown as EventInvite;
}

describe('NeedsResponseSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when there are no invites and no errors', () => {
    const { container } = render(
      <NeedsResponseSection cohostInvites={[]} eventInvites={[]} eventInvitesTotalCount={0} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a functional cohost card when invite.events is missing', () => {
    render(
      <NeedsResponseSection
        cohostInvites={[cohostInviteWithoutEvent]}
        eventInvites={[]}
        eventInvitesTotalCount={0}
      />
    );

    expect(screen.getByText('Needs your response')).toBeInTheDocument();
    expect(screen.getByText('Event details unavailable')).toBeInTheDocument();
    expect(screen.getByText('Host User')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /event details unavailable/i })).toHaveAttribute(
      'href',
      '/e/event-without-payload'
    );

    fireEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(mockReject).toHaveBeenCalledWith('cohost-1');

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(mockAccept).toHaveBeenCalledWith('cohost-1', expect.any(Object));
  });

  it('caps visible cards at six, counts the total, and opens the full invites sheet', () => {
    const eventInvites = Array.from({ length: 7 }, (_, index) => makeEventInvite(`${index + 1}`));

    render(
      <NeedsResponseSection
        cohostInvites={[]}
        eventInvites={eventInvites}
        eventInvitesTotalCount={9}
      />
    );

    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /rsvp/i })).toHaveLength(6);
    expect(screen.queryByText('Party 7')).not.toBeInTheDocument();
    expect(screen.getAllByText('DJ Friend')).toHaveLength(6);

    fireEvent.click(screen.getByRole('button', { name: /see all/i }));
    expect(screen.getByRole('dialog', { name: 'All invites' })).toBeInTheDocument();
  });

  it('opens the RSVP sheet and links View to the event page', () => {
    render(
      <NeedsResponseSection
        cohostInvites={[]}
        eventInvites={[makeEventInvite('1')]}
        eventInvitesTotalCount={1}
      />
    );

    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/e/event-1');

    fireEvent.click(screen.getByRole('button', { name: /rsvp/i }));
    expect(screen.getByRole('dialog', { name: 'RSVP event-1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /party 1/i }));
    expect(screen.getByRole('dialog', { name: 'Invite details' })).toBeInTheDocument();
  });

  it('shows section errors even when lists are empty', () => {
    render(
      <NeedsResponseSection
        cohostInvites={[]}
        cohostInvitesError='Cohost service down'
        eventInvites={[]}
        eventInvitesTotalCount={null}
      />
    );

    expect(screen.getByText('Cohost service down')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /see all/i })).not.toBeInTheDocument();
  });
});
