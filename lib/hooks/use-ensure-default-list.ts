'use client';

import { logger } from '@/lib/utils/logger';
import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CREATE_LIST_MUTATION_KEY, useCreateList } from './use-create-list';
import { useUserLists } from './use-user-lists';

/** Name of the list the client creates when the user has no default list yet. */
export const DEFAULT_LIST_NAME = 'Saved Events';

/**
 * Attempted at most once per page session across every consumer: a failed attempt
 * is not retried automatically (reload to retry), and two mounted consumers can't
 * race into a duplicate-name error.
 */
let hasAttemptedDefaultListCreation = false;

/**
 * Ensures the user has a default list, creating "Saved Events" when none exists.
 * Only acts after the lists query succeeds, so a failed fetch never triggers a create.
 */
export function useEnsureDefaultList(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { data: lists, isSuccess } = useUserLists(enabled);
  const createListMutation = useCreateList();
  const pendingCreates = useIsMutating({ mutationKey: CREATE_LIST_MUTATION_KEY });

  const hasDefaultList =
    lists?.some((list) => list.is_default || list.name === DEFAULT_LIST_NAME) ?? false;

  useEffect(() => {
    if (!enabled || !isSuccess || hasDefaultList || hasAttemptedDefaultListCreation) {
      return;
    }
    if (queryClient.isMutating({ mutationKey: CREATE_LIST_MUTATION_KEY }) > 0) {
      return;
    }

    hasAttemptedDefaultListCreation = true;
    createListMutation.mutate(
      { name: DEFAULT_LIST_NAME },
      {
        onError: (error) => {
          logger.error('Failed to create default list', {
            error: error instanceof Error ? error.message : String(error),
          });
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isSuccess, hasDefaultList]);

  return {
    /** True while any list creation is in flight and no default list exists yet. */
    isCreatingDefaultList: !hasDefaultList && pendingCreates > 0,
    hasDefaultList,
  };
}
