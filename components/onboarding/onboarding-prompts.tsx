'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAllPrompts, useUserPrompts } from '@/lib/hooks/use-user-prompts';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Prompt } from '@/lib/types/api';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OnboardingHeader } from './onboarding-header';

interface OnboardingPromptsProps {
  onPromptsAnswered?: (
    prompts: Array<{
      prompt_id: string;
      answer: string;
      is_visible: boolean;
      display_order: number;
    }>
  ) => void;
}

type AnsweredPrompt = {
  prompt_id: string;
  question: string;
  answer: string;
  is_visible: boolean;
  display_order: number;
};

type EditingPrompt = {
  prompt_id: string;
  question: string;
  answer: string;
  is_visible: boolean;
  isNew: boolean;
};

export const OnboardingPrompts = ({ onPromptsAnswered }: OnboardingPromptsProps) => {
  const { user } = useAuthStore();
  const [view, setView] = useState<'list' | 'answer'>('list');
  const [answeredPrompts, setAnsweredPrompts] = useState<AnsweredPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<EditingPrompt | null>(null);

  const { data: userPrompts, isLoading: isLoadingUserPrompts } = useUserPrompts();
  const { data: availablePrompts, isLoading: isLoadingAvailablePrompts } = useAllPrompts(
    undefined,
    user?.id,
    true
  );

  // Initialize from existing user prompts
  useEffect(() => {
    if (userPrompts && userPrompts.length > 0) {
      const existing = userPrompts.map((up, index) => ({
        prompt_id: up.prompt.id,
        question: up.prompt.question,
        answer: up.answer,
        is_visible: up.is_visible,
        display_order: up.display_order || index + 1,
      }));
      setAnsweredPrompts(existing);
    }
  }, [userPrompts]);

  // Notify parent of changes
  useEffect(() => {
    if (onPromptsAnswered) {
      onPromptsAnswered(
        answeredPrompts.map(({ prompt_id, answer, is_visible, display_order }) => ({
          prompt_id,
          answer,
          is_visible,
          display_order,
        }))
      );
    }
  }, [answeredPrompts, onPromptsAnswered]);

  const handleAddPrompt = (prompt: Prompt) => {
    setEditingPrompt({
      prompt_id: prompt.id,
      question: prompt.question,
      answer: '',
      is_visible: true,
      isNew: true,
    });
    setView('answer');
  };

  const handleEditPrompt = (prompt: AnsweredPrompt) => {
    setEditingPrompt({
      prompt_id: prompt.prompt_id,
      question: prompt.question,
      answer: prompt.answer,
      is_visible: prompt.is_visible,
      isNew: false,
    });
    setView('answer');
  };

  const handleSavePrompt = () => {
    if (!editingPrompt || editingPrompt.answer.length < 5) return;

    if (editingPrompt.isNew) {
      // Add new prompt
      const newPrompt: AnsweredPrompt = {
        prompt_id: editingPrompt.prompt_id,
        question: editingPrompt.question,
        answer: editingPrompt.answer,
        is_visible: editingPrompt.is_visible,
        display_order: answeredPrompts.length + 1,
      };
      setAnsweredPrompts([...answeredPrompts, newPrompt]);
    } else {
      // Update existing prompt
      setAnsweredPrompts((prev) =>
        prev.map((p) =>
          p.prompt_id === editingPrompt.prompt_id
            ? { ...p, answer: editingPrompt.answer, is_visible: editingPrompt.is_visible }
            : p
        )
      );
    }

    setView('list');
    setEditingPrompt(null);
  };

  const handleRemovePrompt = (promptId: string) => {
    setAnsweredPrompts((prev) => {
      const filtered = prev.filter((p) => p.prompt_id !== promptId);
      return filtered.map((p, index) => ({ ...p, display_order: index + 1 }));
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setAnsweredPrompts((prev) => {
      const newPrompts = [...prev];
      [newPrompts[index - 1], newPrompts[index]] = [newPrompts[index], newPrompts[index - 1]];
      return newPrompts.map((p, i) => ({ ...p, display_order: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === answeredPrompts.length - 1) return;
    setAnsweredPrompts((prev) => {
      const newPrompts = [...prev];
      [newPrompts[index], newPrompts[index + 1]] = [newPrompts[index + 1], newPrompts[index]];
      return newPrompts.map((p, i) => ({ ...p, display_order: i + 1 }));
    });
  };

  const handleCancel = () => {
    setView('list');
    setEditingPrompt(null);
  };

  const canAddMore = answeredPrompts.length < 4;
  const answeredPromptIds = new Set(answeredPrompts.map((p) => p.prompt_id));
  const filteredAvailablePrompts = availablePrompts?.filter((p) => !answeredPromptIds.has(p.id));

  return (
    <motion.div
      key='prompts'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className='w-full'
    >
      <AnimatePresence mode='wait'>
        {/* List View */}
        {view === 'list' && (
          <motion.div
            key='list'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <OnboardingHeader
              title='Showcase your personality'
              description='Answer up to 4 prompts to help others get to know you'
            />

            <div className='mt-6 space-y-4'>
              {/* Loading state */}
              {isLoadingUserPrompts ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='rounded-xl border border-gray-200 bg-white p-3'>
                      <div className='mb-2 flex items-center gap-2'>
                        <Skeleton className='h-5 w-5 rounded-full' />
                        <Skeleton className='h-4 w-48' />
                      </div>
                      <Skeleton className='h-3 w-32' />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Answered prompts */}
                  {answeredPrompts.length > 0 && (
                    <div className='space-y-2'>
                      <h3 className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Your Prompts ({answeredPrompts.length}/4)
                      </h3>
                      {answeredPrompts.map((prompt, index) => (
                        <div
                          key={prompt.prompt_id}
                          className='rounded-xl border border-gray-200 bg-white p-3'
                        >
                          <div className='mb-1.5 flex items-start justify-between gap-2'>
                            <div className='flex min-w-0 flex-1 items-start gap-2'>
                              <span className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600'>
                                {index + 1}
                              </span>
                              <p className='flex-1 text-sm font-medium text-gray-900'>
                                {prompt.question}
                              </p>
                            </div>
                            <div className='flex flex-shrink-0 items-center'>
                              {answeredPrompts.length > 1 && (
                                <>
                                  <button
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    className='rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                                  >
                                    <ArrowUp className='h-3.5 w-3.5 text-gray-500' />
                                  </button>
                                  <button
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === answeredPrompts.length - 1}
                                    className='rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                                  >
                                    <ArrowDown className='h-3.5 w-3.5 text-gray-500' />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleRemovePrompt(prompt.prompt_id)}
                                className='rounded p-1 hover:bg-gray-100'
                              >
                                <X className='h-3.5 w-3.5 text-gray-400 hover:text-red-500' />
                              </button>
                            </div>
                          </div>
                          <div className='ml-7'>
                            <p className='line-clamp-2 text-sm text-gray-600'>{prompt.answer}</p>
                            <button
                              onClick={() => handleEditPrompt(prompt)}
                              className='mt-1 text-xs font-medium text-red-600 hover:text-red-700'
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Available prompts */}
                  {canAddMore && (
                    <div className='space-y-2'>
                      <h3 className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        {answeredPrompts.length > 0 ? 'Add More' : 'Choose a Prompt'}
                      </h3>

                      {isLoadingAvailablePrompts ? (
                        <div className='space-y-2'>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className='rounded-xl border border-gray-200 bg-white p-3'>
                              <div className='flex items-center gap-2'>
                                <Skeleton className='h-4 w-4 rounded' />
                                <Skeleton className='h-4 flex-1' />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredAvailablePrompts && filteredAvailablePrompts.length > 0 ? (
                        <div className='space-y-1.5'>
                          {filteredAvailablePrompts.slice(0, 5).map((prompt) => (
                            <button
                              key={prompt.id}
                              onClick={() => handleAddPrompt(prompt)}
                              className='flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 text-left transition-all hover:border-red-200 hover:bg-red-50/50'
                            >
                              <Plus className='h-4 w-4 flex-shrink-0 text-gray-400' />
                              <p className='flex-1 text-sm text-gray-700'>{prompt.question}</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className='rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center'>
                          <p className='text-sm text-gray-400'>No more prompts available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Max prompts message */}
                  {!canAddMore && (
                    <div className='rounded-lg bg-amber-50 p-2.5'>
                      <p className='text-center text-xs text-amber-700'>
                        Maximum 4 prompts reached. Remove one to add another.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Answer/Edit View */}
        {view === 'answer' && editingPrompt && (
          <motion.div
            key='answer'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            {/* Back button */}
            <button
              onClick={handleCancel}
              className='mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to prompts
            </button>

            <h2 className='mb-1 text-xl font-bold text-gray-900'>
              {editingPrompt.isNew ? 'Answer Prompt' : 'Edit Answer'}
            </h2>
            <p className='mb-6 text-sm text-gray-500'>Share something about yourself</p>

            {/* Question */}
            <div className='mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <p className='font-medium text-gray-900'>{editingPrompt.question}</p>
            </div>

            {/* Answer */}
            <div className='mb-4'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>Your Answer</label>
              <Textarea
                value={editingPrompt.answer}
                onChange={(e) =>
                  setEditingPrompt({
                    ...editingPrompt,
                    answer: e.target.value,
                  })
                }
                placeholder='Share your thoughts...'
                className='min-h-[120px] resize-none text-sm'
                maxLength={500}
                autoFocus
              />
              <div className='mt-1.5 flex items-center justify-between text-xs text-gray-400'>
                <span>Minimum 5 characters</span>
                <span>{editingPrompt.answer.length}/500</span>
              </div>
            </div>

            {/* Visibility toggle */}
            <div className='mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3'>
              <div>
                <p className='text-sm font-medium text-gray-900'>Show on profile</p>
                <p className='text-xs text-gray-500'>Make this visible to others</p>
              </div>
              <button
                onClick={() =>
                  setEditingPrompt({
                    ...editingPrompt,
                    is_visible: !editingPrompt.is_visible,
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  editingPrompt.is_visible ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    editingPrompt.is_visible ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Save/Cancel Buttons */}
            <div className='flex gap-3'>
              <Button onClick={handleCancel} variant='outline' className='flex-1'>
                Cancel
              </Button>
              <Button
                onClick={handleSavePrompt}
                disabled={editingPrompt.answer.length < 5}
                className='flex-1 bg-red-600 hover:bg-red-700'
              >
                {editingPrompt.isNew ? 'Add Prompt' : 'Save Changes'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
