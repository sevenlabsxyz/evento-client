'use client';

import { Tag } from '@/components/ui/interest-selector';
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
    <div className='rounded-3xl border border-gray-200 bg-gray-50 p-6'>
      <h2 className='mb-4 text-lg font-bold text-gray-900'>Interests</h2>

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
                <Tag
                  key={interest.id}
                  text={interest.name}
                  isSelected={false}
                  onToggle={() => {}}
                  displayOnly
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
