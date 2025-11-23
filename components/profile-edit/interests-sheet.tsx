'use client';

import { Button } from '@/components/ui/button';
import { InterestsSelector } from '@/components/ui/interest-selector';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAllInterests,
  useReplaceInterests,
  useUserInterests,
} from '@/lib/hooks/use-user-interests';
import { Interest } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './interests-sheet.css';

interface InterestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InterestsSheet({ isOpen, onClose }: InterestsSheetProps) {
  const [activeDetent, setActiveDetent] = useState(2); // Start full screen
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
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className='InterestsSheet-content'>
            <div className='InterestsSheet-header'>
              <SheetWithDetent.Handle className='InterestsSheet-handle' />
              <VisuallyHidden.Root asChild>
                <SheetWithDetent.Title className='InterestsSheet-title'>
                  Interests
                </SheetWithDetent.Title>
              </VisuallyHidden.Root>
              <input
                className='InterestsSheet-input'
                type='text'
                placeholder='Search interests...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p className='InterestsSheet-count'>
                {selectedSlugs.length} interest{selectedSlugs.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <SheetWithDetent.ScrollRoot asChild>
              <SheetWithDetent.ScrollView className='InterestsSheet-scrollView'>
                <SheetWithDetent.ScrollContent className='InterestsSheet-scrollContent'>
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
                    <div className='InterestsSheet-emptyContainer'>
                      <div className='InterestsSheet-emptyText'>
                        {searchQuery.trim()
                          ? `No interests found matching "${searchQuery}"`
                          : 'No interests available'}
                      </div>
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
                      <div className='InterestsSheet-buttonContainer'>
                        <Button
                          onClick={handleSave}
                          disabled={!hasChanges || isSaving}
                          className='InterestsSheet-saveButton'
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
                </SheetWithDetent.ScrollContent>
              </SheetWithDetent.ScrollView>
            </SheetWithDetent.ScrollRoot>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
