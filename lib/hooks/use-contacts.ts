'use client';

import { breezSDK } from '@/lib/services/breez-sdk';
import type { AddContactRequest, Contact, UpdateContactRequest } from '@/lib/types/wallet';
import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook for managing wallet contacts
 * Uses React Query for data fetching and mutations
 */
export function useContacts() {
  const queryClient = useQueryClient();

  // Query for listing contacts
  const {
    data: contacts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contacts'],
    queryFn: async (): Promise<Contact[]> => {
      try {
        if (!breezSDK.isConnected()) {
          return [];
        }

        const result = await breezSDK.listContacts();
        return result;
      } catch (err: any) {
        logBreezError(err, BREEZ_ERROR_CONTEXT.LISTING_CONTACTS);
        const userMessage = getBreezErrorMessage(err, 'list contacts');
        throw new Error(userMessage);
      }
    },
    enabled: breezSDK.isConnected(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for adding a contact
  const addMutation = useMutation({
    mutationFn: async (request: AddContactRequest): Promise<Contact> => {
      // Check for duplicate before adding
      const existing = contacts.find(
        (c) => c.paymentIdentifier.toLowerCase() === request.paymentIdentifier.toLowerCase()
      );
      if (existing) {
        throw new Error('Contact already exists with this Lightning address');
      }

      if (!breezSDK.isConnected()) {
        throw new Error('Wallet not connected');
      }

      return breezSDK.addContact(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact added');
    },
    onError: (error: Error) => {
      logBreezError(error, BREEZ_ERROR_CONTEXT.ADDING_CONTACT);
      // Check if it's a user-thrown "already exists" error
      if (error.message === 'Contact already exists with this Lightning address') {
        toast.error(error.message);
      } else {
        const userMessage = getBreezErrorMessage(error, 'add contact');
        toast.error(userMessage);
      }
    },
  });

  // Mutation for updating a contact
  const updateMutation = useMutation({
    mutationFn: async (request: UpdateContactRequest): Promise<Contact> => {
      if (!breezSDK.isConnected()) {
        throw new Error('Wallet not connected');
      }

      return breezSDK.updateContact(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
    },
    onError: (error: Error) => {
      logBreezError(error, BREEZ_ERROR_CONTEXT.UPDATING_CONTACT);
      const userMessage = getBreezErrorMessage(error, 'update contact');
      toast.error(userMessage);
    },
  });

  // Mutation for deleting a contact
  const deleteMutation = useMutation({
    mutationFn: async (contactId: string): Promise<void> => {
      if (!breezSDK.isConnected()) {
        throw new Error('Wallet not connected');
      }

      return breezSDK.deleteContact(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: (error: Error) => {
      logBreezError(error, BREEZ_ERROR_CONTEXT.DELETING_CONTACT);
      const userMessage = getBreezErrorMessage(error, 'delete contact');
      toast.error(userMessage);
    },
  });

  /**
   * Find a contact by their Lightning address (paymentIdentifier)
   */
  const findContactByAddress = (lightningAddress: string): Contact | undefined => {
    return contacts.find(
      (c) => c.paymentIdentifier.toLowerCase() === lightningAddress.toLowerCase()
    );
  };

  return {
    contacts,
    isLoading,
    error,
    addContact: addMutation.mutate,
    addContactAsync: addMutation.mutateAsync,
    isAddingContact: addMutation.isPending,
    updateContact: updateMutation.mutate,
    updateContactAsync: updateMutation.mutateAsync,
    isUpdatingContact: updateMutation.isPending,
    deleteContact: deleteMutation.mutate,
    deleteContactAsync: deleteMutation.mutateAsync,
    isDeletingContact: deleteMutation.isPending,
    refreshContacts: refetch,
    findContactByAddress,
  };
}
