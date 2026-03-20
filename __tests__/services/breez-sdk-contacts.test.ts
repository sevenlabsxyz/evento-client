import { BreezSDKService } from '@/lib/services/breez-sdk';
import { AddContactRequest, Contact, UpdateContactRequest } from '@/lib/types/wallet';
import { BREEZ_ERROR_CONTEXT } from '@/lib/utils/breez-error-handler';

// Mock the breez-sdk-spark module
const mockSdk = {
  addContact: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn(),
  listContacts: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  getInfo: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

jest.mock('@breeztech/breez-sdk-spark/web', () => ({
  BreezSdk: jest.fn(),
  Config: {},
  Network: 'mainnet',
  Seed: {},
  ConnectRequest: {},
  EventListener: {},
  SdkEvent: {},
}));

// Mock breez-error-handler
jest.mock('@/lib/utils/breez-error-handler', () => ({
  BREEZ_ERROR_CONTEXT: {
    ADDING_CONTACT: 'adding contact',
    UPDATING_CONTACT: 'updating contact',
    DELETING_CONTACT: 'deleting contact',
    LISTING_CONTACTS: 'listing contacts',
    CONNECTING: 'connecting to Breez SDK',
  },
  getBreezErrorMessage: jest.fn((error, context) => `Failed to ${context}`),
  logBreezError: jest.fn(),
}));

// Mock the toast utility
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

describe('BreezSDKService - Contacts', () => {
  // Get a fresh instance for testing
  let service: BreezSDKService;

  const createMockContact = (overrides: Partial<Contact> = {}): Contact => ({
    id: 'contact_123',
    name: 'Alice',
    paymentIdentifier: 'alice@evento.cash',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  const createMockAddRequest = (overrides: Partial<AddContactRequest> = {}): AddContactRequest => ({
    name: 'Bob',
    paymentIdentifier: 'bob@evento.cash',
    ...overrides,
  });

  const createMockUpdateRequest = (
    overrides: Partial<UpdateContactRequest> = {}
  ): UpdateContactRequest => ({
    id: 'contact_123',
    name: 'Alice Updated',
    paymentIdentifier: 'alice@evento.cash',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a new instance for each test
    service = BreezSDKService.getInstance();
    // Access private sdk property for testing
    (service as any).sdk = mockSdk;
  });

  afterEach(() => {
    // Clean up
    (service as any).sdk = null;
  });

  describe('isConnected', () => {
    it('returns true when SDK is connected', () => {
      (service as any).sdk = mockSdk;
      expect(service.isConnected()).toBe(true);
    });

    it('returns false when SDK is not connected', () => {
      (service as any).sdk = null;
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('addContact', () => {
    it('adds a contact successfully', async () => {
      const mockRequest = createMockAddRequest();
      const mockContact = createMockContact({
        name: mockRequest.name,
        paymentIdentifier: mockRequest.paymentIdentifier,
      });
      mockSdk.addContact.mockResolvedValueOnce(mockContact);

      const result = await service.addContact(mockRequest);

      expect(mockSdk.addContact).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(mockContact);
    });

    it('throws error when SDK is not connected', async () => {
      (service as any).sdk = null;
      const mockRequest = createMockAddRequest();

      await expect(service.addContact(mockRequest)).rejects.toThrow('SDK not connected');
      expect(mockSdk.addContact).not.toHaveBeenCalled();
    });

    it('handles SDK error during add', async () => {
      const error = new Error('SDK error');
      mockSdk.addContact.mockRejectedValueOnce(error);
      const mockRequest = createMockAddRequest();

      await expect(service.addContact(mockRequest)).rejects.toThrow('Failed to add contact');
    });

    it('handles contact with special characters in name', async () => {
      const mockRequest = createMockAddRequest({
        name: 'Alice & Bob <test>',
      });
      const mockContact = createMockContact({
        name: 'Alice & Bob <test>',
      });
      mockSdk.addContact.mockResolvedValueOnce(mockContact);

      const result = await service.addContact(mockRequest);

      expect(mockSdk.addContact).toHaveBeenCalledWith(mockRequest);
      expect(result.name).toBe('Alice & Bob <test>');
    });

    it('handles contact with various Lightning address formats', async () => {
      const testCases = ['user@evento.cash', 'user@ln.tips', 'user@getalby.com', 'user@strike.me'];

      for (const address of testCases) {
        const mockRequest = createMockAddRequest({ paymentIdentifier: address });
        const mockContact = createMockContact({ paymentIdentifier: address });
        mockSdk.addContact.mockResolvedValueOnce(mockContact);

        const result = await service.addContact(mockRequest);
        expect(result.paymentIdentifier).toBe(address);
      }
    });
  });

  describe('updateContact', () => {
    it('updates a contact successfully', async () => {
      const mockRequest = createMockUpdateRequest();
      const mockContact = createMockContact({
        id: mockRequest.id,
        name: mockRequest.name,
        paymentIdentifier: mockRequest.paymentIdentifier,
      });
      mockSdk.updateContact.mockResolvedValueOnce(mockContact);

      const result = await service.updateContact(mockRequest);

      expect(mockSdk.updateContact).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(mockContact);
    });

    it('throws error when SDK is not connected for update', async () => {
      (service as any).sdk = null;
      const mockRequest = createMockUpdateRequest();

      await expect(service.updateContact(mockRequest)).rejects.toThrow('SDK not connected');
      expect(mockSdk.updateContact).not.toHaveBeenCalled();
    });

    it('handles SDK error during update', async () => {
      const error = new Error('SDK error');
      mockSdk.updateContact.mockRejectedValueOnce(error);
      const mockRequest = createMockUpdateRequest();

      await expect(service.updateContact(mockRequest)).rejects.toThrow('Failed to update contact');
    });

    it('updates contact name only', async () => {
      const mockRequest: UpdateContactRequest = {
        id: 'contact_123',
        name: 'New Name',
        paymentIdentifier: 'alice@evento.cash',
      };
      const mockContact = createMockContact({ name: 'New Name' });
      mockSdk.updateContact.mockResolvedValueOnce(mockContact);

      const result = await service.updateContact(mockRequest);
      expect(result.name).toBe('New Name');
    });

    it('updates contact payment identifier only', async () => {
      const mockRequest: UpdateContactRequest = {
        id: 'contact_123',
        name: 'Alice',
        paymentIdentifier: 'newalice@evento.cash',
      };
      const mockContact = createMockContact({ paymentIdentifier: 'newalice@evento.cash' });
      mockSdk.updateContact.mockResolvedValueOnce(mockContact);

      const result = await service.updateContact(mockRequest);
      expect(result.paymentIdentifier).toBe('newalice@evento.cash');
    });
  });

  describe('deleteContact', () => {
    it('deletes a contact successfully', async () => {
      const contactId = 'contact_123';
      mockSdk.deleteContact.mockResolvedValueOnce(undefined);

      await service.deleteContact(contactId);

      expect(mockSdk.deleteContact).toHaveBeenCalledWith(contactId);
    });

    it('throws error when SDK is not connected for delete', async () => {
      (service as any).sdk = null;
      const contactId = 'contact_123';

      await expect(service.deleteContact(contactId)).rejects.toThrow('SDK not connected');
      expect(mockSdk.deleteContact).not.toHaveBeenCalled();
    });

    it('handles SDK error during delete', async () => {
      const error = new Error('SDK error');
      mockSdk.deleteContact.mockRejectedValueOnce(error);
      const contactId = 'contact_123';

      await expect(service.deleteContact(contactId)).rejects.toThrow('Failed to delete contact');
    });

    it('handles non-existent contact deletion gracefully', async () => {
      const error = new Error('Contact not found');
      mockSdk.deleteContact.mockRejectedValueOnce(error);
      const contactId = 'non_existent';

      await expect(service.deleteContact(contactId)).rejects.toThrow();
    });
  });

  describe('listContacts', () => {
    it('lists contacts successfully', async () => {
      const mockContacts = [
        createMockContact({ id: 'contact_1', name: 'Alice' }),
        createMockContact({ id: 'contact_2', name: 'Bob' }),
      ];
      mockSdk.listContacts.mockResolvedValueOnce(mockContacts);

      const result = await service.listContacts();

      expect(mockSdk.listContacts).toHaveBeenCalledWith({});
      expect(result).toEqual(mockContacts);
    });

    it('lists contacts with pagination parameters', async () => {
      const mockContacts = [createMockContact({ id: 'contact_1' })];
      mockSdk.listContacts.mockResolvedValueOnce(mockContacts);

      const result = await service.listContacts({ offset: 0, limit: 10 });

      expect(mockSdk.listContacts).toHaveBeenCalledWith({ offset: 0, limit: 10 });
      expect(result).toEqual(mockContacts);
    });

    it('returns empty array when no contacts exist', async () => {
      mockSdk.listContacts.mockResolvedValueOnce([]);

      const result = await service.listContacts();

      expect(result).toEqual([]);
    });

    it('throws error when SDK is not connected for list', async () => {
      (service as any).sdk = null;

      await expect(service.listContacts()).rejects.toThrow('SDK not connected');
      expect(mockSdk.listContacts).not.toHaveBeenCalled();
    });

    it('handles SDK error during list', async () => {
      const error = new Error('SDK error');
      mockSdk.listContacts.mockRejectedValueOnce(error);

      await expect(service.listContacts()).rejects.toThrow('Failed to list contacts');
    });

    it('handles large contact lists', async () => {
      const mockContacts = Array.from({ length: 100 }, (_, i) =>
        createMockContact({ id: `contact_${i}`, name: `User ${i}` })
      );
      mockSdk.listContacts.mockResolvedValueOnce(mockContacts);

      const result = await service.listContacts();

      expect(result).toHaveLength(100);
    });
  });

  describe('error context constants', () => {
    it('has correct error context for adding contact', () => {
      expect(BREEZ_ERROR_CONTEXT.ADDING_CONTACT).toBe('adding contact');
    });

    it('has correct error context for updating contact', () => {
      expect(BREEZ_ERROR_CONTEXT.UPDATING_CONTACT).toBe('updating contact');
    });

    it('has correct error context for deleting contact', () => {
      expect(BREEZ_ERROR_CONTEXT.DELETING_CONTACT).toBe('deleting contact');
    });

    it('has correct error context for listing contacts', () => {
      expect(BREEZ_ERROR_CONTEXT.LISTING_CONTACTS).toBe('listing contacts');
    });
  });

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = BreezSDKService.getInstance();
      const instance2 = BreezSDKService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('edge cases', () => {
    it('handles contact with empty name', async () => {
      const mockRequest = createMockAddRequest({ name: '' });
      const mockContact = createMockContact({ name: '' });
      mockSdk.addContact.mockResolvedValueOnce(mockContact);

      const result = await service.addContact(mockRequest);
      expect(result.name).toBe('');
    });

    it('handles contact with very long name', async () => {
      const longName = 'A'.repeat(500);
      const mockRequest = createMockAddRequest({ name: longName });
      const mockContact = createMockContact({ name: longName });
      mockSdk.addContact.mockResolvedValueOnce(mockContact);

      const result = await service.addContact(mockRequest);
      expect(result.name).toBe(longName);
    });

    it('handles contact with unicode characters in name', async () => {
      const unicodeName = '用户 👤 用户';
      const mockRequest = createMockAddRequest({ name: unicodeName });
      const mockContact = createMockContact({ name: unicodeName });
      mockSdk.addContact.mockResolvedValueOnce(mockContact);

      const result = await service.addContact(mockRequest);
      expect(result.name).toBe(unicodeName);
    });

    it('handles contact with emoji in name', async () => {
      const emojiName = 'Alice 🎉 Bob 🚀';
      const mockRequest = createMockAddRequest({ name: emojiName });
      const mockContact = createMockContact({ name: emojiName });
      mockSdk.addContact.mockResolvedValueOnce(mockContact);

      const result = await service.addContact(mockRequest);
      expect(result.name).toBe(emojiName);
    });
  });
});
