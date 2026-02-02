'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAllPrompts, useUserPrompts } from '@/lib/hooks/use-user-prompts';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Prompt } from '@/lib/types/api';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, X } from 'lucide-react';
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

export const OnboardingPrompts = ({ onPromptsAnswered }: OnboardingPromptsProps) => {
  const { user } = useAuthStore();
  const [answeredPrompts, setAnsweredPrompts] = useState<AnsweredPrompt[]>([]);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

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
    const newPrompt: AnsweredPrompt = {
      prompt_id: prompt.id,
      question: prompt.question,
      answer: '',
      is_visible: true,
      display_order: answeredPrompts.length + 1,
    };
    setAnsweredPrompts([...answeredPrompts, newPrompt]);
    setEditingPromptId(prompt.id);
  };

  const handleRemovePrompt = (promptId: string) => {
    setAnsweredPrompts((prev) => {
      const filtered = prev.filter((p) => p.prompt_id !== promptId);
      // Reorder remaining prompts
      return filtered.map((p, index) => ({ ...p, display_order: index + 1 }));
    });
    if (editingPromptId === promptId) {
      setEditingPromptId(null);
    }
  };

  const handleUpdateAnswer = (promptId: string, answer: string) => {
    setAnsweredPrompts((prev) =>
      prev.map((p) => (p.prompt_id === promptId ? { ...p, answer } : p))
    );
  };

  const handleToggleVisibility = (promptId: string) => {
    setAnsweredPrompts((prev) =>
      prev.map((p) => (p.prompt_id === promptId ? { ...p, is_visible: !p.is_visible } : p))
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setAnsweredPrompts((prev) => {
      const newPrompts = [...prev];
      [newPrompts[index - 1], newPrompts[index]] = [newPrompts[index], newPrompts[index - 1]];
      // Update display_order to match new positions
      return newPrompts.map((p, i) => ({ ...p, display_order: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === answeredPrompts.length - 1) return;
    setAnsweredPrompts((prev) => {
      const newPrompts = [...prev];
      [newPrompts[index], newPrompts[index + 1]] = [newPrompts[index + 1], newPrompts[index]];
      // Update display_order to match new positions
      return newPrompts.map((p, i) => ({ ...p, display_order: i + 1 }));
    });
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
      <OnboardingHeader
        title='Showcase your personality'
        description='Answer up to 4 prompts (you can skip this step)'
      />

      <div className='mt-6 space-y-3'>
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
                  Your Prompts
                </h3>
                <AnimatePresence mode='popLayout'>
                  {answeredPrompts.map((prompt, index) => (
                    <motion.div
                      key={prompt.prompt_id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className='mb-2 rounded-xl border border-gray-200 bg-white p-3'
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
                        {/* Reorder buttons */}
                        {answeredPrompts.length > 1 && (
                          <>
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className='rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                              title='Move up'
                            >
                              <ArrowUp className='h-3.5 w-3.5 text-gray-500' />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === answeredPrompts.length - 1}
                              className='rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                              title='Move down'
                            >
                              <ArrowDown className='h-3.5 w-3.5 text-gray-500' />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleVisibility(prompt.prompt_id)}
                          className='rounded p-1 hover:bg-gray-100'
                          title={prompt.is_visible ? 'Hide from profile' : 'Show on profile'}
                        >
                          {prompt.is_visible ? (
                            <Eye className='h-3.5 w-3.5 text-gray-500' />
                          ) : (
                            <EyeOff className='h-3.5 w-3.5 text-gray-400' />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemovePrompt(prompt.prompt_id)}
                          className='rounded p-1 hover:bg-gray-100'
                          title='Remove prompt'
                        >
                          <X className='h-3.5 w-3.5 text-gray-400 hover:text-red-500' />
                        </button>
                      </div>
                    </div>

                    {editingPromptId === prompt.prompt_id ? (
                      <div className='ml-7 space-y-2'>
                        <Textarea
                          value={prompt.answer}
                          onChange={(e) => handleUpdateAnswer(prompt.prompt_id, e.target.value)}
                          placeholder='Share your thoughts...'
                          className='min-h-[60px] resize-none text-sm'
                          maxLength={500}
                          autoFocus
                        />
                        <div className='flex items-center justify-between'>
                          <span className='text-xs text-gray-400'>{prompt.answer.length}/500</span>
                          {prompt.answer.length >= 5 && (
                            <Button
                              size='sm'
                              onClick={() => setEditingPromptId(null)}
                              className='h-7 bg-red-600 px-3 text-xs hover:bg-red-700'
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='ml-7'>
                        {prompt.answer ? (
                          <p className='text-sm text-gray-600'>{prompt.answer}</p>
                        ) : (
                          <button
                            onClick={() => setEditingPromptId(prompt.prompt_id)}
                            className='text-sm text-gray-400 hover:text-gray-600'
                          >
                            Tap to add your answer...
                          </button>
                        )}
                        {prompt.answer && (
                          <button
                            onClick={() => setEditingPromptId(prompt.prompt_id)}
                            className='mt-1 block text-xs font-medium text-red-600 hover:text-red-700'
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                    </motion.div>
                  ))}
                </AnimatePresence>
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

            {/* Count indicator */}
            {answeredPrompts.length > 0 && (
              <div className='pt-1 text-center'>
                <p className='text-xs text-gray-400'>
                  {answeredPrompts.filter((p) => p.answer.length >= 5).length} of{' '}
                  {answeredPrompts.length} answered
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
