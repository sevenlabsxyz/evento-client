'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, MoreHorizontal, Users } from 'lucide-react';
import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { Guest, GuestStatus } from '@/lib/types/event';

export default function GuestListPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // Get existing event data from API
  const { data: existingEvent, isLoading, error } = useEventDetails(eventId);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to manage doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get guests from event data
  const guests = existingEvent.guests || [];
  const [activeTab, setActiveTab] = useState<GuestStatus>('going');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hideGuestList, setHideGuestList] = useState(!existingEvent.guestListSettings?.isPublic);

  // Calculate counts for each status
  const getGuestCount = (status: GuestStatus) => 
    guests.filter(guest => guest.status === status).length;

  const tabs = [
    { key: 'going' as const, label: 'Going', count: getGuestCount('going') },
    { key: 'invited' as const, label: 'Invited', count: getGuestCount('invited') },
    { key: 'not-going' as const, label: 'Not Going', count: getGuestCount('not-going') },
    { key: 'maybe' as const, label: 'Maybe', count: getGuestCount('maybe') },
    { key: 'checked-in' as const, label: 'Checked In', count: getGuestCount('checked-in') },
  ];

  // Filter guests based on active tab and search query
  const filteredGuests = guests.filter(guest => {
    const matchesTab = guest.status === activeTab;
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleTabChange = (tab: GuestStatus) => {
    setActiveTab(tab);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleToggleHideGuestList = () => {
    setHideGuestList(!hideGuestList);
  };

  const handleCloseMoreMenu = () => {
    setShowMoreMenu(false);
  };

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
          <h1 className="text-xl font-semibold">Guest List</h1>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {/* More Menu Dropdown */}
          {showMoreMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={handleCloseMoreMenu}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50 min-w-48">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">Hide guest list</span>
                    <p className="text-xs text-gray-500 mt-1">Make guest list private</p>
                  </div>
                  <button
                    onClick={handleToggleHideGuestList}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      hideGuestList ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        hideGuestList ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search event guests..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-none outline-none text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-xs">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {filteredGuests.length > 0 ? (
          <div className="space-y-3">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">
                    {guest.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                  <p className="text-sm text-gray-500">{guest.email}</p>
                  {guest.checkedInAt && (
                    <p className="text-xs text-green-600">
                      Checked in at {guest.checkedInAt.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Status indicator */}
                  <div className={`w-3 h-3 rounded-full ${
                    guest.status === 'going' ? 'bg-green-500' :
                    guest.status === 'invited' ? 'bg-blue-500' :
                    guest.status === 'not-going' ? 'bg-red-500' :
                    guest.status === 'maybe' ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Guests</h3>
            <p className="text-gray-500 text-sm">
              {activeTab === 'going' && "No guests have confirmed they're going yet."}
              {activeTab === 'invited' && "No guests have been invited yet."}
              {activeTab === 'not-going' && "No guests have declined yet."}
              {activeTab === 'maybe' && "No guests have responded with maybe yet."}
              {activeTab === 'checked-in' && "No guests have checked in yet."}
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total Guests: {guests.length}</span>
          <span>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}: {filteredGuests.length}
          </span>
        </div>
      </div>
    </div>
  );
}