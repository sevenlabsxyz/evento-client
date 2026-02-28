'use client';

import { BadgeDetailSheet } from '@/components/badges/badge-detail-sheet';
import { BadgeItem } from '@/components/badges/badge-item';
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
import ProfileCampaignCard from '@/components/profile/profile-campaign-card';
import RowCard from '@/components/row-card';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ZapSheet } from '@/components/zap/zap-sheet';
import { usePublicUserBadges } from '@/lib/hooks/use-badges';
import { usePinnedEvent, useUpdatePinnedEvent } from '@/lib/hooks/use-pinned-event';
import { usePublicUserEvents } from '@/lib/hooks/use-public-user-events';
import { type EventTimeframe } from '@/lib/hooks/use-user-events';
import { useOtherUserInterests } from '@/lib/hooks/use-user-interests';
import {
  useFollowAction,
  useFollowStatus,
  useUserByUsername,
  useUserEventCount,
  useUserFollowersCount,
  useUserFollowingCount,
} from '@/lib/hooks/use-user-profile';
import { useOtherUserPrompts } from '@/lib/hooks/use-user-prompts';
import { useAuth } from '@/lib/stores/auth-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { UserBadge } from '@/lib/types/badges';
import { EventHost } from '@/lib/types/event';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  Search,
  Share,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function UserProfilePageClient() {
  // Fetch auth state but don’t enforce login – allows public profile view
  const { user, isLoading: isCheckingAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { setTopBar } = useTopBar();
  const [activeTab, setActiveTab] = useState('about');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('future');
  const [hasAutoSelectedInitialTab, setHasAutoSelectedInitialTab] = useState(false);
  const [hasAutoSwitchedToPast, setHasAutoSwitchedToPast] = useState(false);
  const [showEventSearchSheet, setShowEventSearchSheet] = useState(false);
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [countdown] = useState(3);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

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
  const { data: followersCount = 0 } = useUserFollowersCount(userData?.id || '');
  const { data: followingCount = 0 } = useUserFollowingCount(userData?.id || '');

  // Get user interests and prompts (only visible prompts for other users)
  const { data: userInterests = [], isLoading: isLoadingInterests } = useOtherUserInterests(
    userData?.id
  );
  const { data: userPrompts = [], isLoading: isLoadingPrompts } = useOtherUserPrompts(userData?.id);

  // Get user badges (displayed badges only)
  const { data: userBadges = [] } = usePublicUserBadges(userData?.id);

  const hasAboutContent = useMemo(() => {
    if (!userData) return false;

    const hasBio = Boolean(userData.bio?.trim());
    const hasSocialLinks = [
      userData.bio_link,
      userData.instagram_handle,
      userData.x_handle,
      userData.nip05,
    ].some((value) => Boolean(value?.trim()));

    return hasBio || hasSocialLinks || userInterests.length > 0 || userPrompts.length > 0;
  }, [userData, userInterests.length, userPrompts.length]);

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
          following: followingCount,
          followers: followersCount,
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
        logger.info('Share cancelled or failed');
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

  // Set TopBar content
  useEffect(() => {
    // Only set TopBar if userData is loaded and available
    if (userData && userProfile) {
      setTopBar({
        leftMode: 'menu',
        title: `${userProfile.name} (${userProfile.username})`,
        buttons: [
          {
            id: 'share',
            icon: Share,
            onClick: handleShare,
            label: 'Share Profile',
          },
        ],
      });
    }

    return () => {
      setTopBar({
        title: '',
        buttons: [],
      });
    };
  }, [userProfile?.name, setTopBar]);

  // Fetch pinned event
  const { data: pinnedEvent } = usePinnedEvent(user?.username || '');
  const {
    mutate: updatePinnedEvent,
    isPending: isUpdatingPinnedEvent,
    variables: updatePinnedEventVariables,
  } = useUpdatePinnedEvent();
  void pinnedEvent;
  void updatePinnedEventVariables;

  // Fetch public events for the viewed user
  const { data: publicEventsData, isLoading: isLoadingEvents } = usePublicUserEvents({
    username,
    enabled: activeTab === 'events',
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const upcomingEvents = useMemo(
    () =>
      (publicEventsData || []).filter((event: EventWithUser) => event.computed_start_date >= today),
    [publicEventsData, today]
  );

  const pastEvents = useMemo(
    () =>
      (publicEventsData || []).filter((event: EventWithUser) => event.computed_start_date < today),
    [publicEventsData, today]
  );

  useEffect(() => {
    setActiveTab('about');
    setTimeframe('future');
    setHasAutoSelectedInitialTab(false);
    setHasAutoSwitchedToPast(false);
  }, [username]);

  useEffect(() => {
    if (hasAutoSelectedInitialTab || !userData || isLoadingInterests || isLoadingPrompts) {
      return;
    }

    setActiveTab(hasAboutContent ? 'about' : 'events');
    setHasAutoSelectedInitialTab(true);
  }, [hasAboutContent, hasAutoSelectedInitialTab, isLoadingInterests, isLoadingPrompts, userData]);

  useEffect(() => {
    if (activeTab !== 'events' || hasAutoSwitchedToPast || isLoadingEvents) {
      return;
    }

    if (upcomingEvents.length === 0) {
      setTimeframe('past');
      setHasAutoSwitchedToPast(true);
    }
  }, [activeTab, hasAutoSwitchedToPast, isLoadingEvents, upcomingEvents.length]);

  // Handle loading state
  if (isUserLoading || isCheckingAuth) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <Skeleton variant='profile' />
      </div>
    );
  }

  // Handle user not found - check for valid user data (id must exist)
  if (userError || !userData?.id) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <Empty className='flex-1'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <UserMinus className='h-6 w-6' />
            </EmptyMedia>
            <EmptyTitle>User not found</EmptyTitle>
            <EmptyDescription>
              The user @{username} doesn&apos;t exist or may have been deleted.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => router.back()}
              variant='outline'
              className='rounded-full bg-gray-50'
            >
              <ArrowLeft className='h-4 w-4' />
              Go Back
            </Button>
          </EmptyContent>
        </Empty>
        <Navbar />
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
  void profileQuestions;

  const interestTags = [
    'Photography',
    'Food',
    'Culture',
    'Architecture',
    'Street Art',
    'Coffee',
    'Hiking',
  ];
  void interestTags;

  const handleMessage = () => {
    toast.success('Message feature coming soon!');
  };

  // Handle profile photo click for lightbox
  const handleProfilePhotoClick = (index: number) => {
    toast.info(`Viewing photo ${index + 1}`);
    setSelectedImageIndex(index);
  };
  void handleProfilePhotoClick;

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
    void photoId;
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
      image: userProfile?.image,
      verification_status: userData?.verification_status,
    },
    created_at: new Date().toISOString(),
  }));

  const renderEventsTab = () => {
    const eventsForTimeframe = timeframe === 'future' ? upcomingEvents : pastEvents;

    // Group events by date
    const groupedEvents = eventsForTimeframe
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
        ) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    const canPinEvent = (event: EventWithUser) => {
      if (!user) return false;

      // User can pin if they are the event creator
      if (event.user_details.id === user.id) return true;

      // User can pin if they are a co-host
      const isCoHost = event.hosts?.some((host: EventHost) => host.id === user.id);
      return isCoHost;
    };
    void canPinEvent;

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
    void handlePinEvent;

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
        {/* Filter Controls */}
        <div className='flex justify-center'>
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
        </div>

        <div className='flex justify-end'>
          {/* Search Button */}
          <CircledIconButton icon={Search} onClick={() => setShowEventSearchSheet(true)} />
        </div>

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
              <p className='text-sm text-gray-500'>
                {timeframe === 'future' ? 'No upcoming events found' : 'No past events found'}
              </p>
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
        </div>

        {/* Event Search Sheet */}
        <EventSearchSheet
          isOpen={showEventSearchSheet}
          onClose={() => setShowEventSearchSheet(false)}
          username={username}
          isOwnProfile={false}
        />
      </div>
    );
  };

  const renderAboutTab = () => {
    return (
      <div className='space-y-4'>
        {/* Social Links */}
        {userData && (
          <SocialLinks
            user={{
              bio_link: userData.bio_link,
              instagram_handle: userData.instagram_handle,
              x_handle: userData.x_handle,
              nip05: userData.nip05,
            }}
            showQRCode={true}
            username={userData.username}
            userImage={userData.image}
          />
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

  const renderBadgesTab = () => {
    const sortedBadges = [...userBadges].sort(
      (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
    );

    return (
      <div className='space-y-4'>
        {sortedBadges.length ? (
          <div className='rounded-3xl border border-gray-200 bg-gray-50 p-4'>
            <div className='grid grid-cols-3 gap-4 sm:grid-cols-4'>
              {sortedBadges.map((userBadge) => (
                <BadgeItem
                  key={userBadge.id}
                  badge={userBadge.badge}
                  size='lg'
                  onClick={() => setSelectedBadge(userBadge)}
                  className='w-full'
                />
              ))}
            </div>
          </div>
        ) : (
          <Empty className='py-8'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <BadgeCheck className='size-5' />
              </EmptyMedia>
              <EmptyTitle>No badges yet</EmptyTitle>
              <EmptyDescription>This user has not been awarded any badges yet.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        )}
      </div>
    );
  };

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
                user={userProfile ?? undefined}
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
                    <div className='text-xl font-bold text-gray-900'>{followingCount}</div>
                    <div className='text-sm text-gray-500'>Following</div>
                  </motion.button>
                  <motion.button
                    className='text-center'
                    onClick={() => setShowFollowersSheet(true)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <div className='text-xl font-bold text-gray-900'>{followersCount}</div>
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
                    currentUsername={user?.username}
                  />
                </div>
              )}

              {/* Campaign Card — shown between zap button and tabs */}
              <div className='mb-6'>
                <ProfileCampaignCard username={username} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className='pb-20'>
            {/* Tabbed Section */}
            <div className='mb-4 w-full bg-white px-6 pb-5 md:pb-0 lg:px-0'>
              {/* Tab Headers */}
              <SegmentedTabs
                items={[
                  { value: 'about', label: 'About' },
                  { value: 'events', label: 'Events' },
                  { value: 'badges', label: 'Badges' },
                ]}
                value={activeTab}
                onValueChange={(v) => {
                  setHasAutoSelectedInitialTab(true);
                  setActiveTab(v);
                }}
              />

              {/* Tab Content */}
              <div>
                {activeTab === 'about' && renderAboutTab()}
                {activeTab === 'events' && renderEventsTab()}
                {activeTab === 'badges' && renderBadgesTab()}
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
        handleDelete={async (photoId: string) => {
          void photoId;
          return { success: false };
        }}
        userId=''
        eventId=''
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
