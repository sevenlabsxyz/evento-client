import { useContacts } from '@/lib/hooks/use-contacts';
import { AddContactRequest, Contact, UpdateContactRequest } from '@/lib/types/wallet';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock breez-error-handler
jest.mock('@/lib/utils/breez-error-handler', () => ({
  BREEZ_ERROR_CONTEXT: {
    ADDING_CONTACT: 'adding contact',
    UPDATING_CONTACT: 'updating contact',
    DELETING_CONTACT: 'deleting contact',
    LISTING_CONTACTS: 'listing contacts',
  },
  getBreezErrorMessage: jest.fn((error: any, context?: string) => `Failed to ${context}`),
  logBreezError: jest.fn(),
}));

// Mock breezSDK service - define mock object inside the callback
jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    isConnected: jest.fn(),
    addContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
    listContacts: jest.fn(),
  },
}));

// Mock contacts store - define mock inside the callback
jest.mock('@/lib/stores/contacts-store', () => {
  const mockState = {
    contacts: [],
    isLoading: false,
    error: null,
    searchQuery: '',
  };

  return {
    useContactsStore: jest.fn(() => ({
      ...mockState,
      setContacts: jest.fn((contacts: any[]) => {
        mockState.contacts = contacts;
      }),
      setLoading: jest.fn((loading: boolean) => {
        mockState.isLoading = loading;
      }),
      setError: jest.fn((error: string | null) => {
        mockState.error = error;
      }),
      setSearchQuery: jest.fn(),
      addContact: jest.fn(),
      updateContact: jest.fn(),
      removeContact: jest.fn(),
    })),
  };
});

import { breezSDK } from '@/lib/services/breez-sdk';
import { getBreezErrorMessage, logBreezError } from '@/lib/utils/breez-error-handler';
import { toast } from 'sonner';

const mockToast = toast as jest.Mocked<typeof toast>;
const mockBreezSDK = breezSDK as jest.Mocked<typeof breezSDK>;
const mockGetBreezErrorMessage = getBreezErrorMessage as jest.MockedFunction<
  typeof getBreezErrorMessage
>;
const mockLogBreezError = logBreezError as jest.MockedFunction<typeof logBreezError>;

describe('useContacts', () => {
  let queryClient: QueryClient;

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
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockBreezSDK.isConnected.mockReturnValue(true);
  });

  describe('list contacts (query)', () => {
    it('fetches contacts successfully', async () => {
      const mockContacts = [
        createMockContact({ id: 'contact_1', name: 'Alice' }),
        createMockContact({ id: 'contact_2', name: 'Bob' }),
      ];
      mockBreezSDK.listContacts.mockResolvedValueOnce(mockContacts);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockBreezSDK.listContacts).toHaveBeenCalled();
      expect(result.current.contacts).toEqual(mockContacts);
    });

    it('returns empty array when wallet not connected', async () => {
      mockBreezSDK.isConnected.mockReturnValue(false);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockBreezSDK.listContacts).not.toHaveBeenCalled();
      expect(result.current.contacts).toEqual([]);
    });

    it('handles list contacts error', async () => {
      const error = new Error('Failed to list contacts');
      mockBreezSDK.listContacts.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockLogBreezError).toHaveBeenCalledWith(error, 'listing contacts');
    });
  });

  describe('add contact (mutation)', () => {
    it('adds a contact successfully', async () => {
      const mockRequest = createMockAddRequest();
      const mockContact = createMockContact({
        id: 'contact_new',
        name: mockRequest.name,
        paymentIdentifier: mockRequest.paymentIdentifier,
      });
      mockBreezSDK.addContact.mockResolvedValueOnce(mockContact);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.addContactAsync(mockRequest);
      });

      expect(mockBreezSDK.addContact).toHaveBeenCalledWith(mockRequest);
      expect(mockToast.success).toHaveBeenCalledWith('Contact added');
    });

    it('prevents duplicate contact with same paymentIdentifier', async () => {
      // First, set up the query to return an existing contact
      const existingContact = createMockContact({
        paymentIdentifier: 'alice@evento.cash',
      });
      mockBreezSDK.listContacts.mockResolvedValueOnce([existingContact]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for contacts to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const duplicateRequest = createMockAddRequest({
        paymentIdentifier: 'alice@evento.cash',
      });

      await act(async () => {
        try {
          await result.current.addContactAsync(duplicateRequest);
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error.message).toBe('Contact already exists with this Lightning address');
        }
      });

      expect(mockBreezSDK.addContact).not.toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith(
        'Contact already exists with this Lightning address'
      );
    });

    it('throws error when wallet not connected', async () => {
      mockBreezSDK.isConnected.mockReturnValue(false);

      const mockRequest = createMockAddRequest();

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.addContactAsync(mockRequest);
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error.message).toBe('Wallet not connected');
        }
      });

      expect(mockBreezSDK.addContact).not.toHaveBeenCalled();
    });

    it('handles add contact error', async () => {
      const error = new Error('Failed to add contact');
      mockBreezSDK.addContact.mockRejectedValueOnce(error);

      const mockRequest = createMockAddRequest();

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.addContactAsync(mockRequest);
          fail('Should have thrown error');
        } catch (error) {
          // Expected
        }
      });

      expect(mockLogBreezError).toHaveBeenCalledWith(error, 'adding contact');
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('tracks adding state correctly', async () => {
      const mockRequest = createMockAddRequest();
      const mockContact = createMockContact();

      let resolvePromise: (value: Contact) => void;
      const controlledPromise = new Promise<Contact>((resolve) => {
        resolvePromise = resolve;
      });
      mockBreezSDK.addContact.mockReturnValue(controlledPromise as any);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.addContact(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isAddingContact).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockContact);
      });

      await waitFor(() => {
        expect(result.current.isAddingContact).toBe(false);
      });
    });
  });

  describe('update contact (mutation)', () => {
    it('updates a contact successfully', async () => {
      const mockRequest = createMockUpdateRequest();
      const mockContact = createMockContact({
        name: mockRequest.name,
        paymentIdentifier: mockRequest.paymentIdentifier,
      });
      mockBreezSDK.updateContact.mockResolvedValueOnce(mockContact);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.updateContactAsync(mockRequest);
      });

      expect(mockBreezSDK.updateContact).toHaveBeenCalledWith(mockRequest);
      expect(mockToast.success).toHaveBeenCalledWith('Contact updated');
    });

    it('throws error when wallet not connected for update', async () => {
      mockBreezSDK.isConnected.mockReturnValue(false);

      const mockRequest = createMockUpdateRequest();

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.updateContactAsync(mockRequest);
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error.message).toBe('Wallet not connected');
        }
      });

      expect(mockBreezSDK.updateContact).not.toHaveBeenCalled();
    });

    it('handles update contact error', async () => {
      const error = new Error('Failed to update contact');
      mockBreezSDK.updateContact.mockRejectedValueOnce(error);

      const mockRequest = createMockUpdateRequest();

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.updateContactAsync(mockRequest);
          fail('Should have thrown error');
        } catch (error) {
          // Expected
        }
      });

      expect(mockLogBreezError).toHaveBeenCalledWith(error, 'updating contact');
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('tracks updating state correctly', async () => {
      const mockRequest = createMockUpdateRequest();
      const mockContact = createMockContact();

      let resolvePromise: (value: Contact) => void;
      const controlledPromise = new Promise<Contact>((resolve) => {
        resolvePromise = resolve;
      });
      mockBreezSDK.updateContact.mockReturnValue(controlledPromise as any);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.updateContact(mockRequest);
      });

      await waitFor(() => {
        expect(result.current.isUpdatingContact).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockContact);
      });

      await waitFor(() => {
        expect(result.current.isUpdatingContact).toBe(false);
      });
    });
  });

  describe('delete contact (mutation)', () => {
    it('deletes a contact successfully', async () => {
      const contactId = 'contact_123';
      mockBreezSDK.deleteContact.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.deleteContactAsync(contactId);
      });

      expect(mockBreezSDK.deleteContact).toHaveBeenCalledWith(contactId);
      expect(mockToast.success).toHaveBeenCalledWith('Contact deleted');
    });

    it('throws error when wallet not connected for delete', async () => {
      mockBreezSDK.isConnected.mockReturnValue(false);

      const contactId = 'contact_123';

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.deleteContactAsync(contactId);
          fail('Should have thrown error');
        } catch (error: any) {
          expect(error.message).toBe('Wallet not connected');
        }
      });

      expect(mockBreezSDK.deleteContact).not.toHaveBeenCalled();
    });

    it('handles delete contact error', async () => {
      const error = new Error('Failed to delete contact');
      mockBreezSDK.deleteContact.mockRejectedValueOnce(error);

      const contactId = 'contact_123';

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.deleteContactAsync(contactId);
          fail('Should have thrown error');
        } catch (error) {
          // Expected
        }
      });

      expect(mockLogBreezError).toHaveBeenCalledWith(error, 'deleting contact');
      expect(mockToast.error).toHaveBeenCalled();
    });

    it('tracks deleting state correctly', async () => {
      const contactId = 'contact_123';

      let resolvePromise: () => void;
      const controlledPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockBreezSDK.deleteContact.mockReturnValue(controlledPromise as any);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.deleteContact(contactId);
      });

      await waitFor(() => {
        expect(result.current.isDeletingContact).toBe(true);
      });

      await act(async () => {
        resolvePromise!();
      });

      await waitFor(() => {
        expect(result.current.isDeletingContact).toBe(false);
      });
    });
  });

  describe('findContactByAddress', () => {
    it('finds contact by Lightning address', async () => {
      const contact1 = createMockContact({
        id: 'contact_1',
        paymentIdentifier: 'alice@evento.cash',
      });
      const contact2 = createMockContact({
        id: 'contact_2',
        paymentIdentifier: 'bob@evento.cash',
      });
      mockBreezSDK.listContacts.mockResolvedValueOnce([contact1, contact2]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.findContactByAddress('alice@evento.cash');
      expect(found).toEqual(contact1);
    });

    it('returns undefined when contact not found', async () => {
      const contact1 = createMockContact({
        paymentIdentifier: 'alice@evento.cash',
      });
      mockBreezSDK.listContacts.mockResolvedValueOnce([contact1]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.findContactByAddress('unknown@evento.cash');
      expect(found).toBeUndefined();
    });

    it('returns undefined when contacts list is empty', async () => {
      mockBreezSDK.listContacts.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const found = result.current.findContactByAddress('any@evento.cash');
      expect(found).toBeUndefined();
    });
  });

  describe('refreshContacts', () => {
    it('refetches contacts when called', async () => {
      const mockContacts = [createMockContact()];
      mockBreezSDK.listContacts.mockResolvedValueOnce(mockContacts);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock and set up new response
      mockBreezSDK.listContacts.mockClear();
      const refreshedContacts = [createMockContact({ id: 'contact_new' })];
      mockBreezSDK.listContacts.mockResolvedValueOnce(refreshedContacts);

      await act(async () => {
        await result.current.refreshContacts();
      });

      expect(mockBreezSDK.listContacts).toHaveBeenCalled();
    });
  });

  describe('query invalidation', () => {
    it('invalidates contacts query after successful add', async () => {
      const mockRequest = createMockAddRequest();
      const mockContact = createMockContact();
      mockBreezSDK.addContact.mockResolvedValueOnce(mockContact);
      mockBreezSDK.listContacts.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.addContactAsync(mockRequest);
      });

      // Query should be invalidated (listContacts called again)
      await waitFor(() => {
        expect(mockBreezSDK.listContacts).toHaveBeenCalled();
      });
    });

    it('invalidates contacts query after successful update', async () => {
      const mockRequest = createMockUpdateRequest();
      const mockContact = createMockContact();
      mockBreezSDK.updateContact.mockResolvedValueOnce(mockContact);
      mockBreezSDK.listContacts.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.updateContactAsync(mockRequest);
      });

      await waitFor(() => {
        expect(mockBreezSDK.listContacts).toHaveBeenCalled();
      });
    });

    it('invalidates contacts query after successful delete', async () => {
      const contactId = 'contact_123';
      mockBreezSDK.deleteContact.mockResolvedValueOnce(undefined);
      mockBreezSDK.listContacts.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useContacts(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.deleteContactAsync(contactId);
      });

      await waitFor(() => {
        expect(mockBreezSDK.listContacts).toHaveBeenCalled();
      });
    });
  });
});
