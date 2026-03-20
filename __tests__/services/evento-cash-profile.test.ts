import { EventoCashProfileService } from '@/lib/services/evento-cash-profile';

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

const mockApiClientTyped = apiClient as jest.Mocked<typeof apiClient>;

describe('EventoCashProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProfile', () => {
    it('returns profile for valid @evento.cash address', async () => {
      const mockUserDetails = {
        id: 'user123',
        username: 'alice',
        name: 'Alice Smith',
        bio: 'Test bio',
        image: 'https://example.com/alice.jpg',
        verification_status: null,
      };

      mockApiClientTyped.get.mockResolvedValue(mockUserDetails);

      const result = await EventoCashProfileService.fetchProfile('alice@evento.cash');

      expect(result).toEqual({
        username: 'alice',
        displayName: 'Alice Smith',
        avatar: 'https://example.com/alice.jpg',
      });
      expect(mockApiClientTyped.get).toHaveBeenCalledWith('/v1/users/username/alice');
    });

    it('returns null for non-@evento.cash addresses', async () => {
      const result = await EventoCashProfileService.fetchProfile('alice@walletofsatoshi.com');

      expect(result).toBeNull();
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('returns null for plain usernames without domain', async () => {
      const result = await EventoCashProfileService.fetchProfile('alice');

      expect(result).toBeNull();
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('returns null for empty string', async () => {
      const result = await EventoCashProfileService.fetchProfile('');

      expect(result).toBeNull();
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('returns null for @evento.cash with empty username', async () => {
      const result = await EventoCashProfileService.fetchProfile('@evento.cash');

      expect(result).toBeNull();
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('handles 404 error gracefully by returning null', async () => {
      const notFoundError = { status: 404, message: 'User not found' };
      mockApiClientTyped.get.mockRejectedValue(notFoundError);

      const result = await EventoCashProfileService.fetchProfile('nonexistent@evento.cash');

      expect(result).toBeNull();
      expect(mockApiClientTyped.get).toHaveBeenCalledWith('/v1/users/username/nonexistent');
    });

    it('handles network errors gracefully by returning null', async () => {
      const networkError = new Error('Network error');
      mockApiClientTyped.get.mockRejectedValue(networkError);

      const result = await EventoCashProfileService.fetchProfile('alice@evento.cash');

      expect(result).toBeNull();
      expect(mockApiClientTyped.get).toHaveBeenCalledWith('/v1/users/username/alice');
    });

    it('handles 500 server errors gracefully by returning null', async () => {
      const serverError = { status: 500, message: 'Internal server error' };
      mockApiClientTyped.get.mockRejectedValue(serverError);

      const result = await EventoCashProfileService.fetchProfile('alice@evento.cash');

      expect(result).toBeNull();
    });

    it('handles null response from API gracefully', async () => {
      mockApiClientTyped.get.mockResolvedValue(null);

      const result = await EventoCashProfileService.fetchProfile('alice@evento.cash');

      expect(result).toBeNull();
    });

    it('correctly extracts username from various @evento.cash formats', async () => {
      const mockUserDetails = {
        id: 'user123',
        username: 'testuser',
        name: 'Test User',
        bio: '',
        image: 'test.jpg',
        verification_status: null,
      };

      mockApiClientTyped.get.mockResolvedValue(mockUserDetails);

      // Test with different valid formats
      const testCases = [
        { input: 'user1@evento.cash', expectedUsername: 'user1' },
        { input: 'user_name@evento.cash', expectedUsername: 'user_name' },
        { input: 'User123@evento.cash', expectedUsername: 'User123' },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        mockApiClientTyped.get.mockResolvedValue(mockUserDetails);

        await EventoCashProfileService.fetchProfile(testCase.input);

        expect(mockApiClientTyped.get).toHaveBeenCalledWith(
          `/v1/users/username/${testCase.expectedUsername}`
        );
      }
    });
  });
});
