'use client';

import { MasterEventCard } from '@/components/master-event-card';
import { Button } from '@/components/ui/button';
import DetachedMenuSheet from '@/components/ui/detached-menu-sheet';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useDeleteList } from '@/lib/hooks/use-delete-list';
import { useListEvents } from '@/lib/hooks/use-list-events';
import { useRemoveEventFromList } from '@/lib/hooks/use-remove-event-from-list';
import { useUpdateList } from '@/lib/hooks/use-update-list';
import { useUserLists } from '@/lib/hooks/use-user-lists';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { Bookmark, Edit2, Loader2, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SavedListDetailPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;
  const { setTopBar } = useTopBar();

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [eventToRemove, setEventToRemove] = useState<string | null>(null);
  const [removingEventId, setRemovingEventId] = useState<string | null>(null);

  const { data: lists = [] } = useUserLists();
  const { data: listEvents = [], isLoading: eventsLoading } = useListEvents(listId);
  const removeEventMutation = useRemoveEventFromList();
  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();

  const currentList = lists.find((l) => l.id === listId);

  // Configure TopBar
  useEffect(() => {
    setTopBar({
      title: currentList?.name || 'Loading...',
      leftMode: 'back',
      onBackPress: () => router.push('/e/lists'),
      centerMode: 'title',
      showAvatar: false,
      buttons: [
        {
          id: 'edit',
          icon: Edit2,
          onClick: () => setShowMoreMenu(true),
        },
      ],
    });

    return () => {
      setTopBar({
        title: '',
        leftMode: 'menu',
        showAvatar: true,
        buttons: [],
      });
    };
  }, [currentList?.name, setTopBar, router]);

  useEffect(() => {
    if (currentList) {
      setNewListName(currentList.name);
    }
  }, [currentList]);

  const handleRemoveEventClick = (eventId: string) => {
    setEventToRemove(eventId);
    setShowRemoveConfirmModal(true);
  };

  const handleConfirmRemoveEvent = async () => {
    if (!eventToRemove) return;

    setRemovingEventId(eventToRemove);
    try {
      await removeEventMutation.mutateAsync({ listId, eventId: eventToRemove });
      toast.success('Event removed from list');
      setShowRemoveConfirmModal(false);
      setEventToRemove(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove event');
    } finally {
      setRemovingEventId(null);
    }
  };

  const handleRenameList = async () => {
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      toast.error('List name is required');
      return;
    }

    if (trimmedName === currentList?.name) {
      setShowRenameModal(false);
      return;
    }

    try {
      await updateListMutation.mutateAsync({
        listId,
        data: { name: trimmedName },
      });
      toast.success('List renamed');
      setShowRenameModal(false);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to rename list');
    }
  };

  const handleDeleteList = async () => {
    try {
      await deleteListMutation.mutateAsync(listId);
      toast.success('List deleted');
      router.push('/e/lists');
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to delete list';
      toast.error(errorMsg);
      setShowDeleteModal(false);
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

  if (!currentList && !eventsLoading) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col items-center justify-center bg-white md:max-w-sm'>
        <div className='text-center'>
          <h2 className='mb-2 text-xl font-bold'>List not found</h2>
          <p className='mb-4 text-gray-600'>This list may have been deleted</p>
          <Button
            onClick={() => router.push('/e/lists')}
            className='bg-red-500 text-white hover:bg-red-600'
          >
            Back to Lists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Content */}
      <div className='flex-1 overflow-y-auto bg-white pb-20'>
        {eventsLoading ? (
          <div className='space-y-4 px-4 py-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-32 w-full rounded-2xl' />
            ))}
          </div>
        ) : listEvents.length > 0 ? (
          <div className='space-y-3 px-4 py-4'>
            {listEvents.map((listEvent) => (
              <MasterEventCard
                key={listEvent.list_event_id}
                event={listEvent.event}
                onLongPress={() => handleRemoveEventClick(listEvent.event.id)}
              />
            ))}
          </div>
        ) : (
          <div className='flex flex-1 items-center justify-center px-4 py-12'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <Bookmark className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>No events in this list</h3>
              <p className='text-sm text-gray-500'>
                Use the &quot;Save Event&quot; feature in any event to add it to this list.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Menu Sheet */}
      <DetachedMenuSheet
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        options={[
          {
            id: 'rename',
            label: 'Rename List',
            icon: Edit2,
            onClick: () => {
              setShowMoreMenu(false);
              setShowRenameModal(true);
            },
          },
          ...(!currentList?.is_default
            ? [
                {
                  id: 'delete',
                  label: 'Delete List',
                  icon: Trash2,
                  onClick: () => {
                    setShowMoreMenu(false);
                    setShowDeleteModal(true);
                  },
                  variant: 'destructive' as const,
                },
              ]
            : []),
        ]}
      />

      {/* Rename Modal */}
      {showRenameModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm'>
            <h3 className='mb-4 text-xl font-bold'>Rename List</h3>
            <Input
              type='text'
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder='List name'
              className='mb-2'
              autoFocus
              maxLength={50}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameList()}
            />
            <p className='mb-4 text-right text-xs text-gray-500'>{newListName.length}/50</p>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowRenameModal(false);
                  setNewListName(currentList?.name || '');
                }}
                className='flex-1'
                disabled={updateListMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameList}
                className='flex-1 bg-red-500 text-white hover:bg-red-600'
                disabled={!newListName.trim() || updateListMutation.isPending}
              >
                {updateListMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm'>
            <h3 className='mb-2 text-xl font-bold'>Delete List?</h3>
            <p className='mb-6 text-sm text-gray-600'>
              This will remove all events from &quot;{currentList?.name}&quot;. This action cannot
              be undone.
            </p>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => setShowDeleteModal(false)}
                className='flex-1'
                disabled={deleteListMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteList}
                className='flex-1 bg-red-500 text-white hover:bg-red-600'
                disabled={deleteListMutation.isPending}
              >
                {deleteListMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Event Confirmation Modal */}
      {showRemoveConfirmModal && eventToRemove && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 md:max-w-sm'>
            <h3 className='mb-2 text-xl font-bold'>Remove Event?</h3>
            <p className='mb-6 text-sm text-gray-600'>
              This will remove the event from &quot;{currentList?.name}&quot;. You can always add it
              back later.
            </p>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowRemoveConfirmModal(false);
                  setEventToRemove(null);
                }}
                className='flex-1'
                disabled={removingEventId === eventToRemove}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRemoveEvent}
                className='flex-1 bg-red-500 text-white hover:bg-red-600'
                disabled={removingEventId === eventToRemove}
              >
                {removingEventId === eventToRemove ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
