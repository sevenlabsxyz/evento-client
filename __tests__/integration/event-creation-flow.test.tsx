import CreatePage from '@/app/e/create/page';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestWrapper } from '../setup/test-utils';

// The page requires auth; mock it so we don't redirect during the test
jest.mock('@/lib/hooks/use-auth', () => ({
  useRequireAuth: () => ({ isLoading: false }),
}));

describe('Event Creation Flow', () => {
  it('creates and navigates to new event', async () => {
    const user = userEvent.setup();

    render(<CreatePage />, { wrapper: createTestWrapper() });

    // Fill title
    await user.type(screen.getByPlaceholderText(/enter event name/i), 'My Test Event');

    // Bypass UI: set location directly via store to satisfy validation
    await act(async () => {
      useEventFormStore.getState().setLocation({
        name: 'Moscone Center',
        address: '747 Howard St',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        zipCode: '94103',
        formatted: 'Moscone Center, 747 Howard St, San Francisco, CA 94103, United States',
      } as any);
    });

    // Create the event
    await user.click(screen.getByRole('button', { name: /create event/i }));

    // Wait for success modal
    await screen.findByText(/event created!/i);

    // Prepare router mock assertion before clicking navigation button
    const pushMock = (global as any).__routerPushMock as jest.Mock;
    pushMock.mockClear();

    // Click "View Event Page" which uses router.push
    await user.click(screen.getByRole('button', { name: /view event page/i }));

    // Assert router.push was called with the created event id from our axios mock
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/e/evt_test123');
    });
  });
});
