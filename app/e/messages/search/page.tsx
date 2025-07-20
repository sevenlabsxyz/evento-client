'use client';

import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import { ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserSearchPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const suggestedUsers = [
    {
      id: 6,
      name: 'David Wilson',
      username: '@davidw',
      avatar: '/placeholder.svg?height=50&width=50',
      location: 'London, UK',
      mutualEvents: 3,
      isOnline: true,
    },
    {
      id: 7,
      name: 'Lisa Park',
      username: '@lisap',
      avatar: '/placeholder.svg?height=50&width=50',
      location: 'Seoul, Korea',
      mutualEvents: 1,
      isOnline: false,
    },
    {
      id: 8,
      name: 'Alex Kim',
      username: '@alexk',
      avatar: '/placeholder.svg?height=50&width=50',
      location: 'Vancouver, Canada',
      mutualEvents: 5,
      isOnline: true,
    },
    {
      id: 9,
      name: 'Maria Garcia',
      username: '@mariag',
      avatar: '/placeholder.svg?height=50&width=50',
      location: 'Barcelona, Spain',
      mutualEvents: 2,
      isOnline: false,
    },
  ];

  const searchResults = [
    {
      id: 10,
      name: 'John Smith',
      username: '@johns',
      avatar: '/placeholder.svg?height=50&width=50',
      location: 'New York, USA',
      mutualEvents: 1,
      isOnline: true,
    },
    {
      id: 11,
      name: 'Anna Johnson',
      username: '@annaj',
      avatar: '/placeholder.svg?height=50&width=50',
      location: 'Stockholm, Sweden',
      mutualEvents: 0,
      isOnline: false,
    },
  ];

  const handleUserClick = (userId: number) => {
    // Navigate to chat with this user
    router.push(`/messages/${userId}`);
  };

  const usersToShow = searchQuery ? searchResults : suggestedUsers;
  const sectionTitle = searchQuery ? `Results for "${searchQuery}"` : 'Suggested';

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center gap-3 border-b border-gray-100 px-4 py-4'>
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => router.back()}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search for users...'
            className='w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500'
            autoFocus
          />
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='px-4 py-4'>
          <h3 className='mb-4 text-sm font-semibold text-gray-900'>{sectionTitle}</h3>
          <div className='space-y-3'>
            {usersToShow.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className='flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50'
              >
                <div className='relative flex-shrink-0'>
                  <img
                    src={user.avatar || '/placeholder.svg'}
                    alt={user.name}
                    className='h-12 w-12 rounded-full object-cover'
                  />
                  {user.isOnline && (
                    <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500'></div>
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex items-center gap-2'>
                    <h4 className='truncate font-medium text-gray-900'>{user.name}</h4>
                    <span className='text-sm text-gray-500'>{user.username}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <span className='truncate'>{user.location}</span>
                    {user.mutualEvents > 0 && (
                      <>
                        <span>•</span>
                        <span>{user.mutualEvents} mutual events</span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant='outline' size='sm' className='bg-transparent text-xs'>
                  Message
                </Button>
              </div>
            ))}
          </div>

          {searchQuery && usersToShow.length === 0 && (
            <div className='py-8 text-center'>
              <p className='text-gray-500'>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
