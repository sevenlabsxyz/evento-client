'use client';

import { BadgeDetailSheet } from '@/components/badges/badge-detail-sheet';
import { BadgesManagementSheet } from '@/components/badges/badges-management-sheet';
import { UserBadgesDisplay } from '@/components/badges/user-badges-display';
import { CircledIconButton } from '@/components/circled-icon-button';
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
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ZapSheet } from '@/components/zap';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useUserBadges } from '@/lib/hooks/use-badges';
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
import { UserBadge } from '@/lib/types/badges';
import { cn } from '@/lib/utils';
import { formatDateHeader } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeCheck,
  Edit3,
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
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showEventSearchSheet, setShowEventSearchSheet] = useState(false);
  const [showZapModal, setShowZapModal] = useState(false);
  const [showBadgesManagementSheet, setShowBadgesManagementSheet] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  // Get user data from API
  const { user, isLoading: isUserLoading } = useUserProfile();

  // Get user interests and prompts
  const { data: userInterests = [], isLoading: isLoadingInterests } = useUserInterests();
  const { data: userPrompts = [], isLoading: isLoadingPrompts } = useUserPrompts();

  // Get user badges
  const { data: userBadges = [] } = useUserBadges();
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
          const date = event.computed_start_date.slice(0, 10); // Extract YYYY-MM-DD
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
        {/* Filter Controls */}
        <div className='flex items-center justify-between gap-2'>
          {/* Timeframe Toggle */}
          <div className='flex items-center rounded-full bg-gray-50 p-1'>
            <button
              onClick={() => setTimeframe('future')}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                timeframe === 'future'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeframe('past')}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                timeframe === 'past'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Past
            </button>
          </div>

          <div className='flex items-center gap-2'>
            {/* Sort Toggle */}
            <div className='flex items-center rounded-full bg-gray-50 p-1'>
              <button
                onClick={() => setSortBy('date-desc')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  sortBy === 'date-desc'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Latest
              </button>
              <button
                onClick={() => setSortBy('date-asc')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  sortBy === 'date-asc'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Oldest
              </button>
            </div>

            {/* Search Button */}
            <CircledIconButton icon={Search} onClick={() => setShowEventSearchSheet(true)} />
          </div>
        </div>

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
        {user && (
          <SocialLinks
            user={user}
            showQRCode={true}
            username={user.username}
            userImage={user.image}
          />
        )}

        {/* User Badges */}
        {userBadges.length > 0 && (
          <UserBadgesDisplay
            badges={userBadges}
            isOwnProfile={true}
            onManageClick={() => setShowBadgesManagementSheet(true)}
            onBadgeClick={(badge) => setSelectedBadge(badge)}
          />
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
      <div className='mx-auto max-w-full bg-white md:max-w-md'>
        <div>
          {/* Profile Info */}
          <div>
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
              {/* Zap Button */}
              {user?.ln_address && (
                <div>
                  <ZapSheet
                    recipientLightningAddress={user.ln_address}
                    recipientName={user.name || 'You'}
                    recipientUsername={user.username}
                    recipientAvatar={user.image}
                  />
                </div>
              )}
              {/* Edit Profile Button - desktop only */}
              <div className='mt-2 hidden lg:block'>
                <Button
                  variant='ghost'
                  className='w-full shadow-none'
                  onClick={() => router.push('/e/profile/edit')}
                >
                  Edit Profile
                  <ArrowUpRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className='px-4 pb-32'>
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

      {/* Badges Management Sheet */}
      <BadgesManagementSheet
        isOpen={showBadgesManagementSheet}
        onClose={() => setShowBadgesManagementSheet(false)}
      />

      {/* Badge Detail Sheet */}
      <BadgeDetailSheet
        badge={selectedBadge}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}
