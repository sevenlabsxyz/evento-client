import { ZapNoWalletStep } from '@/components/zap/steps/zap-no-wallet-step';
import { fireEvent, render, screen } from '@testing-library/react';

describe('ZapNoWalletStep', () => {
  it('renders default state with both buttons', () => {
    const onClose = jest.fn();
    render(<ZapNoWalletStep onClose={onClose} />);

    expect(screen.getByText('Wallet Not Set Up')).toBeInTheDocument();
    expect(screen.getByText('Let them know')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('renders personalized heading with recipient name', () => {
    const onClose = jest.fn();
    const recipient = {
      name: 'Alice',
      username: 'alice',
      lightningAddress: '',
    };

    render(<ZapNoWalletStep onClose={onClose} recipient={recipient} />);

    expect(screen.getByText('Alice hasn\u2019t set up their wallet')).toBeInTheDocument();
  });

  it('calls onNotify when Let them know button is clicked', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} />);

    const notifyButton = screen.getByText('Let them know');
    fireEvent.click(notifyButton);

    expect(onNotify).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Close button is clicked', () => {
    const onClose = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isNotifying is true', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} isNotifying={true} />);

    expect(screen.getByText('Sending...')).toBeInTheDocument();

    const notifyButton = screen.getByText('Sending...').closest('button');
    expect(notifyButton).toBeDisabled();
  });

  it('shows success state when notifySuccess is true', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} notifySuccess={true} />);

    expect(screen.getByText('Notified')).toBeInTheDocument();

    const notifyButton = screen.getByText('Notified').closest('button');
    expect(notifyButton).toBeDisabled();
  });

  it('shows already notified state when alreadyNotified is true', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} alreadyNotified={true} />);

    expect(screen.getByText('Already Notified')).toBeInTheDocument();

    const notifyButton = screen.getByText('Already Notified').closest('button');
    expect(notifyButton).toBeDisabled();
  });

  it('disables notify button when onNotify is not provided', () => {
    const onClose = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} />);

    const notifyButton = screen.getByText('Let them know').closest('button');
    expect(notifyButton).toBeDisabled();
  });

  it('renders description text correctly', () => {
    const onClose = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} />);

    expect(
      screen.getByText(
        /This user hasn't set up their Evento Wallet yet. Let them know so they can start receiving Lightning payments!/
      )
    ).toBeInTheDocument();
  });

  it('renders Zap icon', () => {
    const onClose = jest.fn();
    const { container } = render(<ZapNoWalletStep onClose={onClose} />);

    // Check for the icon container
    const iconContainer = container.querySelector('.bg-gray-100');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not call onNotify when button is disabled', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} isNotifying={true} />);

    const notifyButton = screen.getByText('Sending...').closest('button');
    fireEvent.click(notifyButton!);

    expect(onNotify).not.toHaveBeenCalled();
  });

  it('applies correct button styles for success state', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} notifySuccess={true} />);

    const notifyButton = screen.getByText('Notified').closest('button');
    expect(notifyButton).toHaveClass('bg-emerald-600');
  });

  it('applies correct button styles for default state', () => {
    const onClose = jest.fn();
    const onNotify = jest.fn();

    render(<ZapNoWalletStep onClose={onClose} onNotify={onNotify} />);

    const notifyButton = screen.getByText('Let them know').closest('button');
    expect(notifyButton).toHaveClass('bg-gray-900');
  });
});
