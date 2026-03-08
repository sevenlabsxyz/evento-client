import { DateTimeActionsSheet } from '@/components/event-detail/date-time-actions-sheet';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({
    title,
    open,
    children,
  }: {
    title: string;
    open?: boolean;
    children: ReactNode;
  }) =>
    open ? (
      <div data-testid='master-sheet'>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

describe('DateTimeActionsSheet', () => {
  it('renders the two requested actions and closes after add to calendar', () => {
    const onOpenChange = jest.fn();
    const onAddToCalendar = jest.fn();
    const onCopyDateTime = jest.fn();

    render(
      <DateTimeActionsSheet
        open
        onOpenChange={onOpenChange}
        dateTimeText={'Tuesday, March 3\n7:00 PM - 9:00 PM GMT-3'}
        onAddToCalendar={onAddToCalendar}
        onCopyDateTime={onCopyDateTime}
      />
    );

    expect(screen.getByText('Add to Calendar')).toBeInTheDocument();
    expect(screen.getByText('Copy Date/Time')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add to Calendar'));

    expect(onAddToCalendar).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('copies date/time and closes the sheet', () => {
    const onOpenChange = jest.fn();
    const onAddToCalendar = jest.fn();
    const onCopyDateTime = jest.fn();

    render(
      <DateTimeActionsSheet
        open
        onOpenChange={onOpenChange}
        dateTimeText={'Tuesday, March 3\n7:00 PM - 9:00 PM GMT-3'}
        onAddToCalendar={onAddToCalendar}
        onCopyDateTime={onCopyDateTime}
      />
    );

    fireEvent.click(screen.getByText('Copy Date/Time'));

    expect(onCopyDateTime).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
