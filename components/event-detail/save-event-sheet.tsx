'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddEventToList } from '@/lib/hooks/use-add-event-to-list';
import { useCreateList } from '@/lib/hooks/use-create-list';
import { useEnsureDefaultList } from '@/lib/hooks/use-ensure-default-list';
import { useEventSavedStatus } from '@/lib/hooks/use-event-saved-status';
import { useRemoveEventFromList } from '@/lib/hooks/use-remove-event-from-list';
import { useUserLists } from '@/lib/hooks/use-user-lists';
import { toast } from '@/lib/utils/toast';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SaveEventSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export default function SaveEventSheet({ isOpen, onClose, eventId }: SaveEventSheetProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [processingListId, setProcessingListId] = useState<string | null>(null);

  const { data: lists = [], isLoading: listsLoading } = useUserLists();
  const { data: savedStatus, isLoading: statusLoading } = useEventSavedStatus(eventId, isOpen);
  const addToListMutation = useAddEventToList();
  const removeFromListMutation = useRemoveEventFromList();
  const createListMutation = useCreateList();

  // Ensure default list exists when sheet opens
  useEnsureDefaultList();

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setNewListName('');
      setProcessingListId(null);
    }
  }, [isOpen]);

  const isListChecked = (listId: string) => {
    return savedStatus?.saved_in_lists.some((l) => l.list_id === listId) ?? false;
  };

  const handleToggleList = async (listId: string, isChecked: boolean) => {
    setProcessingListId(listId);

    try {
      if (isChecked) {
        // Remove from list
        await removeFromListMutation.mutateAsync({ listId, eventId });
        const listName = lists.find((l) => l.id === listId)?.name || 'list';
        toast.success(`Removed from ${listName}`);
      } else {
        // Add to list
        await addToListMutation.mutateAsync({ listId, eventId });
        const listName = lists.find((l) => l.id === listId)?.name || 'list';
        toast.success(`Added to ${listName}`);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to update list';
      toast.error(errorMsg);
    } finally {
      setProcessingListId(null);
    }
  };

  const handleCreateList = async () => {
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      toast.error('List name is required');
      return;
    }

    if (trimmedName.length > 50) {
      toast.error('List name must be less than 50 characters');
      return;
    }

    try {
      const newList = await createListMutation.mutateAsync({
        name: trimmedName,
      });
      toast.success('List created');

      // Automatically add event to the new list
      await addToListMutation.mutateAsync({ listId: newList.id, eventId });
      toast.success(`Added to ${trimmedName}`);

      // Reset form
      setNewListName('');
      setShowCreateForm(false);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to create list';
      toast.error(errorMsg);
    }
  };

  const isLoading = listsLoading || statusLoading;

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Header */}
            <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4'>
              <div className='flex items-center justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>Save Event</h2>
                <button onClick={onClose} className='rounded-full p-2 hover:bg-gray-100'>
                  <X className='h-5 w-5' />
                </button>
              </div>
              <p className='mt-1 text-sm text-gray-500'>Choose lists to save this event to</p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='p-4'>
                  {isLoading ? (
                    <div className='space-y-3'>
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className='h-14 w-full rounded-lg' />
                      ))}
                    </div>
                  ) : lists.length === 0 && !showCreateForm ? (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                      <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                        <Plus className='h-8 w-8 text-gray-400' />
                      </div>
                      <h3 className='mb-1 text-base font-semibold text-gray-900'>No lists yet</h3>
                      <p className='mb-4 text-sm text-gray-500'>
                        Create your first list to save events
                      </p>
                      <Button onClick={() => setShowCreateForm(true)} variant='default'>
                        <Plus className='mr-2 h-4 w-4' />
                        Create List
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* List items */}
                      <div className='mb-4 space-y-2'>
                        {lists.map((list) => {
                          const checked = isListChecked(list.id);
                          const isProcessing = processingListId === list.id;

                          return (
                            <button
                              key={list.id}
                              onClick={() => handleToggleList(list.id, checked)}
                              disabled={isProcessing}
                              className='flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 disabled:opacity-50'
                            >
                              <div className='flex items-center gap-3'>
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                    checked
                                      ? 'border-red-500 bg-red-500'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isProcessing ? (
                                    <Loader2 className='h-3 w-3 animate-spin text-white' />
                                  ) : checked ? (
                                    <Check className='h-3 w-3 text-white' />
                                  ) : null}
                                </div>
                                <div className='text-left'>
                                  <p className='font-medium text-gray-900'>{list.name}</p>
                                  {list.is_default && (
                                    <span className='text-xs text-gray-500'>Default</span>
                                  )}
                                </div>
                              </div>
                              <span className='text-sm text-gray-500'>
                                {list.event_count} events
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Create new list section */}
                      {!showCreateForm ? (
                        <Button
                          onClick={() => setShowCreateForm(true)}
                          variant='outline'
                          className='w-full'
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          Create New List
                        </Button>
                      ) : (
                        <div className='rounded-lg border border-gray-200 p-4'>
                          <h3 className='mb-3 font-medium text-gray-900'>Create New List</h3>
                          <Input
                            type='text'
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder='List name'
                            maxLength={50}
                            className='mb-3'
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateList();
                              }
                            }}
                          />
                          <p className='mb-3 text-right text-xs text-gray-500'>
                            {newListName.length}/50
                          </p>
                          <div className='flex gap-2'>
                            <Button
                              onClick={handleCreateList}
                              disabled={!newListName.trim() || createListMutation.isPending}
                              className='flex-1'
                            >
                              {createListMutation.isPending ? (
                                <>
                                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                  Creating...
                                </>
                              ) : (
                                'Create & Add'
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowCreateForm(false);
                                setNewListName('');
                              }}
                              variant='outline'
                              className='flex-1'
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
