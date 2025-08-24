'use client';

import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ProfileActions } from '@/components/ui/quick-profile/profile-actions';
import { ProfileHeader } from '@/components/ui/quick-profile/profile-header';
import { ProfileInfo } from '@/components/ui/quick-profile/profile-info';
import { ProfileStats } from '@/components/ui/quick-profile/profile-stats';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { designTokens, validateUsername } from '@/lib/design-tokens/colors';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuickProfileData } from '@/lib/hooks/use-quick-profile-data';
import { useFollowAction } from '@/lib/hooks/use-user-profile';
import { UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import TipSheet from '../profile/sheets/tip-sheet';

interface QuickProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetails;
}

export default function QuickProfileSheet({ isOpen, onClose, user }: QuickProfileSheetProps) {
  const router = useRouter();
  const { user: loggedInUser } = useAuth();
  const [showTipSheet, setShowTipSheet] = useState(false);

  // Use optimized hook for all profile data
  const { followStatus, eventCount, followers, following, isLoading } = useQuickProfileData(user.id);
  const followActionMutation = useFollowAction();

  const handleFollowToggle = useCallback(() => {
    const action = followStatus?.isFollowing ? 'unfollow' : 'follow';

    followActionMutation.mutate(
      { userId: user.id, action },
      {
        onSuccess: () => {
          if (action === 'follow') {
            toast.success(`You followed ${user.name || 'this user'}!`);
          } else {
            toast.success(`You unfollowed ${user.name || 'this user'}`);
          }
        },
        onError: () => {
          toast.error(`Failed to ${action}. Please try again.`);
        },
      }
    );
  }, [followStatus?.isFollowing, followActionMutation, user.id, user.name]);

  const handleMessage = useCallback(() => {
    toast.success('Message feature coming soon!');
  }, []);

  const handleTip = useCallback(() => {
    if (!user.ln_address) {
      toast.error("This user hasn't set up Lightning payments yet");
      return;
    }
    setShowTipSheet(true);
  }, [user.ln_address]);

  const handleViewFullProfile = useCallback(() => {
    // Validate username before navigation to prevent potential exploits
    if (!validateUsername(user.username)) {
      toast.error('Invalid username format');
      return;
    }
    router.push(`/${user.username}`);
    onClose();
  }, [router, user.username, onClose]);

  return (
    <ErrorBoundary>
      <SheetWithDetent.Root presented={isOpen} onPresentedChange={(p) => !p && onClose()}>
        <SheetWithDetent.Portal>
          <SheetWithDetent.View>
            <SheetWithDetent.Backdrop />
            <SheetWithDetent.Content className='relative flex flex-col rounded-t-2xl bg-white'>
              <div className='sticky top-0 z-10 rounded-t-3xl bg-transparent px-4 pb-3 pt-3'>
                <div className='mb-3 flex justify-center'>
                  <SheetWithDetent.Handle />
                </div>
                <VisuallyHidden.Root asChild>
                  <SheetWithDetent.Title className='sr-only'>
                    Quick profile for {user.name || user.username} (@{user.username})
                  </SheetWithDetent.Title>
                </VisuallyHidden.Root>
              </div>

              <div className='flex-1 overflow-y-auto pb-6'>
                <ProfileHeader user={user} />

                {/* Profile Content */}
                <div className='px-6 pt-16'>
                  <ProfileInfo user={user} />

                  <ProfileStats
                    eventCount={eventCount}
                    followingCount={following?.length || 0}
                    followersCount={followers?.length || 0}
                  />

                  {/* Action Buttons */}
                  {user.username !== loggedInUser?.username && (
                    <ProfileActions
                      isFollowing={followStatus?.isFollowing || false}
                      isLoading={isLoading}
                      isPending={followActionMutation.isPending}
                      hasLightningAddress={!!user.ln_address}
                      onFollowToggle={handleFollowToggle}
                      onMessage={handleMessage}
                      onTip={handleTip}
                    />
                  )}

                  {/* View Full Profile Button */}
                  <Button
                    onClick={handleViewFullProfile}
                    variant='outline'
                    className='w-full rounded-xl border-gray-300 py-3'
                  >
                    <ArrowRight className='mr-2 h-4 w-4' />
                    View Full Profile
                  </Button>
                </div>
              </div>
            </SheetWithDetent.Content>
          </SheetWithDetent.View>
        </SheetWithDetent.Portal>

        {/* Tip Sheet */}
        {user.ln_address && (
          <TipSheet
            isOpen={showTipSheet}
            onClose={() => setShowTipSheet(false)}
            lightningAddress={user.ln_address}
            recipientName={user.name || 'Unknown User'}
            recipientUsername={user.username}
            recipientImage={user.image}
            recipientVerified={user.verification_status === 'verified'}
          />
        )}
      </SheetWithDetent.Root>
    </ErrorBoundary>
  );
}
