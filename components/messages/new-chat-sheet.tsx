'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useSearchUsers, useUserFollowing, useUserProfile } from '@/lib/hooks/use-user-profile';
import { streamChatService } from '@/lib/services/stream-chat';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { MessageCircle, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SheetWithDetentFull } from '../ui/sheet-with-detent-full';

interface NewChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewChatSheet({ isOpen, onClose }: NewChatSheetProps) {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const { user } = useUserProfile();
  const currentUserId = user?.id || '';

  const { data: following, isLoading: isLoadingFollowing } = useUserFollowing(currentUserId);
  const { mutate: searchUsers, data: searchResults, isPending: isSearching } = useSearchUsers();

  const onSearchChange = (value: string) => {
    setSearchText(value);
  };

  // Debounce search text to reduce API calls
  const debouncedSearch = useDebounce(searchText, 400);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length >= 2) {
      searchUsers(q);
    }
  }, [debouncedSearch, searchUsers]);

  const suggestions = useMemo(() => {
    if (!following) return [];
    // show up to 5 followings as suggestions
    return following.slice(0, 5);
  }, [following]);

  const listToRender = useMemo(() => {
    if (debouncedSearch.trim().length >= 2) {
      return Array.isArray(searchResults) ? searchResults : [];
    }
    return suggestions;
  }, [searchResults, suggestions, debouncedSearch]);

  const isLoading = isLoadingFollowing || (debouncedSearch.trim().length >= 2 && isSearching);

  const handleStartChat = async (recipientId: string) => {
    try {
      const res = await streamChatService.createDirectMessageChannel(recipientId);
      if (res?.channel?.id) {
        onClose();
        router.push(`/e/messages/${res.channel.id}`);
      } else {
        toast.error('No channel id returned.', 'Unable to start chat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Please try again.', 'Failed to start chat');
      console.error('createDirectMessageChannel error', err);
    }
  };

  return (
    <SheetWithDetentFull.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='rounded-t-2xl bg-white'>
            <div className='sticky top-0 z-10 border-b bg-white px-4 pb-3 pt-3'>
              <div className='mb-3 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <VisuallyHidden.Root asChild>
                <SheetWithDetentFull.Title className='sr-only'>
                  New Message
                </SheetWithDetentFull.Title>
              </VisuallyHidden.Root>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <input
                  className='w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-red-500'
                  type='text'
                  placeholder='Search users'
                  value={searchText}
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label='Search users'
                />
              </div>
            </div>
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='max-h-[70vh] overflow-y-auto'>
                <SheetWithDetentFull.ScrollContent className='py-2'>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={`loading-${index}`} className='flex items-center px-4 py-3'>
                        <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200' />
                        <div className='ml-3 flex-1'>
                          <div className='h-3 w-40 animate-pulse rounded bg-gray-200' />
                          <div className='mt-2 h-3 w-24 animate-pulse rounded bg-gray-200' />
                        </div>
                      </div>
                    ))
                  ) : (listToRender?.length || 0) === 0 ? (
                    <div className='py-12 text-center text-sm text-gray-500'>
                      <div>
                        {searchText.trim()
                          ? `No users found for "${searchText}"`
                          : 'No suggestions'}
                      </div>
                    </div>
                  ) : (
                    listToRender.map((u: any, index: number) => (
                      <div
                        key={u.id || `user-${index}`}
                        className='group flex items-center justify-between px-4 py-2 hover:bg-gray-100'
                      >
                        <button
                          onClick={() => handleStartChat(u.id)}
                          className='flex min-w-0 flex-1 items-center gap-3 text-left'
                        >
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={u.image || ''} alt={u.name || u.username} />
                            <AvatarFallback>
                              <Image
                                src='/assets/img/evento-sublogo.svg'
                                alt='Evento'
                                width={32}
                                height={32}
                              />
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0 flex-1'>
                            <div className='flex items-center gap-1'>
                              <div className='truncate text-sm font-medium'>@{u.username}</div>
                              {u.verification_status === 'verified' && (
                                <div className='flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white'>
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className='truncate text-xs text-gray-500'>
                              {u.name || u.username}
                            </div>
                          </div>
                        </button>
                        <div className='ml-2'>
                          <Button
                            variant='secondary'
                            size='icon'
                            onClick={() => handleStartChat(u.id)}
                            className='group-hover:bg-gray-200'
                          >
                            <MessageCircle className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
