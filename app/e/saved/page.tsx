'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useCreateList } from '@/lib/hooks/use-create-list';
import { useEnsureDefaultList } from '@/lib/hooks/use-ensure-default-list';
import { useUserLists } from '@/lib/hooks/use-user-lists';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, ChevronRight, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SavedListsPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { setTopBar } = useTopBar();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const { data: lists = [], isLoading: listsLoading } = useUserLists();
  const createListMutation = useCreateList();

  // Ensure default list exists
  useEnsureDefaultList();

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Saved Events',
    });

    return () => {
      setTopBar({
        title: '',
        subtitle: '',
      });
    };
  }, [setTopBar]);

  const handleCreateList = async () => {
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      toast.error('Please enter a list name');
      return;
    }

    if (trimmedName.length > 50) {
      toast.error('List name must be less than 50 characters');
      return;
    }

    try {
      await createListMutation.mutateAsync({ name: trimmedName });
      toast.success(`"${trimmedName}" list created!`);
      setNewListName('');
      setShowCreateModal(false);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to create list';
      toast.error(errorMsg);
    }
  };

  const handleListClick = (listId: string) => {
    router.push(`/e/saved/${listId}`);
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-2xl'>
      {/* Content */}
      <div className='flex-1 overflow-y-auto pb-20'>
        {/* Add New List Button */}
        <div className='px-4 py-4'>
          <Button
            onClick={() => setShowCreateModal(true)}
            className='h-12 w-full rounded-full py-3 font-medium text-white hover:bg-red-600'
          >
            <Plus className='mr-2 h-5 w-5' />
            Add New List
          </Button>
        </div>

        {/* Loading State */}
        {listsLoading ? (
          <div className='space-y-3 px-4 pb-6'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-24 w-full rounded-2xl' />
            ))}
          </div>
        ) : lists.length === 0 ? (
          /* Empty State */
          <div className='flex flex-1 items-center justify-center px-4 py-12'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50'>
                <Bookmark className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>No saved lists</h3>
              <p className='mb-6 text-sm text-gray-500'>
                Create your first list to start saving events.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className='bg-red-500 text-white hover:bg-red-600'
              >
                Create List
              </Button>
            </div>
          </div>
        ) : (
          /* Lists */
          <div className='space-y-3 px-4 pb-6'>
            {lists.map((list) => (
              <div
                key={list.id}
                onClick={() => handleListClick(list.id)}
                className='cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 p-4'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='mb-1 flex items-center gap-2'>
                      <h3 className='text-lg font-bold'>{list.name}</h3>
                      {list.is_default && (
                        <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'>
                          Default
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-gray-600'>
                      {list.event_count} {list.event_count === 1 ? 'event' : 'events'} • Updated{' '}
                      {formatLastUpdated(list.updated_at)}
                    </p>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400' />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm'>
            <h3 className='mb-4 text-xl font-bold'>Create New List</h3>
            <Input
              type='text'
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder='Enter list name...'
              className='mb-2'
              autoFocus
              maxLength={50}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <p className='mb-4 text-right text-xs text-gray-500'>{newListName.length}/50</p>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
                className='flex-1'
                disabled={createListMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                className='flex-1 bg-red-500 text-white hover:bg-red-600'
                disabled={!newListName.trim() || createListMutation.isPending}
              >
                {createListMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
