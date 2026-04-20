import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { fireEvent, render, screen } from '@testing-library/react';
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

describe('NumericKeypad', () => {
  it('handles keyboard digits, deletion, and max-length completion', () => {
    const onNumberClick = jest.fn();
    const onDelete = jest.fn();
    const onComplete = jest.fn();

    const { rerender } = render(
      <NumericKeypad
        value=''
        onNumberClick={onNumberClick}
        onDelete={onDelete}
        onComplete={onComplete}
        showDecimal={false}
        maxLength={2}
      />
    );

    fireEvent.keyDown(window, { key: '1' });
    expect(onNumberClick).toHaveBeenCalledWith('1');

    rerender(
      <NumericKeypad
        value='1'
        onNumberClick={onNumberClick}
        onDelete={onDelete}
        onComplete={onComplete}
        showDecimal={false}
        maxLength={2}
      />
    );

    fireEvent.keyDown(window, { key: '2' });
    expect(onNumberClick).toHaveBeenNthCalledWith(2, '2');
    expect(onComplete).toHaveBeenCalledWith('12');

    rerender(
      <NumericKeypad
        value='12'
        onNumberClick={onNumberClick}
        onDelete={onDelete}
        onComplete={onComplete}
        showDecimal={false}
        maxLength={2}
      />
    );

    fireEvent.keyDown(window, { key: '3' });
    expect(onNumberClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: 'Backspace' });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('ignores keyboard input from editable elements', () => {
    const onNumberClick = jest.fn();

    render(
      <>
        <input aria-label='Editable field' />
        <NumericKeypad value='' onNumberClick={onNumberClick} onDelete={jest.fn()} />
      </>
    );

    fireEvent.keyDown(screen.getByLabelText('Editable field'), { key: '1' });

    expect(onNumberClick).not.toHaveBeenCalled();
  });
});
