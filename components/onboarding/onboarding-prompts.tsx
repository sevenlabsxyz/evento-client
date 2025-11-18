'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAllPrompts, useUserPrompts } from '@/lib/hooks/use-user-prompts';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Prompt } from '@/lib/types/api';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Eye, EyeOff, MessageSquare, Plus, X } from 'lucide-react';
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='w-full'
    >
      <OnboardingHeader
        title='Showcase your personality'
        description='Answer up to 4 prompts (you can skip this step)'
      />

      <div className='mt-6 space-y-4'>
        {/* Loading state */}
        {isLoadingUserPrompts ? (
          <div className='space-y-3'>
            {[1, 2].map((i) => (
              <Skeleton key={i} className='h-32 w-full' />
            ))}
          </div>
        ) : (
          <>
            {/* Answered prompts */}
            {answeredPrompts.length > 0 && (
              <div className='space-y-3'>
                <h3 className='text-sm font-semibold text-gray-700'>Your Prompts</h3>
                {answeredPrompts.map((prompt, index) => (
                  <div
                    key={prompt.prompt_id}
                    className='rounded-xl border border-gray-200 bg-white p-4'
                  >
                    <div className='mb-2 flex items-start justify-between'>
                      <div className='flex items-start gap-2'>
                        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-600'>
                          {index + 1}
                        </span>
                        <p className='flex-1 text-sm font-semibold text-gray-900'>
                          {prompt.question}
                        </p>
                      </div>
                      <div className='flex items-center gap-1'>
                        {/* Reorder buttons */}
                        {answeredPrompts.length > 1 && (
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
                              disabled={index === answeredPrompts.length - 1}
                              className='rounded-lg p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30'
                              title='Move down'
                            >
                              <ArrowDown className='h-4 w-4 text-gray-600' />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleVisibility(prompt.prompt_id)}
                          className='rounded-lg p-1.5 hover:bg-gray-100'
                          title={prompt.is_visible ? 'Hide from profile' : 'Show on profile'}
                        >
                          {prompt.is_visible ? (
                            <Eye className='h-4 w-4 text-blue-600' />
                          ) : (
                            <EyeOff className='h-4 w-4 text-gray-400' />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemovePrompt(prompt.prompt_id)}
                          className='rounded-lg p-1.5 hover:bg-gray-100'
                          title='Remove prompt'
                        >
                          <X className='h-4 w-4 text-red-600' />
                        </button>
                      </div>
                    </div>

                    {editingPromptId === prompt.prompt_id ? (
                      <div className='space-y-2'>
                        <Textarea
                          value={prompt.answer}
                          onChange={(e) => handleUpdateAnswer(prompt.prompt_id, e.target.value)}
                          placeholder='Share your thoughts...'
                          className='min-h-[80px] resize-none text-sm'
                          maxLength={500}
                          autoFocus
                        />
                        <div className='flex items-center justify-between'>
                          <p className='text-xs text-gray-500'>
                            {prompt.answer.length}/500 characters
                          </p>
                          {prompt.answer.length >= 5 && (
                            <Button
                              size='sm'
                              onClick={() => setEditingPromptId(null)}
                              className='bg-red-600 hover:bg-red-700'
                            >
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {prompt.answer ? (
                          <p className='text-sm text-gray-700'>{prompt.answer}</p>
                        ) : (
                          <p className='text-sm italic text-gray-400'>No answer yet</p>
                        )}
                        <button
                          onClick={() => setEditingPromptId(prompt.prompt_id)}
                          className='mt-2 text-xs font-medium text-blue-600 hover:underline'
                        >
                          {prompt.answer ? 'Edit answer' : 'Add answer'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Available prompts */}
            {canAddMore && (
              <div className='space-y-3'>
                <h3 className='text-sm font-semibold text-gray-700'>
                  {answeredPrompts.length > 0 ? 'Add More Prompts' : 'Available Prompts'}
                </h3>

                {isLoadingAvailablePrompts ? (
                  <div className='space-y-2'>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className='h-20 w-full' />
                    ))}
                  </div>
                ) : filteredAvailablePrompts && filteredAvailablePrompts.length > 0 ? (
                  <div className='space-y-2'>
                    {filteredAvailablePrompts.slice(0, 5).map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleAddPrompt(prompt)}
                        className='flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50'
                      >
                        <MessageSquare className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600' />
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-gray-900'>{prompt.question}</p>
                          {prompt.placeholder_text && (
                            <p className='mt-0.5 text-xs text-gray-500'>
                              {prompt.placeholder_text}
                            </p>
                          )}
                        </div>
                        <Plus className='mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400' />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-xl border border-gray-200 bg-gray-50 p-6 text-center'>
                    <p className='text-sm text-gray-500'>No more prompts available</p>
                  </div>
                )}
              </div>
            )}

            {/* Max prompts message */}
            {!canAddMore && (
              <div className='rounded-xl border border-yellow-200 bg-yellow-50 p-3'>
                <p className='text-sm text-yellow-800'>
                  You&apos;ve reached the maximum of 4 prompts. Remove one to add a different
                  prompt.
                </p>
              </div>
            )}

            {/* Count indicator */}
            <div className='text-center'>
              <p className='text-sm text-gray-500'>
                {answeredPrompts.length}/4 prompts •{' '}
                {answeredPrompts.filter((p) => p.answer.length >= 5).length} answered
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
