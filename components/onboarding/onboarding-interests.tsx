'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAllInterests, useUserInterests } from '@/lib/hooks/use-user-interests';
import { Interest } from '@/lib/types/api';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { OnboardingHeader } from './onboarding-header';

interface OnboardingInterestsProps {
  onInterestsSelected?: (interestIds: string[]) => void;
}

export const OnboardingInterests = ({ onInterestsSelected }: OnboardingInterestsProps) => {
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);

  const { data: userInterests, isLoading: isLoadingUserInterests } = useUserInterests();
  const { data: allInterests, isLoading: isLoadingAllInterests } = useAllInterests(true, false);

  // Initialize selected interests when component mounts
  useEffect(() => {
    if (userInterests) {
      const ids = userInterests.map((interest) => interest.id);
      setSelectedInterestIds(ids);
    }
  }, [userInterests]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onInterestsSelected) {
      onInterestsSelected(selectedInterestIds);
    }
  }, [selectedInterestIds, onInterestsSelected]);

  const handleToggleInterest = (interestId: string) => {
    setSelectedInterestIds((prev) =>
      prev.includes(interestId) ? prev.filter((id) => id !== interestId) : [...prev, interestId]
    );
  };

  // Build child interests map
  const childInterestsByParent: Record<string, Interest[]> = {};
  const parentInterests = allInterests || [];

  parentInterests.forEach((parent) => {
    if (parent.children && parent.children.length > 0) {
      childInterestsByParent[parent.id] = parent.children;
    }
  });

  return (
    <motion.div
      key='interests'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='w-full'
    >
      <OnboardingHeader
        title='What are you interested in?'
        description='Select topics you love (you can skip this step)'
      />

      <div className='mt-6'>
        {isLoadingAllInterests || isLoadingUserInterests ? (
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-6 w-32' />
                <div className='flex flex-wrap gap-2'>
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className='h-9 w-24 rounded-full' />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='space-y-6'>
            {parentInterests.map((parent) => {
              const children = childInterestsByParent?.[parent.id] || [];

              if (children.length === 0) return null;

              return (
                <div key={parent.id}>
                  {/* Category header */}
                  <h3 className='mb-3 text-sm font-semibold text-gray-700'>{parent.name}</h3>

                  {/* Interest tags */}
                  <div className='flex flex-wrap gap-2'>
                    {children.map((child) => {
                      const isSelected = selectedInterestIds.includes(child.id);
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleToggleInterest(child.id)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          #{child.slug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selection count */}
        {!isLoadingAllInterests && !isLoadingUserInterests && (
          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-500'>
              {selectedInterestIds.length} interest{selectedInterestIds.length !== 1 ? 's' : ''}{' '}
              selected
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
