// import EventPage from '@/app/e/[id]/page';
// import { QueryClient } from '@tanstack/react-query';
// import { render, screen, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import { createTestWrapper } from '../setup/test-utils';

// // Mock the auth hook
// jest.mock('@/lib/hooks/use-auth', () => ({
//   useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
// }));

// // Mock the event details hook
// jest.mock('@/lib/hooks/use-event-details', () => ({
//   useEventDetails: () => ({
//     data: {
//       id: 'event123',
//       title: 'Test Event',
//       description: 'Test Description',
//       location: 'Test Location',
//       start_date_day: 1,
//       start_date_month: 1,
//       start_date_year: 2025,
//       start_date_hours: 10,
//       start_date_minutes: 0,
//       end_date_day: 1,
//       end_date_month: 1,
//       end_date_year: 2025,
//       end_date_hours: 12,
//       end_date_minutes: 0,
//       timezone: 'UTC',
//       visibility: 'public',
//       status: 'published',
//       cover: null,
//       host_id: 'user1',
//     },
//     isLoading: false,
//     error: null,
//   }),
// }));

// // Mock the RSVP hooks
// jest.mock('@/lib/hooks/use-upsert-rsvp', () => ({
//   useUpsertRSVP: () => ({
//     mutate: jest.fn(),
//     isPending: false,
//     error: null,
//   }),
// }));

// jest.mock('@/lib/hooks/use-event-rsvps', () => ({
//   useEventRSVPs: () => ({
//     data: [
//       {
//         id: 'rsvp1',
//         user_id: 'user1',
//         event_id: 'event123',
//         status: 'yes',
//         created_at: '2025-01-01T00:00:00Z',
//         updated_at: '2025-01-01T00:00:00Z',
//       },
//     ],
//     isLoading: false,
//     error: null,
//   }),
// }));

// jest.mock('@/lib/hooks/use-user-rsvp', () => ({
//   useUserRSVP: () => ({
//     data: null,
//     isLoading: false,
//     error: null,
//   }),
// }));

// describe('RSVP Integration Flow', () => {
//   let queryClient: QueryClient;

//   beforeEach(() => {
//     queryClient = new QueryClient({
//       defaultOptions: {
//         queries: { retry: false },
//         mutations: { retry: false },
//       },
//     });
//     jest.clearAllMocks();
//   });

//   it('displays event details and RSVP options', async () => {
//     const { container } = render(
//       <EventPage params={{ id: 'event123' }} searchParams={{}} />,
//       {
//         wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//       }
//     );

//     // Wait for the page to load
//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Check that event details are displayed
//     expect(screen.getByText('Test Description')).toBeInTheDocument();
//     expect(screen.getByText('Test Location')).toBeInTheDocument();

//     // Check that RSVP section exists
//     expect(screen.getByText(/RSVP/i)).toBeInTheDocument();
//   });

//   it('allows user to RSVP to event', async () => {
//     const mockUpsertRSVP = jest.fn();
//     const { useUpsertRSVP } = require('@/lib/hooks/use-upsert-rsvp');
//     useUpsertRSVP.mockReturnValue({
//       mutate: mockUpsertRSVP,
//       isPending: false,
//       error: null,
//     });

//     const user = userEvent.setup();

//     render(<EventPage params={{ id: 'event123' }} searchParams={{}} />, {
//       wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Find and click the RSVP button
//     const rsvpButton = screen.getByRole('button', { name: /rsvp/i });
//     expect(rsvpButton).toBeInTheDocument();

//     await user.click(rsvpButton);

//     // Verify the RSVP mutation was called
//     expect(mockUpsertRSVP).toHaveBeenCalledWith({
//       event_id: 'event123',
//       status: expect.any(String),
//     });
//   });

//   it('displays current RSVP status', async () => {
//     const { useUserRSVP } = require('@/lib/hooks/use-user-rsvp');
//     useUserRSVP.mockReturnValue({
//       data: {
//         id: 'rsvp1',
//         user_id: 'current_user',
//         event_id: 'event123',
//         status: 'yes',
//         created_at: '2025-01-01T00:00:00Z',
//         updated_at: '2025-01-01T00:00:00Z',
//       },
//       isLoading: false,
//       error: null,
//     });

//     render(<EventPage params={{ id: 'event123' }} searchParams={{}} />, {
//       wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Check that the user's current RSVP status is displayed
//     expect(screen.getByText(/you.*yes/i)).toBeInTheDocument();
//   });

//   it('displays RSVP count and breakdown', async () => {
//     const { useEventRSVPs } = require('@/lib/hooks/use-event-rsvps');
//     useEventRSVPs.mockReturnValue({
//       data: [
//         { id: 'rsvp1', status: 'yes', user_id: 'user1' },
//         { id: 'rsvp2', status: 'yes', user_id: 'user2' },
//         { id: 'rsvp3', status: 'maybe', user_id: 'user3' },
//         { id: 'rsvp4', status: 'no', user_id: 'user4' },
//       ],
//       isLoading: false,
//       error: null,
//     });

//     render(<EventPage params={{ id: 'event123' }} searchParams={{}} />, {
//       wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Check that RSVP counts are displayed
//     expect(screen.getByText(/2.*yes/i)).toBeInTheDocument();
//     expect(screen.getByText(/1.*maybe/i)).toBeInTheDocument();
//     expect(screen.getByText(/1.*no/i)).toBeInTheDocument();
//     expect(screen.getByText(/4.*total/i)).toBeInTheDocument();
//   });

//   it('handles RSVP update from existing status', async () => {
//     const mockUpsertRSVP = jest.fn();
//     const { useUpsertRSVP } = require('@/lib/hooks/use-upsert-rsvp');
//     useUpsertRSVP.mockReturnValue({
//       mutate: mockUpsertRSVP,
//       isPending: false,
//       error: null,
//     });

//     const { useUserRSVP } = require('@/lib/hooks/use-user-rsvp');
//     useUserRSVP.mockReturnValue({
//       data: {
//         id: 'rsvp1',
//         user_id: 'current_user',
//         event_id: 'event123',
//         status: 'maybe',
//         created_at: '2025-01-01T00:00:00Z',
//         updated_at: '2025-01-01T00:00:00Z',
//       },
//       isLoading: false,
//       error: null,
//     });

//     const user = userEvent.setup();

//     render(<EventPage params={{ id: 'event123' }} searchParams={{}} />, {
//       wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Find and click the change RSVP button
//     const changeRsvpButton = screen.getByRole('button', { name: /change/i });
//     expect(changeRsvpButton).toBeInTheDocument();

//     await user.click(changeRsvpButton);

//     // Verify the RSVP mutation was called with new status
//     expect(mockUpsertRSVP).toHaveBeenCalledWith({
//       event_id: 'event123',
//       status: expect.not.stringMatching('maybe'), // Should be different from current status
//     });
//   });

//   it('shows loading state during RSVP operation', async () => {
//     const { useUpsertRSVP } = require('@/lib/hooks/use-upsert-rsvp');
//     useUpsertRSVP.mockReturnValue({
//       mutate: jest.fn(),
//       isPending: true,
//       error: null,
//     });

//     render(<EventPage params={{ id: 'event123' }} searchParams={{}} />, {
//       wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Check that loading state is displayed
//     expect(
//       screen.getByText(/loading/i) ||
//         screen.getByRole('button', { name: /rsvp/i })
//     ).toBeTruthy();
//   });

//   it('handles RSVP errors gracefully', async () => {
//     const { useUpsertRSVP } = require('@/lib/hooks/use-upsert-rsvp');
//     useUpsertRSVP.mockReturnValue({
//       mutate: jest.fn(),
//       isPending: false,
//       error: new Error('RSVP failed'),
//     });

//     render(<EventPage params={{ id: 'event123' }} searchParams={{}} />, {
//       wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
//     });

//     await waitFor(() => {
//       expect(screen.getByText('Test Event')).toBeInTheDocument();
//     });

//     // Check that error state is displayed
//     expect(
//       screen.getByText(/failed/i) || screen.getByText(/error/i)
//     ).toBeTruthy();
//   });
// });
