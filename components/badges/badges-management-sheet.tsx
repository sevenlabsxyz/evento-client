'use client';

import { BadgeItem } from '@/components/badges/badge-item';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useBatchUpdateUserBadges, useUserBadges } from '@/lib/hooks/use-badges';
import { UserBadge } from '@/lib/types/badges';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';
import { Check, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface BadgesManagementSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_DISPLAY_SLOTS = 5;

export function BadgesManagementSheet({ isOpen, onClose }: BadgesManagementSheetProps) {
  const { data: userBadges, isLoading } = useUserBadges();
  const batchUpdateMutation = useBatchUpdateUserBadges();

  // Track which badges are in display slots (by badge id)
  const [displaySlots, setDisplaySlots] = useState<(string | null)[]>(
    Array(MAX_DISPLAY_SLOTS).fill(null)
  );

  // Initialize display slots from user badges when data loads
  useEffect(() => {
    if (userBadges && isOpen) {
      const slots: (string | null)[] = Array(MAX_DISPLAY_SLOTS).fill(null);

      userBadges
        .filter((b) => b.display_order !== null)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .forEach((badge) => {
          const order = badge.display_order;
          if (order !== null && order >= 1 && order <= MAX_DISPLAY_SLOTS) {
            slots[order - 1] = badge.id;
          }
        });

      setDisplaySlots(slots);
    }
  }, [userBadges, isOpen]);

  // Get badges that are not in display slots
  const availableBadges = useMemo(() => {
    if (!userBadges) return [];
    const displayedIds = new Set(displaySlots.filter(Boolean));
    return userBadges.filter((b) => !displayedIds.has(b.id));
  }, [userBadges, displaySlots]);

  // Get badge by id
  const getBadgeById = (id: string | null): UserBadge | undefined => {
    if (!id || !userBadges) return undefined;
    return userBadges.find((b) => b.id === id);
  };

  // Handle clicking on a display slot
  const handleSlotClick = (slotIndex: number) => {
    const currentBadgeId = displaySlots[slotIndex];
    if (currentBadgeId) {
      // Remove badge from slot
      const newSlots = [...displaySlots];
      newSlots[slotIndex] = null;
      setDisplaySlots(newSlots);
    }
  };

  // Handle clicking on an available badge
  const handleBadgeClick = (badgeId: string) => {
    // Find first empty slot
    const emptySlotIndex = displaySlots.findIndex((slot) => slot === null);
    if (emptySlotIndex === -1) {
      toast.error('All display slots are full. Remove a badge first.');
      return;
    }

    // Add badge to first empty slot
    const newSlots = [...displaySlots];
    newSlots[emptySlotIndex] = badgeId;
    setDisplaySlots(newSlots);
  };

  // Check if there are changes
  const hasChanges = useMemo(() => {
    if (!userBadges) return false;

    const currentDisplayed = userBadges
      .filter((b) => b.display_order !== null)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((b) => b.id);

    const newDisplayed = displaySlots.filter(Boolean);

    if (currentDisplayed.length !== newDisplayed.length) return true;
    return JSON.stringify(currentDisplayed) !== JSON.stringify(newDisplayed);
  }, [userBadges, displaySlots]);

  const handleSave = async () => {
    if (!userBadges) return;

    try {
      // Build updates: set display_order for badges in slots, null for others
      const updates: Array<{ badgeId: string; display_order: number | null }> = [];

      // Set display_order for badges in slots
      displaySlots.forEach((badgeId, index) => {
        if (badgeId) {
          updates.push({ badgeId, display_order: index + 1 });
        }
      });

      // Set display_order to null for badges removed from display
      const displayedIds = new Set(displaySlots.filter(Boolean));
      userBadges
        .filter((b) => b.display_order !== null && !displayedIds.has(b.id))
        .forEach((badge) => {
          updates.push({ badgeId: badge.id, display_order: null });
        });

      await batchUpdateMutation.mutateAsync(updates);
      toast.success('Badges updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update badges:', error);
      toast.error('Failed to update badges');
    }
  };

  const handleClose = () => {
    // Reset to original state
    if (userBadges) {
      const slots: (string | null)[] = Array(MAX_DISPLAY_SLOTS).fill(null);
      userBadges
        .filter((b) => b.display_order !== null)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .forEach((badge) => {
          const order = badge.display_order;
          if (order !== null && order >= 1 && order <= MAX_DISPLAY_SLOTS) {
            slots[order - 1] = badge.id;
          }
        });
      setDisplaySlots(slots);
    }
    onClose();
  };

  const displayCount = displaySlots.filter(Boolean).length;
  const isSaving = batchUpdateMutation.isPending;

  return (
    <MasterScrollableSheet
      title='Badges'
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      headerLeft={
        <div>
          <h2 className='text-xl font-semibold'>Manage Badges</h2>
          <p className='text-sm text-gray-500'>
            {displayCount} of {MAX_DISPLAY_SLOTS} slots used
          </p>
        </div>
      }
      contentClassName='px-4 pb-8'
    >
      {isLoading ? (
        <div className='space-y-6'>
          <div className='space-y-3'>
            <Skeleton className='h-5 w-32' />
            <div className='flex gap-3'>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className='h-14 w-14 rounded-full' />
              ))}
            </div>
          </div>
          <div className='space-y-3'>
            <Skeleton className='h-5 w-32' />
            <div className='flex flex-wrap gap-3'>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className='h-14 w-14 rounded-full' />
              ))}
            </div>
          </div>
        </div>
      ) : !userBadges || userBadges.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12'>
          <p className='text-gray-500'>You haven&apos;t earned any badges yet.</p>
          <p className='text-sm text-gray-400'>Keep using Evento to earn badges!</p>
        </div>
      ) : (
        <>
          {/* Display Slots Section */}
          <div className='mb-8'>
            <h3 className='mb-3 text-sm font-semibold text-gray-700'>Display on Profile</h3>
            <p className='mb-4 text-xs text-gray-500'>
              Tap a slot to remove a badge. Badges appear on your profile in this order.
            </p>
            <div className='flex gap-3'>
              {displaySlots.map((badgeId, index) => {
                const badge = getBadgeById(badgeId);
                return (
                  <button
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    className={cn(
                      'relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed transition-colors',
                      badge
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    )}
                  >
                    {badge ? (
                      <>
                        <BadgeItem badge={badge.badge} size='md' />
                        <div className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white'>
                          <X className='h-3 w-3' />
                        </div>
                      </>
                    ) : (
                      <span className='text-lg font-medium text-gray-400'>{index + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Badges Section */}
          {availableBadges.length > 0 && (
            <div className='mb-8'>
              <h3 className='mb-3 text-sm font-semibold text-gray-700'>Available Badges</h3>
              <p className='mb-4 text-xs text-gray-500'>
                Tap a badge to add it to your profile display.
              </p>
              <div className='flex flex-wrap gap-4'>
                {availableBadges.map((userBadge) => (
                  <button
                    key={userBadge.id}
                    onClick={() => handleBadgeClick(userBadge.id)}
                    className='relative transition-transform hover:scale-105 active:scale-95'
                  >
                    <BadgeItem badge={userBadge.badge} size='md' showDescription={true} />
                    <div className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white'>
                      <Check className='h-3 w-3' />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
