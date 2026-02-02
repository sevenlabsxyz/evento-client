'use client';

import { InterestsSelector } from '@/components/ui/interest-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllInterests, useUserInterests } from '@/lib/hooks/use-user-interests';
import { Interest } from '@/lib/types/api';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { OnboardingHeader } from './onboarding-header';

interface OnboardingInterestsProps {
  onInterestsSelected?: (interestIds: string[]) => void;
}

export const OnboardingInterests = ({ onInterestsSelected }: OnboardingInterestsProps) => {
  const { data: userInterests, isLoading: isLoadingUserInterests } = useUserInterests();
  const { data: allInterests, isLoading: isLoadingAllInterests } = useAllInterests(true, false);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  // Transform API data into InterestsSelector format
  const { categories, slugToIdMap } = useMemo(() => {
    if (!allInterests) {
      return { categories: [], slugToIdMap: {} };
    }

    const categoriesData: Array<{ title: string; items: string[] }> = [];
    const mapping: Record<string, string> = {}; // slug -> id

    allInterests.forEach((parent: Interest) => {
      if (parent.children && parent.children.length > 0) {
        const items = parent.children.map((child: Interest) => {
          const slug = `#${child.slug}`;
          mapping[slug] = child.id;
          return slug;
        });

        categoriesData.push({
          title: parent.name,
          items,
        });
      }
    });

    return { categories: categoriesData, slugToIdMap: mapping };
  }, [allInterests]);

  // Transform user interests into initial selected slugs
  const initialSelectedSlugs = useMemo(() => {
    if (!userInterests || !allInterests) return [];

    const userInterestIds = new Set(userInterests.map((interest) => interest.id));
    const slugs: string[] = [];

    allInterests.forEach((parent: Interest) => {
      parent.children?.forEach((child: Interest) => {
        if (userInterestIds.has(child.id)) {
          slugs.push(`#${child.slug}`);
        }
      });
    });

    return slugs;
  }, [userInterests, allInterests]);

  // Handle selection changes from InterestsSelector
  const handleSelectionChange = (selectedSlugs: string[]) => {
    setSelectedSlugs(selectedSlugs);

    // Convert slugs back to IDs and notify parent
    const selectedIds = selectedSlugs.map((slug) => slugToIdMap[slug]).filter(Boolean);
    onInterestsSelected?.(selectedIds);
  };

  if (isLoadingAllInterests || isLoadingUserInterests) {
    return (
      <motion.div
        key='interests'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className='w-full'
      >
        <OnboardingHeader
          title='What are you interested in?'
          description='Select topics to personalize your feed (you can skip this step)'
        />
        <div className='mt-6 space-y-5'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='space-y-2.5'>
              <Skeleton className='h-5 w-28 rounded' />
              <div className='flex flex-wrap gap-2'>
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className='h-8 w-20 rounded-full' />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key='interests'
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className='w-full'
    >
      <OnboardingHeader
        title='What are you interested in?'
        description='Select topics to personalize your feed (you can skip this step)'
      />
      <div className='mt-6'>
        <InterestsSelector
          categories={categories}
          initialSelectedInterests={initialSelectedSlugs}
          onChange={handleSelectionChange}
          hideTitle
          contentClassName=''
        />
      </div>
    </motion.div>
  );
};
