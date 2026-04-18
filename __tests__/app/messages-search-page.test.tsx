import { render, waitFor } from '@testing-library/react';
import UserSearchPage from '@/app/e/messages/search/page';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    back: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useRequireAuth: () => ({ isLoading: false }),
}));

describe('messages search page', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('redirects to the canonical messages route instead of rendering stale mock search UI', async () => {
    render(<UserSearchPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/e/messages');
    });
  });
});
