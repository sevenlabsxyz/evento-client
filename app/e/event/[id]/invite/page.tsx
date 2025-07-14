'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventById } from '@/lib/data/sample-events';

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
    verified: true
  },
  {
    id: 'user-2',
    name: 'Marcus Rodriguez',
    username: 'marcusr',
    avatar: '/api/placeholder/40/40',
    bio: 'Software Engineer'
  },
  {
    id: 'user-3',
    name: 'Elena Kowalski',
    username: 'elenakowalski',
    avatar: '/api/placeholder/40/40',
    bio: 'UX Researcher'
  },
  {
    id: 'user-4',
    name: 'David Kim',
    username: 'davidkim',
    avatar: '/api/placeholder/40/40',
    bio: 'Startup Founder',
    verified: true
  },
  {
    id: 'user-5',
    name: 'Luna Zhang',
    username: 'lunazhang',
    avatar: '/api/placeholder/40/40',
    bio: 'AI Researcher'
  },
  {
    id: 'user-6',
    name: 'Alex Thompson',
    username: 'alexthompson',
    avatar: '/api/placeholder/40/40',
    bio: 'Marketing Director'
  }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to invite guests to doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Filter users based on search query
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
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
    return mockUsers.filter(user => selectedUsers.includes(user.id));
  };

  const renderUserItem = (user: EventoUser) => {
    const isSelected = selectedUsers.includes(user.id);
    
    return (
      <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
            <span className="text-gray-600 font-semibold text-lg">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          {user.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
          </div>
          <p className="text-sm text-gray-500">@{user.username}</p>
          {user.bio && (
            <p className="text-xs text-gray-400 mt-1">{user.bio}</p>
          )}
        </div>
        
        <button
          onClick={() => handleUserToggle(user.id)}
          className={`w-6 h-6 rounded-full border-2 transition-all ${
            isSelected 
              ? 'bg-orange-500 border-orange-500' 
              : 'border-gray-300 hover:border-orange-300'
          }`}
        >
          {isSelected && (
            <Check className="w-4 h-4 text-white mx-auto" />
          )}
        </button>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchQuery ? 'No users found' : 'Search for Evento users'}
      </h3>
      <p className="text-gray-500 text-sm">
        {searchQuery 
          ? `No users found matching "${searchQuery}"`
          : 'Start typing to find Evento users to invite to your event'
        }
      </p>
    </div>
  );

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Invite Guests</h1>
        </div>
        {selectedUsers.length > 0 && (
          <button
            onClick={() => setShowSelectedView(!showSelectedView)}
            className="text-orange-600 font-medium hover:text-orange-700"
          >
            {selectedUsers.length} selected
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-100">
        <div className="px-4">
          <div className="flex">
            <button className="px-4 py-3 border-b-2 border-orange-500 text-orange-600 font-medium">
              People
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {!showSelectedView && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for Evento usernames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-none outline-none text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {showSelectedView ? (
          <div>
            {/* Selected Users Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Selected Users ({selectedUsers.length})</h3>
            </div>
            
            {/* Selected Users List */}
            <div>
              {getSelectedUsersData().map(renderUserItem)}
            </div>
          </div>
        ) : (
          <div>
            {/* Search Results */}
            {filteredUsers.length > 0 ? (
              <div>
                {filteredUsers.map(renderUserItem)}
              </div>
            ) : (
              renderEmptyState()
            )}
          </div>
        )}
      </div>

      {/* Send Invitations Button */}
      {selectedUsers.length > 0 && (
        <div className="border-t border-gray-100 p-4 bg-white">
          <Button
            onClick={handleSendInvitations}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium"
          >
            Send Invitations ({selectedUsers.length})
          </Button>
        </div>
      )}
    </div>
  );
}