import GuestsSheet from '@/components/event-detail/event-guests-sheet';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/zap/zap-sheet', () => ({
  ZapSheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/quick-profile-sheet', () => ({
  __esModule: true,
  default: ({ isOpen, user }: { isOpen: boolean; user: { username?: string } }) =>
    isOpen ? <div>Quick profile for {user.username}</div> : null,
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { username: 'host-user' },
  }),
}));

describe('GuestsSheet', () => {
  const defaultProps = {
    eventCreatorUserId: 'host-1',
    hostUserIds: ['host-1'],
  };

  const rsvps = [
    {
      id: 'rsvp-1',
      event_id: 'event-1',
      user_id: 'user-1',
      status: 'yes',
      created_at: '2026-03-24T00:00:00Z',
      updated_at: '2026-03-24T00:00:00Z',
      user_details: {
        id: 'user-1',
        username: 'alice',
        name: 'Alice',
        bio: '',
        image: '',
        verification_status: 'unverified',
        ln_address: 'alice@evento.cash',
      },
    },
  ] as any;

  it('does not nest interactive buttons inside the guest row', () => {
    const { container } = render(
      <GuestsSheet open={true} onOpenChange={jest.fn()} rsvps={rsvps} {...defaultProps} />
    );

    expect(container.querySelector('button button')).toBeNull();
  });

  it('opens the quick profile from the main guest row button', () => {
    render(<GuestsSheet open={true} onOpenChange={jest.fn()} rsvps={rsvps} {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open profile for @alice' }));

    expect(screen.getByText('Quick profile for alice')).toBeInTheDocument();
  });

  it('does not open the quick profile when the zap trigger is clicked', () => {
    render(<GuestsSheet open={true} onOpenChange={jest.fn()} rsvps={rsvps} {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]!);

    expect(screen.queryByText('Quick profile for alice')).not.toBeInTheDocument();
  });
});
