'use client';
import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useUserFollowing } from '@/lib/hooks/use-user-profile';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { UserAvatar } from '../ui/user-avatar';
import './followers-sheet.css';

interface FollowingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export default function FollowingSheet({ isOpen, onClose, userId, username }: FollowingSheetProps) {
  const [activeDetent, setActiveDetent] = useState(0);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const { data: following, isLoading, error } = useUserFollowing(userId);

  // Filter following based on search query
  const filteredFollowing = useMemo(() => {
    if (!following) return [];
    if (!searchText.trim()) return following;

    const query = searchText.toLowerCase();
    return following.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) || user.name?.toLowerCase().includes(query)
    );
  }, [following, searchText]);

  const handleUserClick = (username: string) => {
    router.push(`/${username}`);
    onClose();
  };

  const handleMessageClick = (userId: string) => {
    router.push(`/e/messages?user=${userId}`);
    onClose();
  };

  return (
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
                  Following
                </SheetWithDetent.Title>
              </VisuallyHidden.Root>
              <input
                className='FollowersSheet-input'
                type='text'
                placeholder='Search following'
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
                        <div className='FollowersSheet-loadingAvatar' />
                        <div className='FollowersSheet-loadingDetails'>
                          <div className='FollowersSheet-loadingLine' />
                          <div className='FollowersSheet-loadingLine FollowersSheet-loadingLine--short' />
                        </div>
                      </div>
                    ))
                  ) : error ? (
                    // Error State
                    <div className='FollowersSheet-errorContainer'>
                      <div className='FollowersSheet-errorText'>Failed to load following</div>
                    </div>
                  ) : filteredFollowing.length === 0 ? (
                    // Empty State
                    <div className='FollowersSheet-emptyContainer'>
                      <div className='FollowersSheet-emptyText'>
                        {searchText.trim()
                          ? `No following found matching "${searchText}"`
                          : `@${username} is not following anyone yet`}
                      </div>
                    </div>
                  ) : (
                    // Following List
                    filteredFollowing.map((user, index) => (
                      <div
                        key={user.id || `following-${index}`}
                        className='FollowersSheet-userContainer'
                      >
                        <button
                          onClick={() => handleUserClick(user.username)}
                          className='FollowersSheet-userButton'
                        >
                          <UserAvatar
                            user={{
                              name: user.name || undefined,
                              username: user.username || undefined,
                              image: user.image || undefined,
                              verification_status: user.verification_status || null,
                            }}
                            size='sm'
                          />
                          <div className='min-w-0 flex-1'>
                            <div className='truncate text-sm font-medium'>@{user.username}</div>
                            <div className='truncate text-xs text-gray-500'>
                              {user.name || user.username}
                            </div>
                          </div>
                        </button>
                        <div className='FollowersSheet-actions'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='FollowersSheet-actionButton'
                            onClick={() => handleMessageClick(user.id)}
                          >
                            <MessageCircle className='FollowersSheet-actionIcon' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='FollowersSheet-actionButton'
                            onClick={() => handleUserClick(user.username)}
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
  );
}
