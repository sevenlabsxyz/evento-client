import { ZapCustomStep } from '@/components/zap/steps/zap-custom-step';
import { render, screen } from '@testing-library/react';
import type { ButtonHTMLAttributes } from 'react';

jest.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileTap,
      transition,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & {
      whileTap?: unknown;
      transition?: unknown;
    }) => <button {...props}>{children}</button>,
  },
}));

jest.mock('@/components/wallet/wallet-balance-display', () => ({
  WalletBalanceDisplay: () => <div data-testid='wallet-balance' />,
}));

const defaultProps = {
  customAmount: '',
  customAmountUSD: '',
  inputMode: 'sats' as const,
  isPreparing: false,
  onNumberClick: jest.fn(),
  onDelete: jest.fn(),
  onToggleMode: jest.fn(),
  onConfirm: jest.fn(),
  onBack: jest.fn(),
  onClose: jest.fn(),
};

describe('ZapCustomStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides decimal input and disables confirmation for fractional sats', () => {
    render(<ZapCustomStep {...defaultProps} customAmount='1.5' customAmountUSD='0.01' />);

    expect(screen.queryByRole('button', { name: '.' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('keeps decimal input available in USD mode', () => {
    render(
      <ZapCustomStep {...defaultProps} customAmount='1500' customAmountUSD='0.50' inputMode='usd' />
    );

    expect(screen.getByRole('button', { name: '.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });
});
