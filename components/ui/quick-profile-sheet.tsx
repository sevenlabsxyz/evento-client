'use client';

import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ProfileActions } from '@/components/ui/quick-profile/profile-actions';
import { ProfileHeader } from '@/components/ui/quick-profile/profile-header';
import { ProfileInfo } from '@/components/ui/quick-profile/profile-info';
import { ProfileStats } from '@/components/ui/quick-profile/profile-stats';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { ZapSheet } from '@/components/zap/zap-sheet';
import { validateUsername } from '@/lib/design-tokens/colors';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQuickProfileData } from '@/lib/hooks/use-quick-profile-data';
import { useFollowAction } from '@/lib/hooks/use-user-profile';
import { UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface QuickProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetails;
}

export default function QuickProfileSheet({ isOpen, onClose, user }: QuickProfileSheetProps) {
  const router = useRouter();
  const { user: loggedInUser } = useAuth();
  const [isNavigatingToProfile, setIsNavigatingToProfile] = useState(false);

  // Use optimized hook for all profile data
  const { followStatus, eventCount, followers, following, isLoading } = useQuickProfileData(
    user.id
  );
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

  const handleViewFullProfile = useCallback(() => {
    // Validate username before navigation to prevent potential exploits
    if (!validateUsername(user.username)) {
      toast.error('Invalid username format');
      return;
    }

    setIsNavigatingToProfile(true);
    router.push(`/${user.username}`);
  }, [router, user.username]);

  useEffect(() => {
    if (!isOpen) {
      setIsNavigatingToProfile(false);
    }
  }, [isOpen]);

  return (
    <ErrorBoundary>
      <SheetWithDetentFull.Root
        presented={isOpen}
        onPresentedChange={(p) => !p && !isNavigatingToProfile && onClose()}
      >
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className='relative flex flex-col bg-white md:!max-w-[500px]'>
              <div className='sticky top-0 z-10 bg-transparent px-4'>
                <VisuallyHidden.Root asChild>
                  <SheetWithDetentFull.Title className='sr-only'>
                    Quick profile for {user.name || user.username} (@
                    {user.username})
                  </SheetWithDetentFull.Title>
                </VisuallyHidden.Root>
              </div>

              <SheetWithDetentFull.ScrollRoot asChild>
                <SheetWithDetentFull.ScrollView>
                  <SheetWithDetentFull.ScrollContent>
                    <ProfileHeader user={user} />

                    {/* Profile Content */}
                    <div className='flex flex-col gap-4 px-6 pb-6 pt-16'>
                      <ProfileInfo user={user} />

                      <ProfileStats
                        eventCount={eventCount}
                        followingCount={following?.length || 0}
                        followersCount={followers?.length || 0}
                      />

                      <div className='flex flex-col gap-2'>
                        {/* Action Buttons */}
                        {user.username !== loggedInUser?.username && (
                          <>
                            {/* Zap Button - Full Width (uses default ZapSheet button) */}
                            <ZapSheet
                              recipientLightningAddress={`${user.username}@evento.cash`}
                              recipientName={user.name || user.username}
                              recipientUsername={user.username}
                              recipientAvatar={user.image}
                              currentUsername={loggedInUser?.username}
                            />

                            {/* Follow & Message Buttons */}
                            <ProfileActions
                              isFollowing={followStatus?.isFollowing || false}
                              isLoading={isLoading}
                              isPending={followActionMutation.isPending}
                              onFollowToggle={handleFollowToggle}
                              onMessage={handleMessage}
                            />
                          </>
                        )}

                        {/* View Full Profile Button */}
                        <Button
                          onClick={handleViewFullProfile}
                          variant={'link'}
                          className='shadow-none'
                          disabled={isNavigatingToProfile}
                          // className='h-12 w-full rounded-full bg-black text-white hover:bg-gray-900'
                        >
                          {isNavigatingToProfile ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Opening Profile...
                            </>
                          ) : (
                            <>
                              View Full Profile
                              <ArrowRight className='ml-2 h-4 w-4' />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </SheetWithDetentFull.ScrollContent>
                </SheetWithDetentFull.ScrollView>
              </SheetWithDetentFull.ScrollRoot>
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>
    </ErrorBoundary>
  );
}
