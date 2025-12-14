'use client';

import EventSearchSheet from '@/components/event-search-sheet';
import FollowersSheet from '@/components/followers-sheet/followers-sheet';
import FollowingSheet from '@/components/followers-sheet/following-sheet';
import { LightboxViewer } from '@/components/lightbox-viewer';
import { MasterEventCard } from '@/components/master-event-card';
import { Navbar } from '@/components/navbar';
import SocialLinks from '@/components/profile/social-links';
import { UserInterests } from '@/components/profile/user-interests';
import { UserPrompts } from '@/components/profile/user-prompts';
import RowCard from '@/components/row-card';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { EventSortBy, EventTimeframe, useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserInterests } from '@/lib/hooks/use-user-interests';
import {
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
  useUserProfile,
} from '@/lib/hooks/use-user-profile';
import { useUserPrompts } from '@/lib/hooks/use-user-prompts';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { formatDateHeader } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Edit3,
  History,
  Loader2,
  MessageCircle,
  Search,
  Settings,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTopBarForRoute, applyRouteConfig, clearRoute, setOverlaid } = useTopBar();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('about');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('future');
  const [sortBy, setSortBy] = useState<EventSortBy>('date-desc');
  const [timeframePopoverOpen, setTimeframePopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEventSearchSheet, setShowEventSearchSheet] = useState(false);
  const [showZapModal, setShowZapModal] = useState(false);

  // Get user data from API
  const { user, isLoading: isUserLoading } = useUserProfile();

  // Get user interests and prompts
  const { data: userInterests = [], isLoading: isLoadingInterests } = useUserInterests();
  const { data: userPrompts = [], isLoading: isLoadingPrompts } = useUserPrompts();
  const { data: eventCount } = useUserEventCount(user?.id || '');
  const { data: followers } = useUserFollowers(user?.id || '');
  const { data: following } = useUserFollowing(user?.id || '');

  // Fetch user events with the hook (always show all events - 'upcoming' filter)
  const {
    data: userEventsData,
    isLoading: isLoadingEvents,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useUserEvents({
    filter: 'upcoming',
    timeframe: timeframe,
    sortBy: sortBy,
    limit: 10,
    enabled: activeTab === 'events',
  });

  // Handle URL parameters for tab state
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'events') {
      setActiveTab('events');
    } else {
      setActiveTab('about');
    }
  }, [searchParams]);

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
      image: userData.image || '/assets/img/evento-sublogo.svg',
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

  const profilePhotos = [
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
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

    return (
      <div className='space-y-4'>
        {/* Controls - Single unified ButtonGroup */}
        <ButtonGroup className='w-full justify-between'>
          <ButtonGroup>
            {/* Timeframe Popover */}
            <Popover open={timeframePopoverOpen} onOpenChange={setTimeframePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-l-full rounded-r-none bg-white hover:bg-gray-50'
                >
                  {timeframe === 'future' ? 'Upcoming' : 'Past'}
                  <ChevronDown className='ml-1 h-3 w-3' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-56 p-2'>
                <button
                  className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                  onClick={() => {
                    setTimeframe('future');
                    setTimeframePopoverOpen(false);
                  }}
                >
                  <Calendar className='mt-0.5 h-4 w-4 text-gray-500' />
                  <div>
                    <div className='text-sm font-medium'>Upcoming</div>
                    <div className='text-xs text-gray-500'>Events happening soon</div>
                  </div>
                </button>
                <button
                  className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                  onClick={() => {
                    setTimeframe('past');
                    setTimeframePopoverOpen(false);
                  }}
                >
                  <History className='mt-0.5 h-4 w-4 text-gray-500' />
                  <div>
                    <div className='text-sm font-medium'>Past</div>
                    <div className='text-xs text-gray-500'>Events that have ended</div>
                  </div>
                </button>
              </PopoverContent>
            </Popover>

            {/* Sort Popover */}
            <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-l-none rounded-r-full bg-white hover:bg-gray-50'
                >
                  {sortBy === 'date-desc' ? 'Latest' : 'Oldest'}
                  <ChevronDown className='ml-1 h-3 w-3' />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='start' className='w-56 p-2'>
                <button
                  className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                  onClick={() => {
                    setSortBy('date-desc');
                    setSortPopoverOpen(false);
                  }}
                >
                  <ArrowDownWideNarrow className='mt-0.5 h-4 w-4 text-gray-500' />
                  <div>
                    <div className='text-sm font-medium'>Latest</div>
                    <div className='text-xs text-gray-500'>Most recent events first</div>
                  </div>
                </button>
                <button
                  className='flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100'
                  onClick={() => {
                    setSortBy('date-asc');
                    setSortPopoverOpen(false);
                  }}
                >
                  <ArrowUpWideNarrow className='mt-0.5 h-4 w-4 text-gray-500' />
                  <div>
                    <div className='text-sm font-medium'>Oldest</div>
                    <div className='text-xs text-gray-500'>Oldest events first</div>
                  </div>
                </button>
              </PopoverContent>
            </Popover>
          </ButtonGroup>

          {/* Search Button */}
          <Button
            size='icon'
            variant='outline'
            onClick={() => setShowEventSearchSheet(true)}
            className='rounded-full'
            aria-label='Search events'
          >
            <Search className='!h-[1.25rem] !w-[1.25rem]' />
          </Button>
        </ButtonGroup>

        {/* Events List */}
        <div className='space-y-8'>
          {isLoadingEvents ? (
            <div className='space-y-4'>
              <Skeleton className='h-5 w-24' />
              <Skeleton variant='list' className='mt-2' />
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
                <div className='space-y-3'>
                  {group.events.map((event) => (
                    <MasterEventCard key={event.id} event={event} />
                  ))}
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
        {/* Social Links - hidden on desktop (shown below Zap button instead) */}
        {user && (
          <div className='lg:hidden'>
            <SocialLinks user={user} />
          </div>
        )}

        {/* Bio/Description */}
        {!user?.bio ? null : (
          <div>
            <RowCard title={'Bio'} subtitle={user?.bio} />
          </div>
        )}

        {/* User Interests */}
        {!isLoadingInterests && <UserInterests interests={userInterests} />}

        {/* User Prompts */}
        {!isLoadingPrompts && <UserPrompts prompts={userPrompts} isOwnProfile={true} />}
      </div>
    );
  };

  // Show loading state while fetching user data
  if (isCheckingAuth || isUserLoading || !user) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex-1 overflow-y-auto bg-gray-50 p-6'>
          <Skeleton variant='profile' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='mx-auto max-w-full bg-white md:max-w-4xl'>
        <div className='lg:flex lg:gap-8'>
          {/* Left Column - Profile Info (sticky on desktop) */}
          <div className='lg:sticky lg:top-0 lg:w-1/2 lg:self-start'>
            {/* Cover Image Section */}
            <div className='relative'>
              {/* Banner */}
              <div className='h-36 w-full bg-gradient-to-br from-red-400 to-red-600 md:h-24 md:bg-none' />

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
                  <motion.button
                    className='text-center'
                    onClick={() => setShowFollowingSheet(true)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className='text-xl font-bold text-gray-900'>{userStats.following}</div>
                    <div className='text-sm text-gray-500'>Following</div>
                  </motion.button>
                  <motion.button
                    className='text-center'
                    onClick={() => setShowFollowersSheet(true)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className='text-xl font-bold text-gray-900'>{userStats.followers}</div>
                    <div className='text-sm text-gray-500'>Followers</div>
                  </motion.button>
                </div>
              </div>

              {/* Social Links - desktop only */}
              <div className='hidden lg:mb-6 lg:flex lg:justify-center'>
                <SocialLinks user={user} />
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className='px-4 pb-32 lg:w-1/2 lg:px-0'>
            {/* Tabbed Section */}
            <div className='mb-4 w-full bg-white'>
              {/* Tab Headers */}
              <SegmentedTabs
                items={[
                  { value: 'about', label: 'About' },
                  { value: 'events', label: 'Events' },
                ]}
                value={activeTab}
                onValueChange={(v) => {
                  if (v === 'about') {
                    router.push('/e/profile', { scroll: false });
                  } else {
                    router.push(`/e/profile?tab=${v}`, { scroll: false });
                  }
                }}
              />
              {/* Tab Content */}
              <div>
                {activeTab === 'about' && renderAboutTab()}
                {activeTab === 'events' && renderEventsTab()}
              </div>
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
