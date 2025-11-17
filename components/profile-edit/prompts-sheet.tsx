'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  useAllPrompts,
  useAnswerPrompt,
  useDeletePrompt,
  useReorderPrompts,
  useUpdatePrompt,
  useUserPrompts,
} from '@/lib/hooks/use-user-prompts';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Prompt, UserPrompt } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PromptsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditingPrompt = {
  userPromptId?: string;
  promptId: string;
  question: string;
  answer: string;
  isVisible: boolean;
  displayOrder: number;
};

export default function PromptsSheet({ isOpen, onClose }: PromptsSheetProps) {
  const { user } = useAuthStore();
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingPrompt, setEditingPrompt] = useState<EditingPrompt | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const { data: userPrompts, isLoading: isLoadingUserPrompts } = useUserPrompts();
  const { data: availablePrompts, isLoading: isLoadingAvailablePrompts } = useAllPrompts(
    undefined,
    user?.id,
    true
  );
  const answerPromptMutation = useAnswerPrompt();
  const updatePromptMutation = useUpdatePrompt();
  const deletePromptMutation = useDeletePrompt();
  const reorderPromptsMutation = useReorderPrompts();

  // Reset view when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      setView('list');
      setEditingPrompt(null);
    }
  }, [isOpen]);

  const handleAddPrompt = (prompt: Prompt) => {
    setEditingPrompt({
      promptId: prompt.id,
      question: prompt.question,
      answer: '',
      isVisible: true,
      displayOrder: (userPrompts?.length || 0) + 1,
    });
    setView('add');
  };

  const handleEditPrompt = (userPrompt: UserPrompt) => {
    setEditingPrompt({
      userPromptId: userPrompt.id,
      promptId: userPrompt.prompt.id,
      question: userPrompt.prompt.question,
      answer: userPrompt.answer,
      isVisible: userPrompt.is_visible,
      displayOrder: userPrompt.display_order,
    });
    setView('edit');
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt) return;

    // Validate answer length
    if (editingPrompt.answer.length < 5) {
      toast.error('Answer must be at least 5 characters');
      return;
    }
    if (editingPrompt.answer.length > 500) {
      toast.error('Answer must be less than 500 characters');
      return;
    }

    try {
      if (editingPrompt.userPromptId) {
        // Update existing prompt
        await updatePromptMutation.mutateAsync({
          userPromptId: editingPrompt.userPromptId,
          data: {
            answer: editingPrompt.answer,
            is_visible: editingPrompt.isVisible,
          },
        });
        toast.success('Prompt updated successfully');
      } else {
        // Answer new prompt
        await answerPromptMutation.mutateAsync({
          prompt_id: editingPrompt.promptId,
          answer: editingPrompt.answer,
          display_order: editingPrompt.displayOrder,
        });
        toast.success('Prompt answered successfully');
      }
      setView('list');
      setEditingPrompt(null);
    } catch (error: any) {
      console.error('Failed to save prompt:', error);
      if (error?.message?.includes('PROMPT_LIMIT_EXCEEDED')) {
        toast.error('You can only have up to 4 prompts');
      } else {
        toast.error('Failed to save prompt');
      }
    }
  };

  const handleDeletePrompt = (userPromptId: string) => {
    setPromptToDelete(userPromptId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!promptToDelete) return;

    try {
      await deletePromptMutation.mutateAsync(promptToDelete);
      toast.success('Prompt deleted successfully');
      setDeleteConfirmOpen(false);
      setPromptToDelete(null);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const handleToggleVisibility = async (userPrompt: UserPrompt) => {
    try {
      await updatePromptMutation.mutateAsync({
        userPromptId: userPrompt.id,
        data: {
          is_visible: !userPrompt.is_visible,
        },
      });
      toast.success(
        userPrompt.is_visible ? 'Prompt hidden from profile' : 'Prompt visible on profile'
      );
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (!userPrompts || index === 0) return;

    const newOrder = [...userPrompts];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

    const reorderData = newOrder.map((prompt, i) => ({
      user_prompt_id: prompt.id,
      display_order: i + 1,
    }));

    try {
      await reorderPromptsMutation.mutateAsync(reorderData);
      toast.success('Prompt order updated');
    } catch (error) {
      console.error('Failed to reorder prompts:', error);
      toast.error('Failed to reorder prompts');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (!userPrompts || index === userPrompts.length - 1) return;

    const newOrder = [...userPrompts];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    const reorderData = newOrder.map((prompt, i) => ({
      user_prompt_id: prompt.id,
      display_order: i + 1,
    }));

    try {
      await reorderPromptsMutation.mutateAsync(reorderData);
      toast.success('Prompt order updated');
    } catch (error) {
      console.error('Failed to reorder prompts:', error);
      toast.error('Failed to reorder prompts');
    }
  };

  const handleCancel = () => {
    if (view === 'list') {
      onClose();
    } else {
      setView('list');
      setEditingPrompt(null);
    }
  };

  // Get unique categories from available prompts
  const categories = ['all', ...new Set(availablePrompts?.map((p) => p.category) || [])];

  // Filter available prompts by category
  const filteredAvailablePrompts =
    selectedCategory === 'all'
      ? availablePrompts
      : availablePrompts?.filter((p) => p.category === selectedCategory);

  const canAddMore = (userPrompts?.length || 0) < 4;
  const isSaving =
    answerPromptMutation.isPending ||
    updatePromptMutation.isPending ||
    deletePromptMutation.isPending;

  return (
    <>
      <SheetWithDetentFull.Root
        presented={isOpen}
        onPresentedChange={(presented) => !presented && handleCancel()}
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
                  <h2 className='text-xl font-semibold'>
                    {view === 'list' ? 'Prompts' : view === 'add' ? 'Answer Prompt' : 'Edit Prompt'}
                  </h2>
                  <button onClick={handleCancel} className='rounded-full p-2 hover:bg-gray-100'>
                    <X className='h-5 w-5' />
                  </button>
                </div>
                {view === 'list' && (
                  <p className='mt-2 text-sm text-gray-500'>
                    {userPrompts?.length || 0}/4 prompts • Showcase your personality
                  </p>
                )}
              </div>

              {/* Content */}
              <SheetWithDetentFull.ScrollRoot>
                <SheetWithDetentFull.ScrollView>
                  <SheetWithDetentFull.ScrollContent className='p-4'>
                    {/* List View */}
                    {view === 'list' && (
                      <>
                        {isLoadingUserPrompts ? (
                          <div className='space-y-3'>
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className='h-32 w-full' />
                            ))}
                          </div>
                        ) : (
                          <>
                            {/* User's answered prompts */}
                            {userPrompts && userPrompts.length > 0 && (
                              <div className='mb-6 space-y-3'>
                                <h3 className='text-sm font-semibold text-gray-700'>
                                  Your Prompts
                                </h3>
                                {userPrompts.map((userPrompt, index) => (
                                  <div
                                    key={userPrompt.id}
                                    className='rounded-xl border border-gray-200 bg-white p-4'
                                  >
                                    <div className='mb-2 flex items-start justify-between'>
                                      <div className='flex items-start gap-2'>
                                        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600'>
                                          {index + 1}
                                        </span>
                                        <p className='flex-1 font-semibold text-gray-900'>
                                          {userPrompt.prompt.question}
                                        </p>
                                      </div>
                                      <div className='flex items-center gap-1'>
                                        {userPrompts.length > 1 && (
                                          <>
                                            <button
                                              onClick={() => handleMoveUp(index)}
                                              disabled={index === 0}
                                              className='rounded-lg p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                                              title='Move up'
                                            >
                                              <ArrowUp className='h-4 w-4 text-gray-600' />
                                            </button>
                                            <button
                                              onClick={() => handleMoveDown(index)}
                                              disabled={index === userPrompts.length - 1}
                                              className='rounded-lg p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                                              title='Move down'
                                            >
                                              <ArrowDown className='h-4 w-4 text-gray-600' />
                                            </button>
                                          </>
                                        )}
                                        <button
                                          onClick={() => handleToggleVisibility(userPrompt)}
                                          className='rounded-lg p-2 hover:bg-gray-100'
                                          title={
                                            userPrompt.is_visible
                                              ? 'Hide from profile'
                                              : 'Show on profile'
                                          }
                                        >
                                          {userPrompt.is_visible ? (
                                            <Eye className='h-4 w-4 text-blue-600' />
                                          ) : (
                                            <EyeOff className='h-4 w-4 text-gray-400' />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => handleDeletePrompt(userPrompt.id)}
                                          className='rounded-lg p-2 hover:bg-gray-100'
                                          title='Delete prompt'
                                        >
                                          <Trash2 className='h-4 w-4 text-red-600' />
                                        </button>
                                      </div>
                                    </div>
                                    <p className='mb-3 text-gray-700'>{userPrompt.answer}</p>
                                    <button
                                      onClick={() => handleEditPrompt(userPrompt)}
                                      className='text-sm font-medium text-blue-600 hover:underline'
                                    >
                                      Edit answer
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Available prompts to answer */}
                            {canAddMore && (
                              <>
                                <div className='mb-3 flex items-center justify-between'>
                                  <h3 className='text-sm font-semibold text-gray-700'>
                                    Available Prompts
                                  </h3>
                                  {/* Category filter */}
                                  <Select
                                    value={selectedCategory}
                                    onValueChange={(value) => setSelectedCategory(value)}
                                  >
                                    <SelectTrigger className='max-w-fit'>
                                      <SelectValue placeholder='Select a category' />
                                    </SelectTrigger>
                                    <SelectContent className='z-[60] max-w-fit'>
                                      {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {isLoadingAvailablePrompts ? (
                                  <div className='space-y-3'>
                                    {[1, 2, 3].map((i) => (
                                      <Skeleton key={i} className='h-20 w-full' />
                                    ))}
                                  </div>
                                ) : filteredAvailablePrompts &&
                                  filteredAvailablePrompts.length > 0 ? (
                                  <div className='space-y-3'>
                                    {filteredAvailablePrompts.map((prompt) => (
                                      <button
                                        key={prompt.id}
                                        onClick={() => handleAddPrompt(prompt)}
                                        className='flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50'
                                      >
                                        <MessageSquare className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
                                        <div className='flex-1'>
                                          <p className='font-medium text-gray-900'>
                                            {prompt.question}
                                          </p>
                                          {prompt.placeholder_text && (
                                            <p className='mt-1 text-sm text-gray-500'>
                                              {prompt.placeholder_text}
                                            </p>
                                          )}
                                        </div>
                                        <Plus className='mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400' />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className='rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
                                    <p className='text-gray-500'>
                                      No available prompts in this category
                                    </p>
                                  </div>
                                )}
                              </>
                            )}

                            {!canAddMore && (!userPrompts || userPrompts.length === 0) && (
                              <div className='rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
                                <p className='text-gray-500'>No prompts yet</p>
                              </div>
                            )}

                            {!canAddMore && userPrompts && userPrompts.length > 0 && (
                              <div className='rounded-xl border border-yellow-200 bg-yellow-50 p-4'>
                                <p className='text-sm text-yellow-800'>
                                  You&apos;ve reached the maximum of 4 prompts. Delete a prompt to
                                  add a new one.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* Add/Edit View */}
                    {(view === 'add' || view === 'edit') && editingPrompt && (
                      <div className='space-y-4'>
                        {/* Question */}
                        <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                          <p className='font-semibold text-gray-900'>{editingPrompt.question}</p>
                        </div>

                        {/* Answer */}
                        <div>
                          <label className='mb-2 block text-sm font-medium text-gray-700'>
                            Your Answer
                          </label>
                          <Textarea
                            value={editingPrompt.answer}
                            onChange={(e) =>
                              setEditingPrompt({
                                ...editingPrompt,
                                answer: e.target.value,
                              })
                            }
                            placeholder='Share your thoughts...'
                            className='min-h-[120px] resize-none'
                            maxLength={500}
                            autoFocus
                          />
                          <p className='mt-1 text-right text-sm text-gray-500'>
                            {editingPrompt.answer.length}/500
                          </p>
                        </div>

                        {/* Visibility toggle */}
                        <div className='flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4'>
                          <div>
                            <p className='font-medium text-gray-900'>Show on profile</p>
                            <p className='text-sm text-gray-500'>
                              Make this prompt visible to others
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setEditingPrompt({
                                ...editingPrompt,
                                isVisible: !editingPrompt.isVisible,
                              })
                            }
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                              editingPrompt.isVisible ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                editingPrompt.isVisible ? 'left-5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div className='flex flex-col gap-3 pt-4'>
                          <Button
                            onClick={handleSavePrompt}
                            disabled={editingPrompt.answer.length < 5 || isSaving}
                            className='flex-1 bg-red-500 text-white hover:bg-red-600'
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </Button>
                          <Button onClick={handleCancel} variant='outline' className='flex-1'>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </SheetWithDetentFull.ScrollContent>
                </SheetWithDetentFull.ScrollView>
              </SheetWithDetentFull.ScrollRoot>
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>

      {/* Delete Confirmation Sheet */}
      <DetachedSheet.Root
        presented={deleteConfirmOpen}
        onPresentedChange={(presented) => !presented && setDeleteConfirmOpen(false)}
      >
        <DetachedSheet.Portal>
          <DetachedSheet.View>
            <DetachedSheet.Backdrop />
            <DetachedSheet.Content>
              <div className='p-6'>
                {/* Handle */}
                <div className='mb-4 flex justify-center'>
                  <DetachedSheet.Handle />
                </div>

                {/* Header */}
                <div className='mb-6 flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-50'>
                    <AlertTriangle className='h-5 w-5 text-red-500' />
                  </div>
                  <h2 className='text-xl font-semibold'>Delete Prompt</h2>
                </div>

                {/* Body */}
                <div className='mb-8 text-gray-600'>
                  <p>Are you sure you want to delete this prompt? This action cannot be undone.</p>
                </div>

                {/* Actions */}
                <div className='flex flex-col gap-3 sm:flex-row'>
                  <Button
                    onClick={() => setDeleteConfirmOpen(false)}
                    variant='outline'
                    className='w-full'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    variant='destructive'
                    className='w-full'
                    disabled={deletePromptMutation.isPending}
                  >
                    {deletePromptMutation.isPending ? 'Deleting...' : 'Delete Prompt'}
                  </Button>
                </div>
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>
    </>
  );
}
