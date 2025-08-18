'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useFollowAction,
  useFollowStatus,
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
} from '@/lib/hooks/use-user-profile';
import { UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, MessageCircle, UserMinus, UserPlus, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TipSheet from '../profile/sheets/tip-sheet';
import SocialLinks from '../profile/social-links';

interface QuickProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetails;
}

export default function QuickProfileSheet({ isOpen, onClose, user }: QuickProfileSheetProps) {
  const router = useRouter();
  const { user: loggedInUser } = useAuth();
  const [showTipSheet, setShowTipSheet] = useState(false);

  // Get follow status and counts
  const { data: followStatus, isLoading: isFollowStatusLoading } = useFollowStatus(user.id);
  const followActionMutation = useFollowAction();
  const { data: eventCount = 0 } = useUserEventCount(user.id);
  const { data: followers = [] } = useUserFollowers(user.id);
  const { data: following = [] } = useUserFollowing(user.id);

  const handleFollowToggle = () => {
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
  };

  const handleMessage = () => {
    toast.success('Message feature coming soon!');
  };

  const handleTip = () => {
    if (!user.ln_address) {
      toast.error("This user hasn't set up Lightning payments yet");
      return;
    }
    setShowTipSheet(true);
  };

  const handleViewFullProfile = () => {
    router.push(`/${user.username}`);
    onClose();
  };

  return (
    <SheetWithDetent.Root presented={isOpen} onPresentedChange={(p) => !p && onClose()}>
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className='relative flex flex-col rounded-t-2xl bg-white'>
            {/* Red Banner */}
            <div className='absolute left-0 right-0 top-0 h-32 w-full bg-gradient-to-br from-red-400 to-red-600' />

            <div className='sticky top-0 z-10 rounded-t-3xl bg-transparent px-4 pb-3 pt-3'>
              <div className='mb-3 flex justify-center'>
                <SheetWithDetent.Handle />
              </div>
              <VisuallyHidden.Root asChild>
                <SheetWithDetent.Title className='sr-only'>
                  {user.name || user.username} Profile
                </SheetWithDetent.Title>
              </VisuallyHidden.Root>
            </div>

            <div className='flex-1 overflow-y-auto pb-6'>
              <div className='relative h-28'>
                {/* Profile Picture - Centered & Overlapping */}
                <UserAvatar
                  user={{
                    name: user.name,
                    username: user.username,
                    image: user.image,
                    verification_status: user.verification_status,
                  }}
                  size='lg'
                  className='absolute -bottom-12 left-1/2 -translate-x-1/2 transform'
                />
              </div>

              {/* Profile Content */}
              <div className='px-6 pt-16'>
                {/* User Info - Centered */}
                <div className='mb-3 text-center'>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    {user.name || 'Unknown User'}
                  </h2>
                  <p className='text-gray-600'>@{user.username}</p>
                </div>

                {/* Stats - Centered */}
                <div className='mb-3 flex justify-center'>
                  <div className='grid grid-cols-3 gap-8'>
                    <div className='text-center'>
                      <div className='text-xl font-bold text-gray-900'>{eventCount}</div>
                      <div className='text-sm text-gray-500'>Events</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-xl font-bold text-gray-900'>
                        {following?.length || 0}
                      </div>
                      <div className='text-sm text-gray-500'>Following</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-xl font-bold text-gray-900'>
                        {followers?.length || 0}
                      </div>
                      <div className='text-sm text-gray-500'>Followers</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {user.username !== loggedInUser?.username && (
                  <div className='mb-3 flex gap-2'>
                    <Button
                      onClick={handleFollowToggle}
                      disabled={isFollowStatusLoading || followActionMutation.isPending}
                      className={`flex-1 rounded-xl ${
                        followStatus?.isFollowing
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {followStatus?.isFollowing ? (
                        <>
                          <UserMinus className='mr-2 h-4 w-4' />
                          {followActionMutation.isPending ? 'Unfollowing...' : 'Following'}
                        </>
                      ) : (
                        <>
                          <UserPlus className='mr-2 h-4 w-4' />
                          {followActionMutation.isPending ? 'Following...' : 'Follow'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={handleMessage}
                      className='rounded-xl bg-transparent px-4'
                    >
                      <MessageCircle className='mr-2 h-4 w-4' />
                      Message
                    </Button>
                    {user.ln_address && (
                      <Button
                        variant='outline'
                        onClick={handleTip}
                        className='group rounded-xl bg-transparent px-4 transition-colors hover:border-orange-300 hover:bg-orange-100 hover:text-orange-700'
                      >
                        <Zap className='mr-2 h-4 w-4 text-black transition-colors group-hover:text-orange-700' />
                        Tip
                      </Button>
                    )}
                  </div>
                )}

                {/* Social Links */}
                <div className='mb-3'>
                  <SocialLinks
                    user={{
                      bio_link: user.bio_link,
                      instagram_handle: user.instagram_handle,
                      x_handle: user.x_handle,
                      ln_address: user.ln_address,
                      nip05: user.nip05,
                    }}
                  />
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className='mb-3 rounded-xl bg-gray-50 p-4'>
                    <h4 className='mb-2 text-sm font-semibold text-gray-900'>Bio</h4>
                    <p className='text-sm text-gray-700'>{user.bio}</p>
                  </div>
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
  );
}
