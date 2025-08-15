'use client';

import { EventCompactItem } from '@/components/event-compact-item';
import EventSearchSheet from '@/components/event-search-sheet';
import { TagSection } from '@/components/fancy-tag/section';
import FollowersSheet from '@/components/followers-sheet/followers-sheet';
import FollowingSheet from '@/components/followers-sheet/following-sheet';
import { LightboxViewer } from '@/components/lightbox-viewer';
import { Navbar } from '@/components/navbar';
import SocialLinks from '@/components/profile/social-links';
import RowCard from '@/components/row-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { usePinnedEvent, useUpdatePinnedEvent } from '@/lib/hooks/use-pinned-event';
import {
  EventFilterType,
  EventSortBy,
  EventTimeframe,
  useUserEvents,
} from '@/lib/hooks/use-user-events';
import {
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
  useUserProfile,
} from '@/lib/hooks/use-user-profile';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { EventHost } from '@/lib/types/event';
import { toast } from '@/lib/utils/toast';
import {
  BadgeCheck,
  Calendar,
  Camera,
  Edit3,
  Loader2,
  MessageCircle,
  Search,
  Settings,
  SortAsc,
  SortDesc,
  User,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const { setTopBarForRoute, applyRouteConfig, clearRoute, setOverlaid } = useTopBar();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('about');
  const [eventsFilter, setEventsFilter] = useState<EventFilterType>('upcoming');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('all');
  const [sortBy, setSortBy] = useState<EventSortBy>('created-desc');
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEventSearchSheet, setShowEventSearchSheet] = useState(false);

  // Mock data for the about tab
  const interestTags = ['Music', 'Tech', 'Food', 'Travel', 'Art', 'Photography'];
  const profileQuestions = [
    {
      question: 'Favorite quote?',
      answer: 'Be the change you wish to see in the world.',
    },
    {
      question: 'What are you listening to right now?',
      answer: 'Lofi beats and indie rock.',
    },
    {
      question: 'Dream destination?',
      answer: 'Kyoto, Japan during cherry blossom season.',
    },
  ];
  const profilePhotos = [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
    'https://images.unsplash.com/photo-1551434678-e076c223a692',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
  ];

  // Get user data from API
  const { user, isLoading: isUserLoading } = useUserProfile();
  const { data: eventCount } = useUserEventCount(user?.id || '');
  const { data: followers } = useUserFollowers(user?.id || '');
  const { data: following } = useUserFollowing(user?.id || '');

  // Fetch pinned event
  const { data: pinnedEvent } = usePinnedEvent(user?.username || '');
  const {
    mutate: updatePinnedEvent,
    isPending: isUpdatingPinnedEvent,
    variables: updatePinnedEventVariables,
  } = useUpdatePinnedEvent();

  // Fetch user events with the hook
  const {
    data: userEventsData,
    isLoading: isLoadingEvents,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useUserEvents({
    username: user?.username || '',
    filter: eventsFilter,
    timeframe: timeframe,
    sortBy: sortBy,
    limit: 10,
    enabled: activeTab === 'events',
  });

  // Set TopBar content and enable overlay mode
  useEffect(() => {
    // Apply any existing route configuration first
    applyRouteConfig(pathname);

    // Set route-specific configuration
    setTopBarForRoute(pathname, {
      title: '',
      subtitle: '',
      showAvatar: false,
      leftMode: 'menu',
      buttons: [
        {
          id: 'edit',
          icon: Edit3,
          onClick: () => router.push('/e/profile/edit'),
          label: 'Edit profile',
        },
        {
          id: 'settings',
          icon: Settings,
          onClick: () => router.push('/e/settings'),
          label: 'Settings',
        },
      ],
      isOverlaid: true,
    });
    setOverlaid(true);

    // Cleanup function to clear route config when leaving this page
    return () => {
      clearRoute(pathname);
      setOverlaid(false);
    };
  }, [router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute, setOverlaid]);

  const userStats = {
    events: eventCount || 0,
    countries: 8, // This would come from a different API endpoint
    mutuals: 156, // This would come from a different API endpoint
    following: following?.length || 0,
    followers: followers?.length || 0,
  };

  const userData = {
    name: user?.name || 'User',
    username: user?.username ? `@${user.username}` : '@user',
    status: user?.bio || 'Welcome to Evento',
    image: user?.image,
    isVerified: user?.verification_status === 'verified',
  };

  const handleAvatarClick = () => {
    setSelectedAvatarIndex(0);
  };

  // Format avatar data for LightboxViewer
  const avatarImages = [
    {
      id: 'avatar-1',
      image: userData.image,
      user_details: {
        id: user?.id,
        username: user?.username,
        name: user?.name,
        image: userData.image,
        verification_status: user?.verification_status,
      },
      created_at: new Date().toISOString(),
    },
  ];

  // Format profile photos for LightboxViewer
  const formattedProfilePhotos = profilePhotos.map((photoUrl, index) => ({
    id: `profile-photo-${index}`,
    image: photoUrl,
    user_details: {
      id: user?.id,
      username: user?.username,
      name: user?.name,
      image: userData.image,
      verification_status: user?.verification_status,
    },
    created_at: new Date().toISOString(),
  }));

  const renderEventsTab = () => {
    // Group events by date
    const groupedEvents =
      userEventsData?.pages
        .flatMap((page) => page.events)
        .reduce((groups: { date: string; events: EventWithUser[] }[], event: EventWithUser) => {
          const date = event.computed_start_date;
          const group = groups.find((g) => g.date === date);

          if (group) {
            group.events.push(event);
          } else {
            groups.push({ date, events: [event] });
          }

          return groups;
        }, [])
        .sort(
          (
            a: { date: string; events: EventWithUser[] },
            b: { date: string; events: EventWithUser[] }
          ) => {
            if (sortBy === 'date-desc') {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
          }
        ) || [];

    const canPinEvent = (event: EventWithUser) => {
      if (!user) return false;

      // User can pin if they are the event creator
      if (event.user_details.id === user.id) return true;

      // User can pin if they are a co-host
      const isCoHost = event.hosts?.some((host: EventHost) => host.id === user.id);
      return isCoHost;
    };

    const handlePinEvent = (eventId: string, isPinned: boolean) => {
      if (isUpdatingPinnedEvent) return;

      updatePinnedEvent(eventId, {
        onSuccess: () => {
          toast.success(
            isPinned ? 'Event unpinned from your profile' : 'Event pinned to your profile'
          );
        },
        onError: () => {
          toast.error(`Failed to ${isPinned ? 'unpin' : 'pin'} event`);
        },
      });
    };

    const formatDateHeader = (date: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      if (date === today) return 'Today';
      if (date === tomorrowStr) return 'Tomorrow';

      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <div className='space-y-4'>
        {/* Filter Tabs */}
        <Tabs
          value={eventsFilter}
          onValueChange={(value) => setEventsFilter(value as EventFilterType)}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='upcoming'>All</TabsTrigger>
            <TabsTrigger value='attending'>Attending</TabsTrigger>
            <TabsTrigger value='hosting'>Hosting</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Controls */}
        <div className='mt-4 grid w-full grid-cols-3 items-center gap-2'>
          <Select
            value={timeframe}
            onValueChange={(value: string) => setTimeframe(value as EventTimeframe)}
          >
            <SelectTrigger className='text-sm'>
              <Calendar className='mr-2 h-4 w-4' />
              <SelectValue placeholder='Timeframe' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='future'>Future</SelectItem>
              <SelectItem value='past'>Past</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as EventSortBy)}>
            <SelectTrigger className='text-sm'>
              {sortBy === 'date-desc' || sortBy === 'created-desc' ? (
                <SortAsc className='mr-2 h-4 w-4' />
              ) : (
                <SortDesc className='mr-2 h-4 w-4' />
              )}
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='created-desc'>Created Desc</SelectItem>
              <SelectItem value='created-asc'>Created Asc</SelectItem>
              <SelectItem value='date-desc'>Date Desc</SelectItem>
              <SelectItem value='date-asc'>Date Asc</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            onClick={() => setShowEventSearchSheet(true)}
            aria-label='Search events'
          >
            <Search className='h-5 w-5' />
            <span>Search</span>
          </Button>
        </div>

        {/* Events List */}
        <div className='space-y-8'>
          {isLoadingEvents ? (
            <div className='flex h-40 items-center justify-center'>
              <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
            </div>
          ) : groupedEvents.length === 0 ? (
            <div className='flex h-40 flex-col items-center justify-center space-y-2 text-center'>
              <div className='rounded-full bg-gray-100 p-3'>
                <MessageCircle className='h-6 w-6 text-gray-400' />
              </div>
              <p className='text-sm text-gray-500'>No events found</p>
            </div>
          ) : (
            groupedEvents.map((group) => (
              <div key={group.date} className='space-y-3'>
                <h3 className='text-sm font-medium text-gray-500'>
                  {formatDateHeader(group.date)}
                </h3>
                <div className='divide-y divide-gray-100'>
                  {group.events.map((event) => {
                    const isPinned = pinnedEvent?.id === event.id;
                    const canPin = canPinEvent(event);

                    return (
                      <div key={event.id} className='py-2'>
                        <EventCompactItem
                          event={event}
                          isPinning={
                            isUpdatingPinnedEvent && updatePinnedEventVariables === event.id
                          }
                          isPinned={isPinned}
                          canPin={canPin}
                          onPin={handlePinEvent}
                          onBookmark={() => {}} // Placeholder for bookmark functionality
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Load More Button */}
          {hasNextPage && (
            <div className='flex justify-center pt-4'>
              <Button
                variant='outline'
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className='w-full'
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Event Search Sheet */}
        <EventSearchSheet
          isOpen={showEventSearchSheet}
          onClose={() => setShowEventSearchSheet(false)}
          username={user?.username}
          onPin={handlePinEvent}
          pinnedEventId={pinnedEvent?.id}
          isOwnProfile={true}
        />
      </div>
    );
  };

  const renderAboutTab = () => {
    const handleProfilePhotoClick = (index: number) => {
      setSelectedImageIndex(index);
    };

    return (
      <div className='space-y-4'>
        {/* Social Links */}
        {user && <SocialLinks user={user} />}

        {/* Bio/Description */}
        {!user?.bio ? null : (
          <div>
            <RowCard title={'Bio'} subtitle={user?.bio} icon={<User className='h-4 w-4' />} />
          </div>
        )}

        {/* Interest Tags */}
        <div>
          <div className='flex flex-wrap gap-2'>
            <TagSection
              title='Interests'
              items={interestTags}
              selectedItems={[]}
              onToggleItem={() => {}}
            />
          </div>
        </div>

        {/* Profile Questions */}
        <div>
          <h4 className='mb-3 font-semibold text-gray-900'>About Me</h4>
          <div className='space-y-3'>
            {profileQuestions.map((item: { question: string; answer: string }, index: number) => (
              <div key={index} className='rounded-xl bg-gray-50 p-3'>
                <p className='mb-1 text-sm font-medium text-gray-700'>{item.question}</p>
                <p className='text-sm text-gray-900'>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Album */}
        <div>
          <div className='mb-3 flex items-center justify-between'>
            <h4 className='font-semibold text-gray-900'>Photos</h4>
            <Button variant='ghost' size='sm' className='text-red-600'>
              <Camera className='mr-1 h-4 w-4' />
              Add
            </Button>
          </div>
          <div className='grid grid-cols-3 gap-2'>
            {profilePhotos.map((photo: string, index: number) => (
              <button
                key={index}
                onClick={() => handleProfilePhotoClick(index)}
                className='aspect-square overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-90'
              >
                <img
                  src={photo || '/assets/img/evento-sublogo.svg'}
                  alt={`Profile photo ${index + 1}`}
                  className='h-full w-full object-cover'
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Show loading state while fetching user data
  if (isCheckingAuth || isUserLoading || !user) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col items-center justify-center bg-white md:max-w-sm'>
        <Loader2 className='h-8 w-8 animate-spin text-red-500' />
        <p className='mt-2 text-gray-600'>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Content */}
      <div className='flex-1 overflow-y-auto pb-20'>
        {/* Cover Image Section */}
        <div className='relative'>
          {/* Banner */}
          <div className='h-36 w-full bg-gradient-to-br from-red-400 to-red-600 md:h-44' />

          {/* Profile Picture - Centered & Clickable */}
          <UserAvatar
            user={userData}
            size='lg'
            onAvatarClick={handleAvatarClick}
            onVerificationClick={() => setShowVerificationModal(true)}
            className='absolute -bottom-16 left-1/2 -translate-x-1/2 transform'
          />
        </div>

        {/* Profile Section */}
        <div className='mb-4 bg-white px-4 pb-0 pt-20'>
          {/* User Info - Centered */}
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-bold text-gray-900'>{userData.name}</h2>
            <p className='text-gray-600'>{userData.username}</p>
          </div>

          {/* Stats - Centered */}
          <div className='mb-4 flex justify-center'>
            <div className='grid grid-cols-3 gap-8'>
              <div className='text-center'>
                <div className='text-xl font-bold text-gray-900'>{userStats.events}</div>
                <div className='text-sm text-gray-500'>Events</div>
              </div>
              <button className='text-center' onClick={() => setShowFollowingSheet(true)}>
                <div className='text-xl font-bold text-gray-900'>{userStats.following}</div>
                <div className='text-sm text-gray-500'>Following</div>
              </button>
              <button className='text-center' onClick={() => setShowFollowersSheet(true)}>
                <div className='text-xl font-bold text-gray-900'>{userStats.followers}</div>
                <div className='text-sm text-gray-500'>Followers</div>
              </button>
            </div>
          </div>

          {/* Tabbed Section */}
          <div className='mb-4 w-full bg-white'>
            {/* Tab Headers */}
            <div className='mb-2 flex flex-row items-center justify-center gap-2 px-4 py-3'>
              <button
                onClick={() => setActiveTab('about')}
                className={`rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                  activeTab === 'about'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                  activeTab === 'events'
                    ? 'bg-gray-100 text-black'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                Events
              </button>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'about' && renderAboutTab()}
              {activeTab === 'events' && renderEventsTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 text-center md:max-w-sm'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50'>
              <BadgeCheck className='h-8 w-8 rounded-full bg-red-600 text-white shadow-sm' />
            </div>
            <h3 className='mb-4 text-xl font-bold text-gray-900'>You are verified</h3>
            <p className='mb-6 text-gray-600'>
              Congratulations! Your account is verified. You have premium member status with
              enhanced credibility and access to exclusive features on our platform.
            </p>
            <div className='flex flex-col gap-3'>
              <Button
                onClick={() => {
                  setShowVerificationModal(false);
                  router.push(
                    '/e/contact?title=Verification%20Support&message=Hi,%20I%20need%20assistance%20with%20my%20verified%20account%20or%20have%20questions%20about%20verification%20features.'
                  );
                }}
                className='w-full bg-red-500 text-white hover:bg-red-600'
              >
                Contact support
              </Button>
              <Button
                variant='ghost'
                onClick={() => setShowVerificationModal(false)}
                className='w-full'
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Lightbox */}
      <LightboxViewer
        images={avatarImages}
        selectedImage={selectedAvatarIndex}
        onClose={() => setSelectedAvatarIndex(null)}
        onImageChange={setSelectedAvatarIndex}
        showDropdownMenu={false}
        handleDelete={() => Promise.resolve({ success: false })}
        userId={user?.id || ''}
        eventId=''
      />

      {/* Profile Photos Lightbox */}
      <LightboxViewer
        images={formattedProfilePhotos}
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={setSelectedImageIndex}
        showDropdownMenu={true}
        handleDelete={async (photoId: string) => ({ success: false })}
        userId={user?.id || ''}
        eventId=''
      />

      {/* Bottom Navbar */}
      <Navbar />

      {/* Followers Sheet */}
      <FollowersSheet
        isOpen={showFollowersSheet}
        onClose={() => setShowFollowersSheet(false)}
        userId={user?.id || ''}
        username={user?.username || 'user'}
      />

      {/* Following Sheet */}
      <FollowingSheet
        isOpen={showFollowingSheet}
        onClose={() => setShowFollowingSheet(false)}
        userId={user?.id || ''}
        username={user?.username || 'user'}
      />
    </div>
  );
}
