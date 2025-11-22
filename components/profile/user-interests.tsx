'use client';

import { InterestWithParent } from '@/lib/types/api';

interface UserInterestsProps {
  interests: InterestWithParent[];
}

export function UserInterests({ interests }: UserInterestsProps) {
  if (!interests || interests.length === 0) {
    return null;
  }

  // Group interests by parent category
  const groupedInterests: Record<string, InterestWithParent[]> = {};

  interests.forEach((interest) => {
    const parentName = interest.parent_interest?.name || 'Other';
    if (!groupedInterests[parentName]) {
      groupedInterests[parentName] = [];
    }
    groupedInterests[parentName].push(interest);
  });

  return (
    <div className='rounded-2xl bg-white p-6 shadow-sm'>
      <h2 className='mb-4 text-xl font-bold text-gray-900'>Interests</h2>

      <div className='space-y-4'>
        {Object.entries(groupedInterests).map(([parentName, items]) => (
          <div key={parentName}>
            {/* Parent category label */}
            {parentName !== 'Other' && (
              <h3 className='mb-2 text-sm font-semibold text-gray-500'>{parentName}</h3>
            )}

            {/* Interest tags */}
            <div className='flex flex-wrap gap-2'>
              {items.map((interest) => (
                <span
                  key={interest.id}
                  className='inline-flex items-center rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700'
                >
                  {interest.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
