'use client';

import { Button } from '@/components/ui/button';
import { InterestsSelector } from '@/components/ui/interest-selector';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAllInterests,
  useReplaceInterests,
  useUserInterests,
} from '@/lib/hooks/use-user-interests';
import { Interest } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface InterestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InterestsSheet({ isOpen, onClose }: InterestsSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const { data: userInterests, isLoading: isLoadingUserInterests } = useUserInterests();
  const { data: allInterests, isLoading: isLoadingAllInterests } = useAllInterests(true, false);
  const replaceInterestsMutation = useReplaceInterests();

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

  // Initialize selected interests when sheet opens
  useEffect(() => {
    if (isOpen && initialSelectedSlugs.length > 0) {
      setSelectedSlugs(initialSelectedSlugs);
    }
  }, [isOpen, initialSelectedSlugs]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.toLowerCase().replace('#', '').includes(query)),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, searchQuery]);

  // Handle selection changes from InterestsSelector
  const handleSelectionChange = (newSelectedSlugs: string[]) => {
    setSelectedSlugs(newSelectedSlugs);
  };

  const handleSave = async () => {
    try {
      // Convert slugs back to IDs
      const selectedIds = selectedSlugs.map((slug) => slugToIdMap[slug]).filter(Boolean);
      await replaceInterestsMutation.mutateAsync(selectedIds);
      toast.success('Interests updated successfully');
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Failed to update interests:', error);
      toast.error('Failed to update interests');
    }
  };

  const handleClose = () => {
    // Reset to original interests
    setSelectedSlugs(initialSelectedSlugs);
    setSearchQuery('');
    onClose();
  };

  const hasChanges = useMemo(() => {
    const currentIds = selectedSlugs
      .map((slug) => slugToIdMap[slug])
      .filter(Boolean)
      .sort();
    const originalIds = (userInterests?.map((i) => i.id) || []).sort();
    return JSON.stringify(currentIds) !== JSON.stringify(originalIds);
  }, [selectedSlugs, slugToIdMap, userInterests]);

  const isSaving = replaceInterestsMutation.isPending;
  const isLoading = isLoadingAllInterests || isLoadingUserInterests;

  return (
    <MasterScrollableSheet
      title='Interests'
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      headerLeft={
        <div>
          <h2 className='text-xl font-semibold'>Interests</h2>
          <p className='text-sm text-gray-500'>
            {selectedSlugs.length} interest{selectedSlugs.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      }
      headerSecondary={
        <div className='px-4 pb-4'>
          <input
            className='w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-300 focus:bg-white'
            type='text'
            placeholder='Search interests...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      }
      contentClassName='px-4 pb-8'
    >
      {isLoading ? (
        // Loading State
        <div className='space-y-4'>
          {[1, 2, 3, 4, 5].map((i) => (
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
      ) : filteredCategories.length === 0 ? (
        // Empty State
        <div className='flex flex-col items-center justify-center py-12'>
          <p className='text-gray-500'>
            {searchQuery.trim()
              ? `No interests found matching "${searchQuery}"`
              : 'No interests available'}
          </p>
        </div>
      ) : (
        // Interests List
        <>
          <InterestsSelector
            categories={filteredCategories}
            initialSelectedInterests={selectedSlugs}
            onChange={handleSelectionChange}
            hideTitle
            className='w-full'
            contentClassName='w-full'
          />

          {/* Save/Cancel Buttons */}
          <div className='mt-6 flex flex-col gap-3'>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className='w-full bg-red-500 text-white hover:bg-red-600'
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
            <Button onClick={handleClose} variant='outline' className='w-full'>
              Cancel
            </Button>
          </div>
        </>
      )}
    </MasterScrollableSheet>
  );
}
