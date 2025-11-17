'use client';

import { EventCard } from '@/components/event-card';
import { EventCompactItem } from '@/components/event-compact-item';
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
import { toast } from '@/lib/utils/toast';
import { Bookmark, Edit2, Grid3x3, List, Loader2, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ViewMode = 'card' | 'list';

export default function SavedListDetailPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [removingEventId, setRemovingEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [activeEventMenuId, setActiveEventMenuId] = useState<string | null>(null);

  const { data: lists = [] } = useUserLists();
  const { data: listEvents = [], isLoading: eventsLoading } = useListEvents(listId);
  const removeEventMutation = useRemoveEventFromList();
  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();

  const currentList = lists.find((l) => l.id === listId);

  useEffect(() => {
    if (currentList) {
      setNewListName(currentList.name);
    }
  }, [currentList]);

  const handleRemoveEvent = async (eventId: string) => {
    setRemovingEventId(eventId);
    setActiveEventMenuId(null);
    try {
      await removeEventMutation.mutateAsync({ listId, eventId });
      toast.success('Event removed from list');
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
      router.push('/e/saved');
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
            onClick={() => router.push('/e/saved')}
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
      {/* Header */}
      <div className='flex items-center gap-3 border-b border-gray-100 px-4 py-4'>
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => router.back()}>
          <X className='h-5 w-5' />
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h1 className='text-xl font-bold'>{currentList?.name || 'Loading...'}</h1>
            {currentList?.is_default && (
              <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'>
                Default
              </span>
            )}
          </div>
          <p className='text-sm text-gray-500'>{listEvents.length} events saved</p>
        </div>
        <div className='flex items-center gap-2'>
          {/* View Mode Toggle */}
          <div className='flex rounded-lg bg-gray-100 p-1'>
            <button
              onClick={() => setViewMode('card')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title='Card view'
            >
              <Grid3x3 className='h-4 w-4' />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title='List view'
            >
              <List className='h-4 w-4' />
            </button>
          </div>

          {/* More Menu */}
          <div className='relative'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 rounded-full bg-gray-100'
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <Edit2 className='h-4 w-4' />
            </Button>
            {showMoreMenu && (
              <div className='absolute right-0 top-10 z-10 w-48 rounded-lg border border-gray-200 bg-white shadow-lg'>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowRenameModal(true);
                  }}
                  className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-gray-50'
                >
                  <Edit2 className='h-4 w-4' />
                  Rename List
                </button>
                {!currentList?.is_default && (
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className='flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50'
                  >
                    <Trash2 className='h-4 w-4' />
                    Delete List
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto bg-gray-50 pb-20'>
        {eventsLoading ? (
          <div className='space-y-4 px-4 py-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-48 w-full rounded-2xl' />
            ))}
          </div>
        ) : listEvents.length > 0 ? (
          viewMode === 'card' ? (
            /* Card View */
            <div className='space-y-4 px-4 py-4'>
              {listEvents.map((listEvent) => (
                <EventCard
                  key={listEvent.list_event_id}
                  event={listEvent.event}
                  onMenuClick={(eventId) => setActiveEventMenuId(eventId)}
                  customMenuOptions={[]}
                />
              ))}
            </div>
          ) : (
            /* List View */
            <div className='px-4 py-4'>
              <div className='divide-y divide-gray-100 rounded-2xl bg-white shadow-sm'>
                {listEvents.map((listEvent) => (
                  <EventCompactItem
                    key={listEvent.list_event_id}
                    event={listEvent.event}
                    onMenuClick={(eventId) => setActiveEventMenuId(eventId)}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className='flex flex-1 items-center justify-center px-4 py-12'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <Bookmark className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-gray-900'>No events in this list</h3>
              <p className='mb-6 text-sm text-gray-500'>
                Use the &quot;Save Event&quot; feature in any event to add it to this list.
              </p>
              <Button
                onClick={() => router.push('/e/feed')}
                className='bg-red-500 text-white hover:bg-red-600'
              >
                Discover Events
              </Button>
            </div>
          </div>
        )}
      </div>

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

      {/* Event Menu Sheet */}
      {activeEventMenuId && (
        <DetachedMenuSheet
          isOpen={!!activeEventMenuId}
          onClose={() => setActiveEventMenuId(null)}
          options={[
            {
              id: 'remove',
              label: 'Remove from List',
              icon: X,
              onClick: () => handleRemoveEvent(activeEventMenuId),
              variant: 'destructive',
              disabled: removingEventId === activeEventMenuId,
            },
          ]}
        />
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
    </div>
  );
}
