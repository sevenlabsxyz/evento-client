'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAllInterests,
  useReplaceInterests,
  useUserInterests,
} from '@/lib/hooks/use-user-interests';
import { Interest } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InterestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InterestsSheet({ isOpen, onClose }: InterestsSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);

  const { data: userInterests, isLoading: isLoadingUserInterests } = useUserInterests();
  const { data: allInterests, isLoading: isLoadingAllInterests } = useAllInterests(true, false);
  const replaceInterestsMutation = useReplaceInterests();

  // Initialize selected interests when sheet opens
  useEffect(() => {
    if (isOpen && userInterests) {
      const ids = userInterests.map((interest) => interest.id);
      setSelectedInterestIds(ids);
    }
  }, [isOpen, userInterests]);

  const handleToggleInterest = (interestId: string) => {
    setSelectedInterestIds((prev) =>
      prev.includes(interestId) ? prev.filter((id) => id !== interestId) : [...prev, interestId]
    );
  };

  const handleSave = async () => {
    try {
      await replaceInterestsMutation.mutateAsync(selectedInterestIds);
      toast.success('Interests updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update interests:', error);
      toast.error('Failed to update interests');
    }
  };

  const handleCancel = () => {
    // Reset to original interests
    if (userInterests) {
      const ids = userInterests.map((interest) => interest.id);
      setSelectedInterestIds(ids);
    }
    setSearchQuery('');
    onClose();
  };

  // Filter interests based on search query
  const filteredParentInterests =
    allInterests?.filter((parent) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();

      // Check if parent matches
      const parentMatches =
        parent.name.toLowerCase().includes(query) ||
        parent.description?.toLowerCase().includes(query);

      // Check if any child matches
      const childMatches = parent.children?.some(
        (child) =>
          child.name.toLowerCase().includes(query) ||
          child.description?.toLowerCase().includes(query)
      );

      return parentMatches || childMatches;
    }) || [];

  // Build child interests map with filtered children
  const childInterestsByParent: Record<string, Interest[]> = {};
  filteredParentInterests.forEach((parent) => {
    if (parent.children && parent.children.length > 0) {
      // Filter children based on search query
      const filteredChildren = searchQuery
        ? parent.children.filter((child) => {
            const query = searchQuery.toLowerCase();
            return (
              child.name.toLowerCase().includes(query) ||
              child.description?.toLowerCase().includes(query)
            );
          })
        : parent.children;

      if (filteredChildren.length > 0) {
        childInterestsByParent[parent.id] = filteredChildren;
      }
    }
  });

  const parentInterests = filteredParentInterests;

  const hasChanges =
    JSON.stringify(selectedInterestIds.sort()) !==
    JSON.stringify(userInterests?.map((i) => i.id).sort() || []);
  const isSaving = replaceInterestsMutation.isPending;

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleCancel()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            {/* Header */}
            <div className='sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pb-4 pt-4'>
              <div className='flex items-center justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>Interests</h2>
                <button onClick={handleCancel} className='rounded-full p-2 hover:bg-gray-100'>
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* Search bar */}
              <div className='relative mt-4'>
                <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search interests...'
                  className='w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
              </div>

              {/* Selected count */}
              <p className='mt-2 text-sm text-gray-500'>
                {selectedInterestIds.length} interest
                {selectedInterestIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Content */}
            <SheetWithDetentFull.ScrollRoot>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent className='p-4'>
                  {isLoadingAllInterests || isLoadingUserInterests ? (
                    <div className='space-y-4'>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className='space-y-2'>
                          <Skeleton className='h-12 w-full' />
                          <div className='ml-4 space-y-2'>
                            <Skeleton className='h-10 w-full' />
                            <Skeleton className='h-10 w-full' />
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
                            <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                              {parent.name}
                            </h3>

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
                                        ? 'bg-gray-900 text-white'
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

                  {/* Save/Cancel Buttons */}
                  <div className='mt-6 flex flex-col gap-3'>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                      className='flex-1 bg-red-500 text-white hover:bg-red-600'
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
                    <Button onClick={handleCancel} variant='outline' className='flex-1'>
                      Cancel
                    </Button>
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
