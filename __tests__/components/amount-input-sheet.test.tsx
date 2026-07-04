import { AmountInputSheet } from '@/components/wallet/amount-input-sheet';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

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
      <section>
        <h1>{title}</h1>
        {children}
      </section>
    ) : null,
}));

jest.mock('@/lib/hooks/use-wallet-payments', () => ({
  useAmountConverter: () => ({
    satsToUSD: jest.fn(async (sats: number) => sats / 100000),
    usdToSats: jest.fn(async (usd: number) => Math.round(usd * 100000)),
  }),
}));

describe('AmountInputSheet', () => {
  it('does not allow fractional sats before confirming', async () => {
    const onConfirm = jest.fn();

    render(<AmountInputSheet open={true} onOpenChange={jest.fn()} onConfirm={onConfirm} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /convert/i }));
    });

    expect(screen.queryByRole('button', { name: '.' })).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '1' }));
    });
    await act(async () => {
      fireEvent.keyDown(window, { key: '.' });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '5' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onConfirm).toHaveBeenCalledWith(15, false);
  });
});
