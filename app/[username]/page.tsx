'use client';

import FollowersSheet from '@/components/followers-sheet/FollowersSheet';
import FollowingSheet from '@/components/followers-sheet/FollowingSheet';
import SocialLinks from '@/components/profile/social-links';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SilkLightbox, SilkLightboxRef } from '@/components/ui/silk-lightbox';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  useUserByUsername,
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
} from '@/lib/hooks/useUserProfile';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { BadgeCheck, MessageCircle, Share, UserMinus, UserPlus, Zap } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function UserProfilePage() {
  // Fetch auth state but don’t enforce login – allows public profile view
  const { isLoading: isCheckingAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { setTopBar, setOverlaid } = useTopBar();
  const [activeTab, setActiveTab] = useState('about');
  const [eventsFilter, setEventsFilter] = useState('attending');
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingUsers, setFollowingUsers] = useState(new Set([1, 3, 5]));
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const avatarLightboxRef = useRef<SilkLightboxRef>(null);
  const photosLightboxRef = useRef<SilkLightboxRef>(null);

  // Fetch user data from API
  const username = params.username as string;
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
  } = useUserByUsername(username);
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

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: `${userProfile?.name} on Evento`,
      text: `Check out ${userProfile?.name}'s profile on Evento`,
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
        subtitle: userProfile.username,
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
  }, [userData, userProfile?.name, userProfile?.username, setTopBar]);

  // Handle loading state
  if (isUserLoading || isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full items-center justify-center bg-white md:max-w-sm'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
      </div>
    );
  }

  // Handle user not found
  if (userError || !userData || !userProfile) {
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

  const attendingEvents = [
    {
      id: 1,
      title: 'Tokyo Skytree Sunset',
      date: 'Sep 15, 2025',
      time: '6:30 PM',
      location: 'Tokyo, Japan',
      image: '/placeholder.svg?height=60&width=60',
    },
    {
      id: 2,
      title: 'Shibuya Food Tour',
      date: 'Sep 20, 2025',
      time: '7:00 PM',
      location: 'Tokyo, Japan',
      image: '/placeholder.svg?height=60&width=60',
    },
    {
      id: 3,
      title: 'Kyoto Temple Walk',
      date: 'Sep 25, 2025',
      time: '9:00 AM',
      location: 'Kyoto, Japan',
      image: '/placeholder.svg?height=60&width=60',
    },
  ];

  const hostingEvents = [
    {
      id: 4,
      title: 'Photography Meetup',
      date: 'Sep 18, 2025',
      time: '2:00 PM',
      location: 'Tokyo, Japan',
      image: '/placeholder.svg?height=60&width=60',
    },
  ];

  const followingList = following.map((user) => ({
    id: user.id,
    name: user.name || 'Unknown User',
    username: `@${user.username}`,
    avatar: user.image || '/placeholder.svg?height=50&width=50',
  }));

  const followersList = followers.map((user) => ({
    id: user.id,
    name: user.name || 'Unknown User',
    username: `@${user.username}`,
    avatar: user.image || '/placeholder.svg?height=50&width=50',
  }));

  const mockFollowingList = [
    {
      id: 1,
      name: 'Marcus Johnson',
      username: '@marcusj',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 2,
      name: 'Emma Rodriguez',
      username: '@emmar',
      avatar: '/placeholder.svg?height=50&width=50',
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

  const handleWebsiteClick = () => {
    setShowWebsiteModal(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWebsiteModal(false);
          window.open(userProfile.website, '_blank', 'noopener,noreferrer');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFollowToggle = (userId?: number) => {
    if (userId) {
      const newFollowingUsers = new Set(followingUsers);
      if (followingUsers.has(userId)) {
        newFollowingUsers.delete(userId);
        toast.success('Unfollowed user');
      } else {
        newFollowingUsers.add(userId);
        toast.success('Following user');
      }
      setFollowingUsers(newFollowingUsers);
    } else {
      setIsFollowing(!isFollowing);
      toast.success(
        isFollowing ? `Unfollowed ${userProfile.name}` : `Following ${userProfile.name}`
      );
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/${username.replace('@', '')}`);
  };

  const handleMessage = () => {
    toast.success('Message feature coming soon!');
  };

  const handleTip = () => {
    toast.success('Lightning payment coming soon!');
  };

  const handleProfilePhotoClick = (index: number) => {
    photosLightboxRef.current?.open(index);
  };

  const handleAvatarClick = () => {
    avatarLightboxRef.current?.open();
  };

  const groupEventsByDate = (events: typeof attendingEvents) => {
    const grouped = events.reduce(
      (acc, event) => {
        const date = event.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(event);
        return acc;
      },
      {} as Record<string, typeof events>
    );

    return Object.entries(grouped).map(([date, events]) => ({
      date,
      events,
      formattedDate: formatDateHeader(date),
    }));
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + ', 2025');
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER',
    ];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();

    return `${dayName}, ${monthName} ${day}`;
  };

  const renderEventsTab = () => {
    const currentEvents = eventsFilter === 'attending' ? attendingEvents : hostingEvents;
    const groupedEvents = groupEventsByDate(currentEvents);

    return (
      <div className='space-y-4'>
        {/* Filter Badges */}
        <div className='flex gap-2'>
          <button
            onClick={() => setEventsFilter('attending')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              eventsFilter === 'attending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Attending
          </button>
          <button
            onClick={() => setEventsFilter('hosting')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              eventsFilter === 'hosting'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Hosting
          </button>
        </div>

        {/* Events List with Date Dividers */}
        <div className='space-y-6'>
          {groupedEvents.map((group, groupIndex) => (
            <div key={group.date}>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-medium text-gray-500'>{group.formattedDate}</h2>
              </div>

              <div className='space-y-4'>
                {group.events.map((event) => (
                  <div
                    key={event.id}
                    className='-m-2 flex cursor-pointer items-start gap-4 rounded-xl p-2 transition-colors hover:bg-gray-50'
                    onClick={() => router.push(`/e/event/cosmoprof-2025`)}
                  >
                    <img
                      src={event.image || '/placeholder.svg'}
                      alt={event.title}
                      className='h-12 w-12 flex-shrink-0 rounded-xl object-cover'
                    />
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold transition-colors hover:text-red-600'>
                        {event.title}
                      </h3>
                      <p className='text-gray-500'>{event.location}</p>
                    </div>
                    <div className='text-right'>
                      <span className='text-sm text-gray-600'>{event.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {currentEvents.length === 0 && (
          <div className='py-8 text-center'>
            <p className='text-gray-500'>No {eventsFilter} events yet</p>
          </div>
        )}
      </div>
    );
  };

  const renderAboutTab = () => (
    <div className='space-y-6'>
      {/* Bio/Description */}
      <div>
        <p className='text-gray-700'>{userProfile.bio}</p>
      </div>

      {/* Interest Tags */}
      <div>
        <h4 className='mb-3 font-semibold text-gray-900'>Interests</h4>
        <div className='flex flex-wrap gap-2'>
          {interestTags.map((tag, index) => (
            <span
              key={index}
              className='inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800'
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Profile Questions */}
      <div>
        <h4 className='mb-3 font-semibold text-gray-900'>About Me</h4>
        <div className='space-y-3'>
          {profileQuestions.map((item, index) => (
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
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {profilePhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => handleProfilePhotoClick(index)}
              className='aspect-square overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-90'
            >
              <img
                src={photo || '/placeholder.svg'}
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
        <div className='text-3xl font-bold text-blue-600'>{userProfile.stats.countries}</div>
        <div className='text-sm text-gray-600'>Countries</div>
      </div>
      <div className='rounded-xl bg-green-50 p-4 text-center'>
        <div className='text-3xl font-bold text-green-600'>{userProfile.stats.mutuals}</div>
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
          <div className='absolute -bottom-16 left-1/2 -translate-x-1/2 transform'>
            <button onClick={handleAvatarClick} className='relative'>
              <Avatar className='h-36 w-36 border-4 border-white shadow-lg'>
                <AvatarImage src={userProfile.avatar || ''} alt='Profile' />
                <AvatarFallback className='bg-white text-3xl'>
                  {userProfile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Verification Badge */}
              {userProfile.isVerified && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVerificationModal(true);
                  }}
                  className='absolute bottom-0 right-0 transition-transform hover:scale-105'
                >
                  <BadgeCheck className='h-8 w-8 rounded-full bg-red-600 text-white shadow-sm' />
                </button>
              )}
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className='mb-4 bg-white px-6 pb-2 pt-20'>
          {/* User Info - Centered */}
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-bold text-gray-900'>{userProfile.name}</h2>
            <p className='text-gray-600'>{userProfile.username}</p>
          </div>

          {/* Stats - Centered */}
          <div className='mb-6 flex justify-center'>
            <div className='grid grid-cols-3 gap-8'>
              <div className='text-center'>
                <div className='text-xl font-bold text-gray-900'>{userProfile.stats.events}</div>
                <div className='text-sm text-gray-500'>Events</div>
              </div>
              <button className='text-center' onClick={() => setShowFollowingSheet(true)}>
                <div className='text-xl font-bold text-gray-900'>{userProfile.stats.following}</div>
                <div className='text-sm text-gray-500'>Following</div>
              </button>
              <button className='text-center' onClick={() => setShowFollowersSheet(true)}>
                <div className='text-xl font-bold text-gray-900'>{userProfile.stats.followers}</div>
                <div className='text-sm text-gray-500'>Followers</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='-mx-2.5 mb-6 flex gap-2 px-2.5'>
            <Button
              onClick={() => handleFollowToggle()}
              className={`flex-1 rounded-xl px-2.5 ${
                isFollowing
                  ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserMinus className='h-4 w-4' />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className='h-4 w-4' />
                  Follow
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

        {/* Tabbed Section */}
        <div className='mb-4 bg-white'>
          {/* Tab Headers */}
          <div className='flex gap-2 px-4 py-3'>
            <button
              onClick={() => setActiveTab('about')}
              className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                activeTab === 'about'
                  ? 'bg-gray-100 text-black'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                activeTab === 'events'
                  ? 'bg-gray-100 text-black'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`rounded-full border border-gray-200 px-3 py-1.5 text-base font-normal transition-all ${
                activeTab === 'stats'
                  ? 'bg-gray-100 text-black'
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              Stats
            </button>
          </div>

          {/* Tab Content */}
          <div className='p-4'>
            {activeTab === 'about' && renderAboutTab()}
            {activeTab === 'events' && renderEventsTab()}
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
                window.open(userProfile.website, '_blank', 'noopener,noreferrer');
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
      <SilkLightbox
        ref={avatarLightboxRef}
        images={[userProfile.avatar]}
        eventTitle={`${userProfile.name}'s Profile`}
      />

      {/* Profile Photos Lightbox */}
      <SilkLightbox
        ref={photosLightboxRef}
        images={profilePhotos}
        eventTitle={`${userProfile.name}'s Photos`}
      />
    </div>
  );
}
