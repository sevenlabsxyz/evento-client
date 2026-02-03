import { useCheckUsername } from '@/lib/hooks/use-check-username';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockApiClient,
    apiClient: mockApiClient,
  };
});

import { apiClient } from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useCheckUsername', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const createMockResponse = (available: boolean, message?: string) => ({
    available,
    message,
  });

  describe('client-side validation', () => {
    it('validates minimum length requirement', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const shortUsernames = ['ab', 'a', ''];

      for (const username of shortUsernames) {
        let mutationResult: any;
        await act(async () => {
          mutationResult = await result.current.mutateAsync(username);
        });

        expect(mutationResult).toEqual({
          available: false,
          message: 'Username must be at least 3 characters',
        });
      }

      // API should not be called for invalid usernames
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('validates maximum length requirement', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const longUsername = 'a'.repeat(21); // 21 characters

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(longUsername);
      });

      expect(mutationResult).toEqual({
        available: false,
        message: 'Username must be less than 20 characters',
      });

      // API should not be called for invalid usernames
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('validates character requirements', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const invalidUsernames = [
        'user-name', // contains hyphen
        'user.name', // contains dot
        'user name', // contains space
        'user@name', // contains @
        'user#name', // contains #
        'user$name', // contains $
        'user%name', // contains %
        'user+name', // contains +
        'user=name', // contains =
        'user!name', // contains !
        'user?name', // contains ?
        'user/name', // contains /
        'user\\name', // contains backslash
        'user|name', // contains pipe
        'user<name', // contains <
        'user>name', // contains >
        'user[name', // contains [
        'user]name', // contains ]
        'user{name', // contains {
        'user}name', // contains }
        'user(name', // contains (
        'user)name', // contains )
        'user*name', // contains *
        'user&name', // contains &
        'user^name', // contains ^
        'user~name', // contains ~
        'user`name', // contains backtick
        'user"name', // contains quote
        "user'name", // contains apostrophe
        'user;name', // contains semicolon
        'user:name', // contains colon
        'user,name', // contains comma
      ];

      for (const username of invalidUsernames) {
        let mutationResult: any;
        await act(async () => {
          mutationResult = await result.current.mutateAsync(username);
        });

        expect(mutationResult).toEqual({
          available: false,
          message: 'Username can only contain letters, numbers, and underscores',
        });
      }

      // API should not be called for invalid usernames
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('allows valid characters', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const validUsernames = [
        'user123',
        'user_name',
        'User123',
        'USER123',
        'user',
        '123user',
        'user_123',
        'a1b2c3',
        'test_user_123',
        'validusername',
      ];

      // Mock API response for available username
      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      for (const username of validUsernames) {
        let mutationResult: any;
        await act(async () => {
          mutationResult = await result.current.mutateAsync(username);
        });

        expect(mutationResult.available).toBe(true);
      }

      // API should be called for each valid username
      expect(mockApiClient.get).toHaveBeenCalledTimes(validUsernames.length);
    });

    it('trims and converts username to lowercase', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      const testCases = [
        { input: '  USERNAME  ', expected: 'username' },
        { input: '  Username  ', expected: 'username' },
        { input: '  USER_NAME  ', expected: 'user_name' },
        { input: '  User123  ', expected: 'user123' },
      ];

      for (const testCase of testCases) {
        await act(async () => {
          await result.current.mutateAsync(testCase.input);
        });

        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/v1/user/check-username?username=${encodeURIComponent(testCase.expected)}`
        );
      }
    });
  });

  describe('API integration', () => {
    it('handles available username response', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const mockResponse = createMockResponse(true);
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('availableuser');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/user/check-username?username=availableuser'
      );
      expect(mutationResult).toEqual(mockResponse);
    });

    it('handles unavailable username response', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const mockResponse = createMockResponse(false, 'Username already taken');
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('takenuser');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/check-username?username=takenuser');
      expect(mutationResult).toEqual(mockResponse);
    });

    it('handles 404 error as available username', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const error404 = new Error('Not found');
      (error404 as any).status = 404;
      mockApiClient.get.mockRejectedValue(error404);

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('newuser');
      });

      expect(mutationResult).toEqual({
        available: true,
      });
    });

    it('handles other API errors as unavailable', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const serverError = new Error('Server error');
      (serverError as any).status = 500;
      mockApiClient.get.mockRejectedValue(serverError);

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('testuser');
      });

      expect(mutationResult).toEqual({
        available: false,
        message: 'Unable to check username availability',
      });
    });

    it('handles network errors as unavailable', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const networkError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(networkError);

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('testuser');
      });

      expect(mutationResult).toEqual({
        available: false,
        message: 'Unable to check username availability',
      });
    });

    it('handles empty response data', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({ data: null });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('testuser');
      });

      expect(mutationResult).toEqual({
        available: false,
      });
    });

    it('handles undefined response data', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({ data: undefined });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('testuser');
      });

      expect(mutationResult).toEqual({
        available: false,
      });
    });
  });

  describe('URL encoding', () => {
    it('properly encodes special characters in username', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      const specialUsernames = ['user_name', 'user123', 'test_user_123'];

      for (const username of specialUsernames) {
        await act(async () => {
          await result.current.mutateAsync(username);
        });

        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/v1/user/check-username?username=${encodeURIComponent(username)}`
        );
      }
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(controlledPromise);

      // Start mutation
      act(() => {
        result.current.mutate('testuser');
      });

      // Wait for the mutation to start and check status
      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ data: createMockResponse(true) });
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('handles API errors gracefully without throwing', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValue(apiError);

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync('testuser');
      });

      // The hook catches errors and returns a result instead of throwing
      expect(mutationResult).toEqual({
        available: false,
        message: 'Unable to check username availability',
      });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('handles multiple username checks', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      const usernames = ['user1', 'user2', 'user3'];

      for (const username of usernames) {
        await act(async () => {
          await result.current.mutateAsync(username);
        });
      }

      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
      expect(mockApiClient.get).toHaveBeenNthCalledWith(
        1,
        '/v1/user/check-username?username=user1'
      );
      expect(mockApiClient.get).toHaveBeenNthCalledWith(
        2,
        '/v1/user/check-username?username=user2'
      );
      expect(mockApiClient.get).toHaveBeenNthCalledWith(
        3,
        '/v1/user/check-username?username=user3'
      );
    });
  });

  describe('edge cases', () => {
    it('handles whitespace-only usernames', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const whitespaceUsernames = ['   ', '\t', '\n', ' \t \n '];

      for (const username of whitespaceUsernames) {
        let mutationResult: any;
        await act(async () => {
          mutationResult = await result.current.mutateAsync(username);
        });

        expect(mutationResult).toEqual({
          available: false,
          message: 'Username must be at least 3 characters',
        });
      }
    });

    it('handles usernames with only numbers', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      const numericUsernames = ['123', '123456', '999999'];

      for (const username of numericUsernames) {
        await act(async () => {
          await result.current.mutateAsync(username);
        });
      }

      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });

    it('handles usernames with only underscores', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      const underscoreUsernames = ['___', '_____', '_______'];

      for (const username of underscoreUsernames) {
        await act(async () => {
          await result.current.mutateAsync(username);
        });
      }

      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });

    it('handles mixed case usernames correctly', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      mockApiClient.get.mockResolvedValue({
        data: createMockResponse(true),
      });

      const mixedCaseUsernames = [
        'UserName',
        'USERNAME',
        'userName',
        'uSeRnAmE',
        'USER_name',
        'User_Name',
      ];

      for (const username of mixedCaseUsernames) {
        await act(async () => {
          await result.current.mutateAsync(username);
        });

        // All should be converted to lowercase
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/v1/user/check-username?username=${username.toLowerCase()}`
        );
      }
    });
  });
});
