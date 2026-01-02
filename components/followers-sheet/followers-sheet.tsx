'use client';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserFollowers } from '@/lib/hooks/use-user-profile';
import { UserDetails } from '@/lib/types/api';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';
import { UserAvatar } from '../ui/user-avatar';

interface FollowersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export default function FollowersSheet({ isOpen, onClose, userId, username }: FollowersSheetProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

  const router = useRouter();
  const { data: followers, isLoading, error } = useUserFollowers(userId);

  // Filter followers based on search query
  const filteredFollowers = useMemo(() => {
    if (!followers) return [];
    if (!searchText.trim()) return followers;

    const query = searchText.toLowerCase();
    return followers.filter(
      (follower) =>
        follower.username?.toLowerCase().includes(query) ||
        follower.name?.toLowerCase().includes(query)
    );
  }, [followers, searchText]);

  const handleUserClick = useCallback(
    (username: string) => {
      const user = filteredFollowers.find((follower) => follower.username === username);
      if (user) {
        setSelectedUser(user);
        // Don't close the parent sheet immediately to avoid race conditions
        // Let the QuickProfileSheet handle the UX flow
      }
    },
    [filteredFollowers]
  );

  const handleMessageClick = useCallback(
    (userId: string) => {
      router.push(`/e/messages?user=${userId}`);
      onClose();
    },
    [router, onClose]
  );

  return (
    <>
      <MasterScrollableSheet
        title='Followers'
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        contentClassName='p-0'
      >
        <div className='border-b border-gray-200 px-5 pb-3'>
          <input
            className='box-border h-11 w-full appearance-none rounded-xl border-none bg-gray-200 px-3 text-lg text-gray-800 outline-none placeholder:text-gray-500'
            type='text'
            placeholder='Search followers'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className='grid gap-5 p-5'>
          {isLoading ? (
            // Loading State
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`loading-${index}`} className='grid grid-flow-col justify-start gap-3.5'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-3 w-24' />
                </div>
              </div>
            ))
          ) : error ? (
            // Error State
            <div className='flex items-center justify-center px-4 py-12'>
              <div className='text-center text-base text-red-500'>Failed to load followers</div>
            </div>
          ) : filteredFollowers.length === 0 ? (
            // Empty State
            <div className='flex items-center justify-center px-4 py-12'>
              <div className='text-center text-base text-gray-500'>
                {searchText.trim()
                  ? `No followers found matching "${searchText}"`
                  : `@${username} has no followers yet`}
              </div>
            </div>
          ) : (
            // Followers List
            filteredFollowers.map((follower, index) => (
              <div
                key={follower.id || `follower-${index}`}
                className='grid grid-cols-[1fr_auto] items-center gap-4'
              >
                <button
                  onClick={() => handleUserClick(follower.username)}
                  className='grid w-full cursor-pointer grid-flow-col justify-start gap-3.5 border-none bg-transparent text-left hover:opacity-80'
                >
                  <UserAvatar
                    user={{
                      name: follower.name || undefined,
                      username: follower.username || undefined,
                      image: follower.image || undefined,
                      verification_status: follower.verification_status || null,
                    }}
                    size='sm'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium'>@{follower.username}</div>
                    <div className='truncate text-xs text-gray-500'>
                      {follower.name || follower.username}
                    </div>
                  </div>
                </button>
                <div className='flex gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-10 w-10 border border-gray-200 bg-gray-100 hover:bg-gray-200'
                    onClick={() => handleMessageClick(follower.id)}
                  >
                    <MessageCircle className='h-4 w-4 text-gray-500' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-10 w-10 border border-gray-200 bg-gray-100 hover:bg-gray-200'
                    onClick={() => handleUserClick(follower.username)}
                  >
                    <ArrowRight className='h-4 w-4 text-gray-500' />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </MasterScrollableSheet>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </>
  );
}
