'use client';

import { useEffect, useRef } from 'react';
import { useCreateList } from './use-create-list';
import { useUserLists } from './use-user-lists';

/**
 * Hook to ensure a default list exists for the user
 * Creates a "Saved Events" list if no default list exists
 * Only runs once per session to avoid unnecessary API calls
 */
export function useEnsureDefaultList() {
  const { data: lists = [], isLoading } = useUserLists();
  const createListMutation = useCreateList();
  const hasAttemptedCreation = useRef(false);

  useEffect(() => {
    // Don't run if still loading or already attempted creation
    if (isLoading || hasAttemptedCreation.current) {
      return;
    }

    // Check if a default list already exists
    const hasDefaultList = lists.some((list) => list.is_default || list.name === 'Saved Events');

    // If no default list exists, create one
    if (!hasDefaultList) {
      hasAttemptedCreation.current = true;

      createListMutation.mutate(
        { name: 'Saved Events' },
        {
          onSuccess: () => {
            console.log('Default list created successfully');
          },
          onError: (error) => {
            console.error('Failed to create default list:', error);
            // Reset flag on error so it can be retried
            hasAttemptedCreation.current = false;
          },
        }
      );
    }
  }, [lists, isLoading, createListMutation]);

  return {
    isCreatingDefaultList: createListMutation.isPending,
    hasDefaultList: lists.some((list) => list.is_default),
  };
}
