import { render, screen } from '@testing-library/react';

import { CohostInviteCard } from '@/components/hub/cohost-invite-card';
import { CohostInvite } from '@/lib/types/api';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    const { src, alt, fill, ...rest } = props;
    return <img src={src} alt={alt} {...rest} />;
  },
}));

jest.mock('@/lib/hooks/use-cohost-invites', () => ({
  useAcceptCohostInvite: () => ({ mutate: jest.fn(), isPending: false }),
  useRejectCohostInvite: () => ({ mutate: jest.fn(), isPending: false }),
}));

describe('CohostInviteCard', () => {
  it('renders a functional fallback card when invite.events is missing', () => {
    const invite = {
      id: 'invite-1',
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

    render(<CohostInviteCard invite={invite} />);

    expect(screen.getByText('Event details unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/e/event-without-payload');
  });
});
