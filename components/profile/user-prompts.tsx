'use client';

import { UserPrompt } from '@/lib/types/api';
import { EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UserPromptsProps {
  prompts: UserPrompt[];
  isOwnProfile?: boolean;
}

export function UserPrompts({ prompts, isOwnProfile = false }: UserPromptsProps) {
  const t = useTranslations('profile');
  if (!prompts || prompts.length === 0) {
    return null;
  }

  // Sort by display_order
  const sortedPrompts = [...prompts].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className='rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-950'>
      <h2 className='mb-4 text-lg font-bold text-gray-900 dark:text-neutral-100'>{t('aboutMe')}</h2>

      <div className='space-y-4'>
        {sortedPrompts.map((userPrompt) => (
          <div
            key={userPrompt.id}
            className={`rounded-3xl border px-6 py-4 ${
              isOwnProfile && !userPrompt.is_visible
                ? 'border-gray-300 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-950'
                : 'border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
            }`}
          >
            {/* Question */}
            <div className='mb-2 flex items-start justify-between gap-2'>
              <h3 className='text-lg font-semibold text-gray-700 dark:text-neutral-300 lg:text-base'>
                {userPrompt.prompt.question}
              </h3>

              {/* Hidden indicator (only for own profile) */}
              {isOwnProfile && !userPrompt.is_visible && (
                <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400'>
                  <EyeOff className='h-3.5 w-3.5' />
                  <span>{t('hidden')}</span>
                </div>
              )}
            </div>

            {/* Answer */}
            <p className='text-base text-muted-foreground'>
              {'"'}
              {userPrompt.answer}
              {'"'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
