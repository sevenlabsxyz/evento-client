'use client';

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
import { useCallback, useEffect, useState } from 'react';

const MIN_SEARCH_LENGTH = 2;

export default function SearchPage() {
  const pathname = usePathname();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);

  const debouncedSearch = useDebounce(searchText, 400);
  const { mutate: search, data: results, isPending, reset } = useUserSearch();

  // Configure top bar
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

  // Trigger search when debounced value changes
  useEffect(() => {
    const query = debouncedSearch.trim();
    if (query.length >= MIN_SEARCH_LENGTH) {
      search(query);
    } else {
      reset();
    }
  }, [debouncedSearch, search, reset]);

  const handleUserClick = useCallback((user: UserSearchResult) => {
    // Convert UserSearchResult to UserDetails for QuickProfileSheet
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

  const showResults = searchText.trim().length >= MIN_SEARCH_LENGTH;
  const hasResults = results && results.length > 0;

  return (
    <>
      <div className='flex min-h-screen flex-col bg-white pb-24'>
        {/* Search Input */}
        <div className='px-4 py-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search for users...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoFocus
              className='w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-base outline-none transition-colors focus:border-gray-300 focus:bg-white'
            />
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 px-4'>
          {!showResults ? (
            // Empty state - before searching
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Users className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>Find Evento Users</h3>
              <p className='text-sm text-gray-500'>Search by username</p>
            </div>
          ) : isPending ? (
            // Loading state
            <div className='flex flex-col gap-2'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className='flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3'
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
            // No results state
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
                <Search className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-base font-semibold text-gray-900'>No users found</h3>
              <p className='text-sm text-gray-500'>No users matching &quot;{searchText}&quot;</p>
            </div>
          ) : (
            // Results list
            <div className='flex flex-col gap-2'>
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className='flex w-full items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100'
                >
                  <UserAvatar
                    user={{
                      name: user.name || undefined,
                      username: user.username || undefined,
                      image: user.image || undefined,
                      verification_status:
                        (user.verification_status as UserDetails['verification_status']) || null,
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

      {/* Quick Profile Sheet */}
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
