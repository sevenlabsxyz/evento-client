'use client';
import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserFollowers } from '@/lib/hooks/use-user-profile';
import { UserDetails } from '@/lib/types/api';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';
import { UserAvatar } from '../ui/user-avatar';
import './followers-sheet.css';

interface FollowersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export default function FollowersSheet({ isOpen, onClose, userId, username }: FollowersSheetProps) {
  const [activeDetent, setActiveDetent] = useState(0);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

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
      <SheetWithDetent.Root
        presented={isOpen}
        onPresentedChange={(presented) => !presented && onClose()}
        activeDetent={activeDetent}
        onActiveDetentChange={setActiveDetent}
      >
        <SheetWithDetent.Portal>
          <SheetWithDetent.View>
            <SheetWithDetent.Backdrop />
            <SheetWithDetent.Content className='FollowersSheet-content'>
              <div className='FollowersSheet-header'>
                <SheetWithDetent.Handle className='FollowersSheet-handle' />
                <VisuallyHidden.Root asChild>
                  <SheetWithDetent.Title className='FollowersSheet-title'>
                    Followers
                  </SheetWithDetent.Title>
                </VisuallyHidden.Root>
                <input
                  className='FollowersSheet-input'
                  type='text'
                  placeholder='Search followers'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onFocus={() => setActiveDetent(2)}
                />
              </div>
              <SheetWithDetent.ScrollRoot asChild>
                <SheetWithDetent.ScrollView className='FollowersSheet-scrollView'>
                  <SheetWithDetent.ScrollContent className='FollowersSheet-scrollContent'>
                    {isLoading ? (
                      // Loading State
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={`loading-${index}`} className='FollowersSheet-loadingContainer'>
                          <Skeleton className='h-10 w-10 rounded-full' />
                          <div className='flex-1 space-y-2'>
                            <Skeleton className='h-4 w-40' />
                            <Skeleton className='h-3 w-24' />
                          </div>
                        </div>
                      ))
                    ) : error ? (
                      // Error State
                      <div className='FollowersSheet-errorContainer'>
                        <div className='FollowersSheet-errorText'>Failed to load followers</div>
                      </div>
                    ) : filteredFollowers.length === 0 ? (
                      // Empty State
                      <div className='FollowersSheet-emptyContainer'>
                        <div className='FollowersSheet-emptyText'>
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
                          className='FollowersSheet-userContainer'
                        >
                          <button
                            onClick={() => handleUserClick(follower.username)}
                            className='FollowersSheet-userButton'
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
                              <div className='truncate text-sm font-medium'>
                                @{follower.username}
                              </div>
                              <div className='truncate text-xs text-gray-500'>
                                {follower.name || follower.username}
                              </div>
                            </div>
                          </button>
                          <div className='FollowersSheet-actions'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='FollowersSheet-actionButton'
                              onClick={() => handleMessageClick(follower.id)}
                            >
                              <MessageCircle className='FollowersSheet-actionIcon' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='FollowersSheet-actionButton'
                              onClick={() => handleUserClick(follower.username)}
                            >
                              <ArrowRight className='FollowersSheet-actionIcon' />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </SheetWithDetent.ScrollContent>
                </SheetWithDetent.ScrollView>
              </SheetWithDetent.ScrollRoot>
            </SheetWithDetent.Content>
          </SheetWithDetent.View>
        </SheetWithDetent.Portal>
      </SheetWithDetent.Root>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => {
            setSelectedUser(null);
            // Close parent sheet after QuickProfile closes for better UX
            onClose();
          }}
          user={selectedUser}
        />
      )}
    </>
  );
}
