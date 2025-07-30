'use client';

import { EventCompactItem } from '@/components/event-compact-item';
import EventSearchSheet from '@/components/event-search-sheet/EventSearchSheet';
import FollowersSheet from '@/components/followers-sheet/FollowersSheet';
import FollowingSheet from '@/components/followers-sheet/FollowingSheet';
import { LightboxViewer } from '@/components/lightbox-viewer';
import SocialLinks from '@/components/profile/social-links';
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
import { usePinnedEvent, useUpdatePinnedEvent } from '@/lib/hooks/usePinnedEvent';
import {
  EventFilterType,
  EventSortBy,
  useUserEvents,
  type EventTimeframe,
} from '@/lib/hooks/useUserEvents';
import {
  useFollowAction,
  useFollowStatus,
  useUserByUsername,
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
} from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/lib/stores/auth-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { EventHost } from '@/lib/types/event';
import { toast } from '@/lib/utils/toast';
import {
  BadgeCheck,
  Calendar,
  Loader2,
  MessageCircle,
  Search,
  Share,
  SortAsc,
  SortDesc,
  UserMinus,
  UserPlus,
  Zap,
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
  const [eventsFilter, setEventsFilter] = useState<EventFilterType>('upcoming');
  const [timeframe, setTimeframe] = useState<EventTimeframe>('all');
  const [sortBy, setSortBy] = useState<EventSortBy>('created-desc');
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

  // Transform API data to match expected format (moved before useEffect)
  const userProfile = userData
    ? {
        name: userData.name || 'Unknown User',
        username: `@${userData.username}`,
        avatar: userData.image || '/placeholder.svg?height=80&width=80',
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

  // Fetch user events
  const {
    data: userEventsData,
    isLoading: isLoadingEvents,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useUserEvents({
    username: userData?.username || '',
    filter: eventsFilter,
    timeframe: timeframe,
    sortBy: sortBy,
    limit: 10,
    enabled: !!userData?.username && activeTab === 'events',
  });

  // Handle loading state
  if (isUserLoading || isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full items-center justify-center bg-white md:max-w-sm'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
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
            The user @{username} doesn't exist or may have been deleted.
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

  const handleTip = () => {
    toast.success('Lightning payment coming soon!');
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
      image: userProfile?.avatar || '/placeholder.svg?height=80&width=80',
      user_details: {
        id: userData?.id,
        username: userProfile?.username,
        name: userProfile?.name,
        image: userProfile?.avatar,
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
      image: userProfile.avatar,
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
        <div className='mt-4 flex w-full items-center gap-2'>
          <Select
            value={timeframe}
            onValueChange={(value: string) => setTimeframe(value as EventTimeframe)}
          >
            <SelectTrigger className='w-[120px] text-sm'>
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
            <SelectTrigger className='w-[120px] text-sm'>
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
            size='icon'
            variant='outline'
            className='ml-auto'
            onClick={() => setShowEventSearchSheet(true)}
            aria-label='Search events'
          >
            <Search className='h-5 w-5' />
            <span className='sr-only'>Search events</span>
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
                    const isPinned = pinnedEvent?.id === event.id.toString();
                    const canPin = canPinEvent(event);

                    return (
                      <div key={event.id} className='py-2'>
                        <EventCompactItem
                          key={event.id}
                          event={event}
                          isPinning={
                            isUpdatingPinnedEvent &&
                            updatePinnedEventVariables === event.id.toString()
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

  const renderAboutTab = () => (
    <div className='space-y-6'>
      {/* Bio/Description */}
      <div>
        <p className='text-gray-700'>{userProfile?.bio || 'No bio yet.'}</p>
      </div>

      {/* Interest Tags */}
      <div>
        <h4 className='mb-3 font-semibold text-gray-900'>Interests</h4>
        <div className='flex flex-wrap gap-2'>
          {interestTags.map((tag: string) => (
            <span key={tag} className='rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800'>
              {tag}
            </span>
          ))}
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

      {/* Photo Grid */}
      <div>
        <div className='mb-3 flex items-center justify-between'>
          <h4 className='font-semibold text-gray-900'>Photos</h4>
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {profilePhotos.map((photo: string, index: number) => (
            <button
              key={index}
              onClick={() => handleProfilePhotoClick(index)}
              className='aspect-square overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-90'
            >
              <img
                src={photo}
                alt={`Profile photo ${index + 1}`}
                className='h-full w-full object-cover'
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className='grid grid-cols-2 gap-4'>
      <div className='rounded-xl bg-blue-50 p-4 text-center'>
        <div className='text-3xl font-bold text-blue-600'>0</div>
        <div className='text-sm text-gray-600'>Countries</div>
      </div>
      <div className='rounded-xl bg-green-50 p-4 text-center'>
        <div className='text-3xl font-bold text-green-600'>0</div>
        <div className='text-sm text-gray-600'>Mutuals</div>
      </div>
    </div>
  );

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {/* Cover Image Section */}
        <div className='relative'>
          {/* Banner */}
          <div className='h-36 w-full bg-gradient-to-br from-red-400 to-red-600 md:h-44' />

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
          <div className='mb-6 flex justify-center'>
            <div className='grid grid-cols-3 gap-8'>
              <div className='text-center'>
                <div className='text-xl font-bold text-gray-900'>{eventCount}</div>
                <div className='text-sm text-gray-500'>Events</div>
              </div>
              <button className='text-center' onClick={() => setShowFollowingSheet(true)}>
                <div className='text-xl font-bold text-gray-900'>{following?.length || 0}</div>
                <div className='text-sm text-gray-500'>Following</div>
              </button>
              <button className='text-center' onClick={() => setShowFollowersSheet(true)}>
                <div className='text-xl font-bold text-gray-900'>{followers?.length || 0}</div>
                <div className='text-sm text-gray-500'>Followers</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='-mx-2.5 mb-6 flex gap-2 px-2.5'>
            <Button
              onClick={handleFollowToggle}
              disabled={isFollowStatusLoading || followActionMutation.isPending}
              className={`flex-1 rounded-xl px-2.5 ${
                followStatus?.isFollowing
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
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
              className='rounded-xl bg-transparent px-3'
            >
              <MessageCircle className='h-4 w-4' />
              Message
            </Button>
            <Button
              variant='outline'
              onClick={handleTip}
              className='group rounded-xl bg-transparent px-3 transition-colors hover:border-orange-300 hover:bg-orange-100 hover:text-orange-700'
            >
              <Zap className='h-4 w-4 text-black transition-colors group-hover:text-orange-700' />
              Tip
            </Button>
          </div>

          {/* Social Links */}
          {userData && (
            <SocialLinks
              user={{
                bio_link: userData.bio_link,
                instagram_handle: userData.instagram_handle,
                x_handle: userData.x_handle,
                ln_address: userData.ln_address,
                nip05: userData.nip05,
              }}
            />
          )}
        </div>

        <div className='mb-4 w-full bg-white'>
          {/* Tab Headers */}
          <div className='mb-2 flex flex-row items-center justify-center gap-2 px-4 py-3'>
            <button
              onClick={() => setActiveTab('about')}
              className={`text- rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                activeTab === 'about'
                  ? 'bg-gray-100 text-black'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`text- rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                activeTab === 'events'
                  ? 'bg-gray-100 text-black'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`text- rounded-xl px-4 py-2 text-sm font-normal uppercase transition-all ${
                activeTab === 'stats'
                  ? 'bg-gray-100 text-black'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Stats
            </button>
          </div>

          {/* Tab Content */}
          <div className='p-4'>
            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'events' && <div className='events-tab'>{renderEventsTab()}</div>}
            {activeTab === 'stats' && renderStatsTab()}
          </div>
        </div>
      </div>

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
