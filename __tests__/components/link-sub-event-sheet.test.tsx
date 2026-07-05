import LinkSubEventSheet from '@/components/manage-event/link-sub-event-sheet';
import { useLinkSubEvent } from '@/lib/hooks/use-link-sub-event';
import { useMyDraftEvents } from '@/lib/hooks/use-my-draft-events';
import { useUserEvents } from '@/lib/hooks/use-user-events';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({
    children,
    headerSecondary,
    open,
  }: {
    children: React.ReactNode;
    headerSecondary?: React.ReactNode;
    open?: boolean;
  }) =>
    open ? (
      <div>
        {headerSecondary}
        {children}
      </div>
    ) : null,
}));

jest.mock('@/lib/hooks/use-link-sub-event', () => ({
  useLinkSubEvent: jest.fn(),
}));

jest.mock('@/lib/hooks/use-my-draft-events', () => ({
  useMyDraftEvents: jest.fn(),
}));

jest.mock('@/lib/hooks/use-user-events', () => ({
  useUserEvents: jest.fn(),
}));

const mockUseLinkSubEvent = useLinkSubEvent as jest.MockedFunction<typeof useLinkSubEvent>;
const mockUseMyDraftEvents = useMyDraftEvents as jest.MockedFunction<typeof useMyDraftEvents>;
const mockUseUserEvents = useUserEvents as jest.MockedFunction<typeof useUserEvents>;

function createQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { pages: [{ events: [] }] },
    isLoading: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
    ...overrides,
  } as any;
}

describe('LinkSubEventSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLinkSubEvent.mockReturnValue({ mutateAsync: jest.fn() } as any);
    mockUseMyDraftEvents.mockReturnValue(createQuery());
  });

  it('keeps pagination available when loaded events are filtered out but more pages exist', () => {
    const fetchNextPage = jest.fn();
    mockUseUserEvents.mockReturnValue(
      createQuery({
        data: {
          pages: [
            {
              events: [
                { id: 'evt_parent' },
                { id: 'evt_linked' },
                { id: 'evt_child_with_parent', parent_event_id: 'evt_other_parent' },
              ],
            },
          ],
        },
        hasNextPage: true,
        fetchNextPage,
      })
    );

    render(
      <LinkSubEventSheet
        isOpen
        onClose={jest.fn()}
        parentEventId='evt_parent'
        linkedEventIds={['evt_linked']}
      />
    );

    expect(screen.getByText('No linkable events loaded yet')).toBeInTheDocument();
    expect(screen.queryByText('No events available to link')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /load more/i }));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('shows the terminal empty state when no more pages are available', () => {
    mockUseUserEvents.mockReturnValue(createQuery());

    render(
      <LinkSubEventSheet
        isOpen
        onClose={jest.fn()}
        parentEventId='evt_parent'
        linkedEventIds={[]}
      />
    );

    expect(screen.getByText('No events available to link')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });
});
