'use client';

import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Navbar } from '@/components/navbar';
import QuickProfileSheet from '@/components/ui/quick-profile-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useUserSearch } from '@/lib/hooks/use-search';
import { useTopBar } from '@/lib/stores/topbar-store';
import { UserDetails, UserSearchResult } from '@/lib/types/api';
import { Search, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SEARCH_LENGTH = 2;

export default function SearchPage() {
  const pathname = usePathname();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const [searchText, setSearchText] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const topInputRef = useRef<HTMLTextAreaElement>(null);

  const debouncedSearch = useDebounce(searchText, 400);
  const { mutate: search, data: results, isPending, reset } = useUserSearch();

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Search',
      leftMode: 'menu',
      centerMode: 'title',
      showAvatar: false,
      buttons: [],
    });
    return () => clearRoute(pathname);
  }, [pathname, setTopBarForRoute, clearRoute, applyRouteConfig]);

  useEffect(() => {
    const query = debouncedSearch.trim();
    if (query.length >= MIN_SEARCH_LENGTH) {
      search(query);
    } else {
      reset();
    }
  }, [debouncedSearch, search, reset]);

  useEffect(() => {
    if (hasSubmitted && topInputRef.current) {
      topInputRef.current.focus();
    }
  }, [hasSubmitted]);

  const handleUserClick = useCallback((user: UserSearchResult) => {
    const userDetails: UserDetails = {
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: '',
      verification_status: user.verification_status as UserDetails['verification_status'],
    };
    setSelectedUser(userDetails);
  }, []);

  const handlePromptSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (text.length > 0) {
        setSearchText(text);
        setHasSubmitted(true);
        if (text.length >= MIN_SEARCH_LENGTH) {
          search(text);
        }
      }
    },
    [search]
  );

  const handleTopInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSearchText(e.target.value);
  }, []);

  const showResults = hasSubmitted && searchText.trim().length > 0;
  const hasResults = results && results.length > 0;
  const isEmptyState = !showResults;

  return (
    <>
      <div className='flex min-h-screen flex-col bg-white pb-24'>
        <div
          className={`flex flex-1 flex-col items-center justify-center px-4 pb-32 transition-all duration-500 ease-out ${
            isEmptyState
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none absolute inset-0 -translate-y-8 opacity-0'
          }`}
        >
          <div className='mb-8 flex flex-col items-center text-center'>
            <h1 className='mb-2 text-3xl font-semibold text-gray-900'>Find Evento Users</h1>
            <p className='text-sm text-gray-500'>Search by username or name</p>
          </div>

          <div className='w-full max-w-md'>
            <PromptInput onSubmit={handlePromptSubmit} className='shadow-xl shadow-gray-200/50'>
              <PromptInputTextarea
                placeholder='Search for users...'
                className='min-h-[56px] text-base'
                autoFocus
              />
              <PromptInputFooter>
                <PromptInputTools>
                  <div className='flex items-center gap-2 text-xs text-gray-400'>
                    <Search className='h-3.5 w-3.5' />
                    <span>Press Enter to search</span>
                  </div>
                </PromptInputTools>
                <PromptInputSubmit />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ease-out ${
            showResults
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none absolute -translate-y-4 opacity-0'
          }`}
        >
          <div className='border-b border-gray-100 px-4 py-3'>
            <div className='mx-auto max-w-2xl'>
              <PromptInput onSubmit={handlePromptSubmit}>
                <PromptInputTextarea
                  ref={topInputRef}
                  placeholder='Search for users...'
                  className='min-h-[48px] text-base'
                  value={searchText}
                  onChange={handleTopInputChange}
                />
                <PromptInputFooter>
                  <PromptInputTools>
                    <div className='flex items-center gap-2 text-xs text-gray-400'>
                      <Users className='h-3.5 w-3.5' />
                      <span>
                        {isPending
                          ? 'Searching...'
                          : hasResults
                            ? `${results.length} result${results.length === 1 ? '' : 's'}`
                            : 'No results'}
                      </span>
                    </div>
                  </PromptInputTools>
                  <PromptInputSubmit />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>

          <div className='flex-1 px-4 pt-4'>
            <div className='mx-auto max-w-2xl'>
              {isPending ? (
                <div className='flex flex-col gap-2'>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className='flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3'
                    >
                      <Skeleton className='h-10 w-10 rounded-full' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !hasResults ? (
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                  <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                    <Search className='h-8 w-8 text-gray-400' />
                  </div>
                  <h3 className='mb-2 text-base font-semibold text-gray-900'>No users found</h3>
                  <p className='text-sm text-gray-500'>
                    No users matching &quot;{searchText}&quot;
                  </p>
                </div>
              ) : (
                <div className='flex flex-col gap-2'>
                  {results.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className='flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    >
                      <UserAvatar
                        user={{
                          name: user.name || undefined,
                          username: user.username || undefined,
                          image: user.image || undefined,
                          verification_status:
                            (user.verification_status as UserDetails['verification_status']) ||
                            null,
                        }}
                        size='sm'
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium text-gray-900'>
                          @{user.username}
                        </div>
                        <div className='truncate text-xs text-gray-500'>
                          {user.name || user.username}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedUser && (
        <QuickProfileSheet
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}

      <Navbar />
    </>
  );
}
