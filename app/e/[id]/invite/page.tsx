'use client';

import { Button } from '@/components/ui/button';
import { getEventById } from '@/lib/data/sample-events';
import { ArrowLeft, Check, Search, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface EventoUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  verified?: boolean;
}

// Mock Evento users data
const mockUsers: EventoUser[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    username: 'sarahchen',
    avatar: '/api/placeholder/40/40',
    bio: 'Product Designer at Tech Co',
    verified: true,
  },
  {
    id: 'user-2',
    name: 'Marcus Rodriguez',
    username: 'marcusr',
    avatar: '/api/placeholder/40/40',
    bio: 'Software Engineer',
  },
  {
    id: 'user-3',
    name: 'Elena Kowalski',
    username: 'elenakowalski',
    avatar: '/api/placeholder/40/40',
    bio: 'UX Researcher',
  },
  {
    id: 'user-4',
    name: 'David Kim',
    username: 'davidkim',
    avatar: '/api/placeholder/40/40',
    bio: 'Startup Founder',
    verified: true,
  },
  {
    id: 'user-5',
    name: 'Luna Zhang',
    username: 'lunazhang',
    avatar: '/api/placeholder/40/40',
    bio: 'AI Researcher',
  },
  {
    id: 'user-6',
    name: 'Alex Thompson',
    username: 'alexthompson',
    avatar: '/api/placeholder/40/40',
    bio: 'Marketing Director',
  },
];

export default function InviteGuestsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // Get existing event data
  const existingEvent = getEventById(eventId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showSelectedView, setShowSelectedView] = useState(false);

  if (!existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you're trying to invite guests to doesn't exist.
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Filter users based on search query
  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendInvitations = () => {
    console.log('Sending invitations to:', selectedUsers);
    // TODO: Implement actual invitation sending
    // In a real app, you would send invitations to selected users
    alert(`Sending invitations to ${selectedUsers.length} users!`);
    router.back();
  };

  const getSelectedUsersData = () => {
    return mockUsers.filter((user) => selectedUsers.includes(user.id));
  };

  const renderUserItem = (user: EventoUser) => {
    const isSelected = selectedUsers.includes(user.id);

    return (
      <div key={user.id} className='flex items-center gap-4 p-4 transition-colors hover:bg-gray-50'>
        <div className='relative'>
          <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gray-300'>
            <span className='text-lg font-semibold text-gray-600'>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          {user.verified && (
            <div className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500'>
              <Check className='h-3 w-3 text-white' />
            </div>
          )}
        </div>

        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-gray-900'>{user.name}</h3>
          </div>
          <p className='text-sm text-gray-500'>@{user.username}</p>
          {user.bio && <p className='mt-1 text-xs text-gray-400'>{user.bio}</p>}
        </div>

        <button
          onClick={() => handleUserToggle(user.id)}
          className={`h-6 w-6 rounded-full border-2 transition-all ${
            isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300 hover:border-red-300'
          }`}
        >
          {isSelected && <Check className='mx-auto h-4 w-4 text-white' />}
        </button>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className='py-16 text-center'>
      <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
        <Users className='h-8 w-8 text-gray-400' />
      </div>
      <h3 className='mb-2 text-lg font-medium text-gray-900'>
        {searchQuery ? 'No users found' : 'Search for Evento users'}
      </h3>
      <p className='text-sm text-gray-500'>
        {searchQuery
          ? `No users found matching "${searchQuery}"`
          : 'Start typing to find Evento users to invite to your event'}
      </p>
    </div>
  );

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-100 p-4'>
        <div className='flex items-center gap-4'>
          <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h1 className='text-xl font-semibold'>Invite Guests</h1>
        </div>
        {selectedUsers.length > 0 && (
          <button
            onClick={() => setShowSelectedView(!showSelectedView)}
            className='font-medium text-red-600 hover:text-red-700'
          >
            {selectedUsers.length} selected
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-100'>
        <div className='px-4'>
          <div className='flex'>
            <button className='border-b-2 border-red-500 px-4 py-3 font-medium text-red-600'>
              People
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {!showSelectedView && (
        <div className='p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
            <input
              type='text'
              placeholder='Search for Evento usernames...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none'
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className='flex-1'>
        {showSelectedView ? (
          <div>
            {/* Selected Users Header */}
            <div className='border-b border-gray-100 bg-gray-50 px-4 py-3'>
              <h3 className='font-medium text-gray-900'>Selected Users ({selectedUsers.length})</h3>
            </div>

            {/* Selected Users List */}
            <div>{getSelectedUsersData().map(renderUserItem)}</div>
          </div>
        ) : (
          <div>
            {/* Search Results */}
            {filteredUsers.length > 0 ? (
              <div>{filteredUsers.map(renderUserItem)}</div>
            ) : (
              renderEmptyState()
            )}
          </div>
        )}
      </div>

      {/* Send Invitations Button */}
      {selectedUsers.length > 0 && (
        <div className='border-t border-gray-100 bg-white p-4'>
          <Button
            onClick={handleSendInvitations}
            className='w-full rounded-xl bg-red-500 py-3 font-medium text-white hover:bg-red-600'
          >
            Send Invitations ({selectedUsers.length})
          </Button>
        </div>
      )}
    </div>
  );
}
