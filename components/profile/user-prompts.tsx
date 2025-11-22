'use client';

import { UserPrompt } from '@/lib/types/api';
import { EyeOff } from 'lucide-react';

interface UserPromptsProps {
  prompts: UserPrompt[];
  isOwnProfile?: boolean;
}

export function UserPrompts({ prompts, isOwnProfile = false }: UserPromptsProps) {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  // Sort by display_order
  const sortedPrompts = [...prompts].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className='rounded-2xl bg-white p-6 shadow-sm'>
      <h2 className='mb-4 text-xl font-bold text-gray-900'>About Me</h2>

      <div className='space-y-4'>
        {sortedPrompts.map((userPrompt) => (
          <div
            key={userPrompt.id}
            className={`rounded-lg border p-4 ${
              isOwnProfile && !userPrompt.is_visible
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Question */}
            <div className='mb-2 flex items-start justify-between gap-2'>
              <h3 className='text-sm font-semibold text-gray-700'>{userPrompt.prompt.question}</h3>

              {/* Hidden indicator (only for own profile) */}
              {isOwnProfile && !userPrompt.is_visible && (
                <div className='flex items-center gap-1 text-xs text-gray-500'>
                  <EyeOff className='h-3.5 w-3.5' />
                  <span>Hidden</span>
                </div>
              )}
            </div>

            {/* Answer */}
            <p className='text-base text-gray-900'>{userPrompt.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
