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
import { ZapSheet } from '@/components/zap/zap-sheet';
import { usePinnedEvent, useUpdatePinnedEvent } from '@/lib/hooks/use-pinned-event';
import { EventSortBy, useUserEvents, type EventTimeframe } from '@/lib/hooks/use-user-events';
import { useOtherUserInterests } from '@/lib/hooks/use-user-interests';
import {
  useFollowAction,
  useFollowStatus,
  useUserByUsername,
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
} from '@/lib/hooks/use-user-profile';
import { useOtherUserPrompts } from '@/lib/hooks/use-user-prompts';
import { useAuth } from '@/lib/stores/auth-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { EventHost } from '@/lib/types/event';
import { toast } from '@/lib/utils/toast';
import { motion } from 'framer-motion';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BadgeCheck,
  Calendar,
  ChevronDown,
  History,
  Loader2,
  MessageCircle,
  Search,
  Share,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserProfilePageClient() {
  // Fetch auth state but don’t enforce login – allows public profile view
  const { user, isLoading: isCheckingAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { setTopBar } = useTopBar();
  const [activeTab, setActiveTab] = useState('about');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('future');
  const [sortBy, setSortBy] = useState<EventSortBy>('date-desc');
  const [timeframePopoverOpen, setTimeframePopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);
  const [showEventSearchSheet, setShowEventSearchSheet] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);

  // Fetch user data from API
  const username = params.username as string;
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
  } = useUserByUsername(username);

  // Get follow status for this user
  const { data: followStatus, isLoading: isFollowStatusLoading } = useFollowStatus(
    userData?.id || ''
  );

  // Consolidated follow/unfollow mutation
  const followActionMutation = useFollowAction();

  const { data: eventCount = 0 } = useUserEventCount(userData?.id || '');
  const { data: followers = [] } = useUserFollowers(userData?.id || '');
  const { data: following = [] } = useUserFollowing(userData?.id || '');

  // Get user interests and prompts (only visible prompts for other users)
  const { data: userInterests = [], isLoading: isLoadingInterests } = useOtherUserInterests(
    userData?.id
  );
  const { data: userPrompts = [], isLoading: isLoadingPrompts } = useOtherUserPrompts(userData?.id);

  // Transform API data to match expected format (moved before useEffect)
  const userProfile = userData
    ? {
        name: userData.name || 'Unknown User',
        username: `@${userData.username}`,
        image: userData.image || '/placeholder.svg?height=80&width=80',
        verification_status: userData.verification_status,
        status: userData.bio || '',
        bio: userData.bio || '',
        website: userData.bio_link || '',
        isVerified: userData.verification_status === 'verified',
        stats: {
          events: eventCount,
          following: following.length,
          followers: followers.length,
          countries: 0, // This would need to be calculated from events
          mutuals: 0, // This would need to be calculated
        },
      }
    : null;

  const handleFollowToggle = () => {
    if (!userData?.id) {
      toast.error('Unable to identify user');
      return;
    }

    const action = followStatus?.isFollowing ? 'unfollow' : 'follow';

    followActionMutation.mutate(
      { userId: userData.id, action },
      {
        onSuccess: () => {
          if (action === 'follow') {
            toast.success(`You followed ${userData.name || 'this user'}!`);
          } else {
            toast.success(`You unfollowed ${userData.name || 'this user'}`);
          }
        },
        onError: () => {
          toast.error(`Failed to ${action}. Please try again.`);
        },
      }
    );
  };

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: `${userProfile?.name || 'User'} on Evento`,
      text: `Check out ${userProfile?.name || 'User'}'s profile on Evento`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to share profile');
      }
    }
  };

  // Set TopBar content for overlay mode - moved before conditional returns
  useEffect(() => {
    // Only set TopBar if userData is loaded and available
    if (userData && userProfile) {
      setTopBar({
        leftMode: 'menu',
        title: userProfile.name,
        subtitle: `@${userProfile.username}`,
        buttons: [
          {
            id: 'share',
            icon: Share,
            onClick: handleShare,
            label: 'Share Profile',
          },
        ],
        showAvatar: false,
        isOverlaid: true,
      });
    }

    return () => {
      setTopBar({
        leftMode: 'menu',
        buttons: [],
        showAvatar: true,
        isOverlaid: false,
      });
    };
  }, [userProfile?.name, userProfile?.username, setTopBar]);

  // Fetch pinned event
  const { data: pinnedEvent } = usePinnedEvent(user?.username || '');
  const {
    mutate: updatePinnedEvent,
    isPending: isUpdatingPinnedEvent,
    variables: updatePinnedEventVariables,
  } = useUpdatePinnedEvent();

  // Fetch user events (always show all events - 'upcoming' filter)
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

  // Handle loading state
  if (isUserLoading || isCheckingAuth) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <Skeleton variant='profile' />
      </div>
    );
  }

  // Handle user not found
  if (userError || !userProfile) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col items-center justify-center bg-white p-4 md:max-w-sm'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
            <UserMinus className='h-8 w-8 text-gray-400' />
          </div>
          <h2 className='mb-2 text-xl font-bold text-gray-900'>User not found</h2>
          <p className='mb-4 text-gray-500'>
            The user @{username} doesn&apos;t exist or may have been deleted.
          </p>
          <Button onClick={() => router.back()} variant='outline'>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const profilePhotos = [
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
    '/placeholder.svg?height=120&width=120',
  ];

  const profileQuestions = [
    {
      question: 'My travel style',
      answer: 'Slow travel with deep cultural immersion',
    },
    {
      question: 'Dream destination',
      answer: 'Patagonia - for the untouched wilderness',
    },
    {
      question: "Can't travel without",
      answer: 'My Fujifilm camera and matcha powder',
    },
    {
      question: 'Best travel memory',
      answer: 'Sunrise hot air balloon ride over Cappadocia',
    },
  ];

  const interestTags = [
    'Photography',
    'Food',
    'Culture',
    'Architecture',
    'Street Art',
    'Coffee',
    'Hiking',
  ];

  const handleMessage = () => {
    toast.success('Message feature coming soon!');
  };

  // Handle profile photo click for lightbox
  const handleProfilePhotoClick = (index: number) => {
    toast.info(`Viewing photo ${index + 1}`);
    setSelectedImageIndex(index);
  };

  // Handle avatar click for lightbox
  const handleAvatarClick = () => {
    setSelectedAvatarIndex(0);
  };

  // Format avatar data for LightboxViewer
  const avatarImages = [
    {
      id: 'avatar',
      image: userProfile?.image || '/placeholder.svg?height=80&width=80',
      user_details: {
        id: userData?.id,
        username: userProfile?.username,
        name: userProfile?.name,
        image: userProfile?.image,
        verification_status: userData?.verification_status,
      },
      created_at: new Date().toISOString(),
    },
  ];

  // Placeholder delete function for avatar (should not be used)
  const handleAvatarDelete = async (photoId: string) => {
    // Avatar deletion should typically not be allowed from lightbox
    return { success: false };
  };

  // Format profile photos for LightboxViewer
  const formattedProfilePhotos = profilePhotos.map((photoUrl, index) => ({
    id: `profile-photo-${index}`,
    image: photoUrl,
    user_details: {
      id: userData?.id,
      username: userProfile?.username,
      name: userProfile?.name,
      image: userProfile.image,
      verification_status: userData?.verification_status,
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
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton variant='event-compact-item' key={i} />
              ))}
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
          onPin={handlePinEvent}
          pinnedEventId={pinnedEvent?.id}
          isOwnProfile={true}
        />
      </div>
    );
  };

  const renderAboutTab = () => {
    return (
      <div className='space-y-4'>
        {/* Social Links - hidden on desktop (shown below Zap button instead) */}
        {userData && (
          <div className='lg:hidden'>
            <SocialLinks
              user={{
                bio_link: userData.bio_link,
                instagram_handle: userData.instagram_handle,
                x_handle: userData.x_handle,
                nip05: userData.nip05,
              }}
            />
          </div>
        )}

        {/* Bio/Description */}
        {!userProfile?.bio ? null : (
          <div>
            <RowCard title={'Bio'} subtitle={userProfile?.bio} />
          </div>
        )}

        {/* User Interests */}
        {!isLoadingInterests && <UserInterests interests={userInterests} />}

        {/* User Prompts (only visible ones) */}
        {!isLoadingPrompts && <UserPrompts prompts={userPrompts} isOwnProfile={false} />}
      </div>
    );
  };

  return (
    <div className='min-h-screen bg-white md:ml-[280px]'>
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
                user={userProfile}
                size='lg'
                onAvatarClick={handleAvatarClick}
                onVerificationClick={() => setShowVerificationModal(true)}
                className='absolute -bottom-16 left-1/2 -translate-x-1/2 transform'
              />
            </div>

            {/* Profile Section */}
            <div className='mb-4 bg-white px-6 pb-2 pt-20'>
              {/* User Info - Centered */}
              <div className='mb-6 text-center'>
                <h2 className='text-2xl font-bold text-gray-900'>
                  {userProfile?.name || 'Unknown User'}
                </h2>
                <p className='text-gray-600'>{userProfile?.username || ''}</p>
              </div>

              {/* Stats - Centered */}
              <div className='mb-4 flex justify-center'>
                <div className='grid grid-cols-3 gap-8'>
                  <div className='text-center'>
                    <div className='text-xl font-bold text-gray-900'>{eventCount}</div>
                    <div className='text-sm text-gray-500'>Events</div>
                  </div>
                  <motion.button
                    className='text-center'
                    onClick={() => setShowFollowingSheet(true)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className='text-xl font-bold text-gray-900'>{following?.length || 0}</div>
                    <div className='text-sm text-gray-500'>Following</div>
                  </motion.button>
                  <motion.button
                    className='text-center'
                    onClick={() => setShowFollowersSheet(true)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className='text-xl font-bold text-gray-900'>{followers?.length || 0}</div>
                    <div className='text-sm text-gray-500'>Followers</div>
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='-mx-2.5 mb-4 flex gap-2 px-2.5 pt-4'>
                <div className='flex w-full flex-row gap-4'>
                  <Button
                    onClick={handleFollowToggle}
                    disabled={isFollowStatusLoading || followActionMutation.isPending}
                    className={`h-12 flex-1 rounded-full border border-gray-200 px-6 text-base ${
                      followStatus?.isFollowing
                        ? 'bg-gray-50 text-gray-900 hover:bg-gray-200'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {followStatus?.isFollowing ? (
                      <>
                        <UserMinus className='mr-2 h-4 w-4' />
                        {followActionMutation.isPending ? 'Unfollowing...' : 'Following'}
                      </>
                    ) : (
                      <>
                        <UserPlus className='mr-2 h-4 w-4' />
                        {followActionMutation.isPending ? 'Following...' : 'Follow'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleMessage}
                    className='h-12 flex-1 rounded-full bg-gray-50 px-6 text-base text-gray-900 hover:bg-gray-200'
                  >
                    <MessageCircle className='h-4 w-4' />
                    Message
                  </Button>
                </div>
              </div>

              {/* Zap Button */}
              {userData?.ln_address && (
                <div className='mb-6'>
                  <ZapSheet
                    recipientLightningAddress={userData.ln_address}
                    recipientName={userData.name || 'Unknown User'}
                    recipientUsername={userData.username}
                    recipientAvatar={userData.image}
                  />
                </div>
              )}

              {/* Social Links - desktop only, below Zap button */}
              <div className='hidden lg:mb-6 lg:flex lg:justify-center'>
                <SocialLinks
                  user={{
                    bio_link: userData?.bio_link,
                    instagram_handle: userData?.instagram_handle,
                    x_handle: userData?.x_handle,
                    nip05: userData?.nip05,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className='pb-20 lg:w-1/2'>
            {/* Tabbed Section */}
            <div className='mb-4 w-full bg-white px-6 lg:px-0'>
              {/* Tab Headers */}
              <SegmentedTabs
                items={[
                  { value: 'about', label: 'About' },
                  { value: 'events', label: 'Events' },
                ]}
                value={activeTab}
                onValueChange={(v) => setActiveTab(v)}
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

      {/* Bottom Navbar */}
      <Navbar />

      {/* Followers Sheet */}
      <FollowersSheet
        isOpen={showFollowersSheet}
        onClose={() => setShowFollowersSheet(false)}
        userId={userData?.id || ''}
        username={userData?.username || 'user'}
      />

      {/* Following Sheet */}
      <FollowingSheet
        isOpen={showFollowingSheet}
        onClose={() => setShowFollowingSheet(false)}
        userId={userData?.id || ''}
        username={userData?.username || 'user'}
      />

      {/* Website Redirect Modal */}
      {showWebsiteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 text-center md:max-w-sm'>
            <h3 className='mb-4 text-xl font-bold'>Leaving Evento</h3>
            <p className='mb-6 text-gray-600'>
              Are you about to leave Evento and be redirected to sarahchen.com?
            </p>
            <div className='mb-6 text-6xl font-bold text-red-500'>{countdown}</div>
            <Button
              onClick={() => {
                setShowWebsiteModal(false);
                window.open(userData?.bio_link || '#', '_blank', 'noopener,noreferrer');
              }}
              className='w-full bg-red-500 text-white hover:bg-red-600'
            >
              Take me to sarahchen.com
            </Button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 text-center md:max-w-sm'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50'>
              <BadgeCheck className='h-8 w-8 rounded-full bg-red-600 text-white shadow-sm' />
            </div>
            <h3 className='mb-4 text-xl font-bold text-gray-900'>This user is verified</h3>
            <p className='mb-6 text-gray-600'>
              This user is a premium member with a verified account. Verified users have enhanced
              credibility and access to exclusive features on our platform.
            </p>
            <div className='flex flex-col gap-3'>
              <Button
                onClick={() => {
                  setShowVerificationModal(false);
                  router.push(
                    '/e/contact?title=Account%20Verification%20Inquiry&message=Hi,%20I%20would%20like%20to%20learn%20more%20about%20account%20verification%20and%20how%20I%20can%20become%20a%20verified%20user.%20Please%20provide%20information%20about%20the%20verification%20process%20and%20requirements.'
                  );
                }}
                className='w-full bg-red-500 text-white hover:bg-red-600'
              >
                Get in touch about verification
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
        handleDelete={handleAvatarDelete}
        userId=''
        eventId=''
      />

      {/* Profile Photos Lightbox */}
      <LightboxViewer
        images={formattedProfilePhotos}
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={setSelectedImageIndex}
        showDropdownMenu={false}
        handleDelete={async (photoId: string) => ({ success: false })}
        userId=''
        eventId=''
      />
    </div>
  );
}
