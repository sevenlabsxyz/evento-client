'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useUserFollowers } from '@/lib/hooks/use-user-profile';
import { UserDetails } from '@/lib/types/api';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowRight, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import QuickProfileSheet from '../ui/quick-profile-sheet';
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

  const handleUserClick = useCallback((username: string) => {
    const user = filteredFollowers.find((follower) => follower.username === username);
    if (user) {
      setSelectedUser(user);
      // Don't close the parent sheet immediately to avoid race conditions
      // Let the QuickProfileSheet handle the UX flow
    }
  }, [filteredFollowers]);

  const handleMessageClick = useCallback((userId: string) => {
    router.push(`/e/messages?user=${userId}`);
    onClose();
  }, [router, onClose]);

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
                            <Avatar className='FollowersSheet-userAvatar'>
                              <AvatarImage
                                src={follower.image || ''}
                                alt={follower.name || follower.username}
                              />
                              <AvatarFallback>
                                <Image
                                  width={32}
                                  height={32}
                                  src='/assets/img/evento-sublogo.svg'
                                  alt='Evento'
                                />
                              </AvatarFallback>
                            </Avatar>
                            <div className='FollowersSheet-userDetails'>
                              <div className='FollowersSheet-userInfo'>
                                <div className='FollowersSheet-username'>@{follower.username}</div>
                                {follower.verification_status === 'verified' && (
                                  <div className='FollowersSheet-verified'>✓</div>
                                )}
                              </div>
                              <div className='FollowersSheet-name'>
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
