import TimePickerSheet from '@/components/create-event/time-picker-sheet';
import { act, fireEvent, render, within } from '@testing-library/react';

jest.mock('@/components/ui/detached-sheet', () => ({
  DetachedSheet: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Backdrop: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Handle: () => <div data-testid='detached-sheet-handle' />,
  },
}));

jest.mock('@/components/create-event/timezone-sheet', () => () => null);

describe('TimePickerSheet', () => {
  const originalScrollTo = HTMLElement.prototype.scrollTo;

  beforeEach(() => {
    jest.useFakeTimers();

    HTMLElement.prototype.scrollTo = function scrollTo(
      optionsOrX?: ScrollToOptions | number,
      y?: number
    ) {
      const top = typeof optionsOrX === 'number' ? (y ?? 0) : (optionsOrX?.top ?? 0);

      Object.defineProperty(this, 'scrollTop', {
        value: top,
        writable: true,
        configurable: true,
      });

      this.dispatchEvent(new Event('scroll'));
    };
  });

  afterEach(() => {
    HTMLElement.prototype.scrollTo = originalScrollTo;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('keeps the selected time stable when the sheet opens', () => {
    const { getByText } = render(
      <TimePickerSheet
        isOpen={true}
        onClose={jest.fn()}
        onTimeSelect={jest.fn()}
        onTimezoneSelect={jest.fn()}
        selectedTime={{ hour: 9, minute: 45, period: 'AM' }}
        timezone='America/Los_Angeles'
        title='Start Time'
      />
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(getByText('09:45 AM')).toBeInTheDocument();
  });

  it('updates the selected hour after user scrolling settles', () => {
    const { container, getByText } = render(
      <TimePickerSheet
        isOpen={true}
        onClose={jest.fn()}
        onTimeSelect={jest.fn()}
        onTimezoneSelect={jest.fn()}
        selectedTime={{ hour: 9, minute: 45, period: 'AM' }}
        timezone='America/Los_Angeles'
        title='Start Time'
      />
    );

    const [hourWheel] = Array.from(
      container.querySelectorAll('.scrollbar-hide')
    ) as HTMLDivElement[];

    act(() => {
      jest.advanceTimersByTime(500);
    });

    act(() => {
      Object.defineProperty(hourWheel, 'scrollTop', {
        value: 10 * 44,
        writable: true,
        configurable: true,
      });
      fireEvent.scroll(hourWheel);
      jest.advanceTimersByTime(500);
    });

    expect(getByText('11:45 AM')).toBeInTheDocument();
  });

  it('lets users click an hour directly', () => {
    const { container, getByText } = render(
      <TimePickerSheet
        isOpen={true}
        onClose={jest.fn()}
        onTimeSelect={jest.fn()}
        onTimezoneSelect={jest.fn()}
        selectedTime={{ hour: 9, minute: 45, period: 'AM' }}
        timezone='America/Los_Angeles'
        title='Start Time'
      />
    );

    const [hourWheel] = Array.from(
      container.querySelectorAll('.scrollbar-hide')
    ) as HTMLDivElement[];

    fireEvent.click(within(hourWheel).getByRole('button', { name: '10' }));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(getByText('10:45 AM')).toBeInTheDocument();
  });
});
