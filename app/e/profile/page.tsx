'use client';

import FollowersSheet from '@/components/followers-sheet/FollowersSheet';
import FollowingSheet from '@/components/followers-sheet/FollowingSheet';
import { Navbar } from '@/components/navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SilkLightbox, SilkLightboxRef } from '@/components/ui/silk-lightbox';
import { useRequireAuth } from '@/lib/hooks/useAuth';
import {
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
  useUserProfile,
} from '@/lib/hooks/useUserProfile';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { BadgeCheck, Camera, Edit3, Globe, Loader2, Settings, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function ProfilePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const { setTopBar, setTransparent } = useTopBar();
  const [activeTab, setActiveTab] = useState('about');
  const [eventsFilter, setEventsFilter] = useState('attending');
  const [showFollowingSheet, setShowFollowingSheet] = useState(false);
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [followingUsers, setFollowingUsers] = useState(new Set([1, 3, 5]));
  const lightboxRef = useRef<SilkLightboxRef>(null);
  const avatarLightboxRef = useRef<SilkLightboxRef>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Get user data from API
  const { user, isLoading: isUserLoading } = useUserProfile();
  const { data: eventCount } = useUserEventCount(user?.id || '');
  const { data: followers } = useUserFollowers(user?.id || '');
  const { data: following } = useUserFollowing(user?.id || '');

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Profile',
      subtitle: user?.username ? `@${user.username}` : '@user',
      rightContent: (
        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30'
            onClick={() => router.push('/e/profile/edit')}
          >
            <Edit3 className='h-5 w-5 text-white' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30'
            onClick={() => router.push('/e/settings')}
          >
            <Settings className='h-5 w-5 text-white' />
          </Button>
        </div>
      ),
    });
    setTransparent(true);

    return () => {
      setTopBar({ rightContent: null });
      setTransparent(false);
    };
  }, [user?.username, router, setTopBar, setTransparent]);

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
    avatar: user?.image || '/placeholder.svg?height=80&width=80',
    isVerified: user?.verification_status === 'verified',
  };

  const attendingEvents = [
    {
      id: 1,
      title: 'Paris Photography Walk',
      date: 'Sep 20, 2025',
      time: '7:00 PM',
      location: 'Paris, France',
      image: '/placeholder.svg?height=60&width=60',
    },
    {
      id: 2,
      title: 'London Art Gallery Tour',
      date: 'Oct 2, 2025',
      time: '2:00 PM',
      location: 'London, UK',
      image: '/placeholder.svg?height=60&width=60',
    },
    {
      id: 3,
      title: 'Rome Cooking Class',
      date: 'Sep 20, 2025',
      time: '6:30 PM',
      location: 'Rome, Italy',
      image: '/placeholder.svg?height=60&width=60',
    },
  ];

  const hostingEvents = [
    {
      id: 4,
      title: 'Tokyo Food Tour',
      date: 'Sep 15, 2025',
      time: '10:00 AM',
      location: 'Tokyo, Japan',
      image: '/placeholder.svg?height=60&width=60',
    },
    {
      id: 5,
      title: 'Bali Sunrise Hike',
      date: 'Sep 25, 2025',
      time: '5:30 AM',
      location: 'Bali, Indonesia',
      image: '/placeholder.svg?height=60&width=60',
    },
    {
      id: 6,
      title: 'NYC Rooftop Party',
      date: 'Oct 8, 2025',
      time: '8:00 PM',
      location: 'New York, USA',
      image: '/placeholder.svg?height=60&width=60',
    },
  ];

  const followingList = [
    {
      id: 1,
      name: 'Sarah Chen',
      username: '@sarahc',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      username: '@marcusj',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      username: '@emmar',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 4,
      name: 'Alex Kim',
      username: '@alexk',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 5,
      name: 'Lisa Park',
      username: '@lisap',
      avatar: '/placeholder.svg?height=50&width=50',
    },
  ];

  const followersList = [
    {
      id: 6,
      name: 'David Wilson',
      username: '@davidw',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 7,
      name: 'Maria Garcia',
      username: '@mariag',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 8,
      name: 'John Smith',
      username: '@johns',
      avatar: '/placeholder.svg?height=50&width=50',
    },
    {
      id: 9,
      name: 'Anna Johnson',
      username: '@annaj',
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
      answer: 'Adventure seeker with a love for local culture',
    },
    {
      question: 'Dream destination',
      answer: 'New Zealand - for the landscapes and adventure sports',
    },
    {
      question: "Can't travel without",
      answer: 'My camera and a good playlist',
    },
    {
      question: 'Best travel memory',
      answer: 'Watching sunrise from Mount Fuji in Japan',
    },
  ];

  const interestTags = [
    'Photography',
    'Food',
    'Adventure',
    'Culture',
    'Music',
    'Art',
    'Nature',
    'Architecture',
  ];

  const handleSocialClick = (platform: string) => {
    const urls = {
      instagram: user?.instagram_handle ? `https://instagram.com/${user.instagram_handle}` : null,
      x: user?.x_handle ? `https://x.com/${user.x_handle}` : null,
      website: user?.bio_link || null,
    };

    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error(`No ${platform} link available`);
    }
  };

  const handleZap = () => {
    if (user?.ln_address) {
      toast.success(`Lightning: ${user.ln_address}`);
    } else {
      toast.error('No Lightning address available');
    }
  };

  const handleWebsiteClick = () => {
    if (!user?.bio_link) {
      toast.error('No website link available');
      return;
    }

    setShowWebsiteModal(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWebsiteModal(false);
          window.open(user.bio_link, '_blank', 'noopener,noreferrer');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFollowToggle = (userId: number) => {
    const newFollowingUsers = new Set(followingUsers);
    if (followingUsers.has(userId)) {
      newFollowingUsers.delete(userId);
      toast.success('Unfollowed user');
    } else {
      newFollowingUsers.add(userId);
      toast.success('Following user');
    }
    setFollowingUsers(newFollowingUsers);
  };

  const handleUserClick = (username: string) => {
    router.push(`/${username.replace('@', '')}`);
  };

  const handleProfilePhotoClick = (index: number) => {
    lightboxRef.current?.open(index);
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
                  <div key={event.id} className='flex items-start gap-4'>
                    <img
                      src={event.image || '/placeholder.svg'}
                      alt={event.title}
                      className='h-12 w-12 flex-shrink-0 rounded-xl object-cover'
                    />
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold'>{event.title}</h3>
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
        <h4 className='mb-3 font-semibold text-gray-900'>Bio</h4>
        <p className='text-gray-700'>
          Travel enthusiast exploring the world one event at a time. Love photography, food, and
          meeting new people! ✈️📸
        </p>
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
          <Button variant='ghost' size='sm' className='text-red-600'>
            <Camera className='mr-1 h-4 w-4' />
            Add
          </Button>
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
        <div className='text-3xl font-bold text-blue-600'>{userStats.countries}</div>
        <div className='text-sm text-gray-600'>Countries</div>
      </div>
      <div className='rounded-xl bg-green-50 p-4 text-center'>
        <div className='text-3xl font-bold text-green-600'>{userStats.mutuals}</div>
        <div className='text-sm text-gray-600'>Mutuals</div>
      </div>
    </div>
  );

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
          <div className='h-48 w-full bg-gradient-to-br from-red-400 to-red-600 md:h-64' />

          {/* Profile Picture - Centered & Clickable */}
          <div className='absolute -bottom-16 left-1/2 -translate-x-1/2 transform'>
            <button onClick={handleAvatarClick} className='relative'>
              <Avatar className='h-32 w-32 border-4 border-white shadow-lg'>
                <AvatarImage src={userData.avatar || ''} alt='Profile' />
                <AvatarFallback className='bg-white text-3xl'>
                  {userData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Verification Badge */}
              {userData.isVerified && (
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
        <div className='mb-4 bg-white px-6 pb-6 pt-20'>
          {/* User Info - Centered */}
          <div className='mb-6 text-center'>
            <h2 className='text-2xl font-bold text-gray-900'>{userData.name}</h2>
            <p className='text-gray-600'>{userData.username}</p>
          </div>

          {/* Stats - Centered */}
          <div className='mb-6 flex justify-center'>
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

          {/* Status/Title - Centered */}
          {userData.status && (
            <div className='mb-4 text-center'>
              <p className='text-sm font-medium text-gray-600'>{userData.status}</p>
            </div>
          )}

          {/* Website - Centered */}
          {user?.bio_link && (
            <div className='mb-4 flex items-center justify-center gap-2'>
              <Globe className='h-4 w-4 text-gray-500' />
              <button
                onClick={handleWebsiteClick}
                className='text-sm text-blue-600 hover:underline'
              >
                {user.bio_link.replace(/^https?:\/\//, '')}
              </button>
            </div>
          )}

          {/* Social Links - Centered */}
          <div className='flex justify-center gap-3'>
            {/* Instagram */}
            {user?.instagram_handle && (
              <Button
                variant='ghost'
                size='icon'
                className='rounded-full bg-gray-100'
                onClick={() => handleSocialClick('instagram')}
              >
                <div className='flex h-5 w-5 items-center justify-center rounded-sm bg-gradient-to-br from-purple-500 via-pink-500 to-red-400'>
                  <div className='h-3 w-3 rounded-sm border border-white'></div>
                </div>
              </Button>
            )}
            {/* X (Twitter) */}
            {user?.x_handle && (
              <Button
                variant='ghost'
                size='icon'
                className='rounded-full bg-gray-100'
                onClick={() => handleSocialClick('x')}
              >
                <div className='flex h-5 w-5 items-center justify-center rounded-sm bg-black text-xs font-bold text-white'>
                  𝕏
                </div>
              </Button>
            )}
            {/* Lightning Zap */}
            {user?.ln_address && (
              <Button
                variant='ghost'
                size='icon'
                className='rounded-full bg-gray-100'
                onClick={handleZap}
              >
                <Zap className='h-5 w-5 text-yellow-500' />
              </Button>
            )}
          </div>
        </div>

        {/* Tabbed Section */}
        <div className='mb-4 bg-white'>
          {/* Tab Headers */}
          <div className='flex border-b border-gray-200'>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 border-b-2 px-4 py-4 text-center text-sm font-medium transition-colors ${
                activeTab === 'about'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 border-b-2 px-4 py-4 text-center text-sm font-medium transition-colors ${
                activeTab === 'events'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 border-b-2 px-4 py-4 text-center text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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

      {/* Website Redirect Modal */}
      {showWebsiteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
          <div className='w-full max-w-full rounded-2xl bg-white p-6 text-center md:max-w-sm'>
            <h3 className='mb-4 text-xl font-bold'>Leaving Evento</h3>
            <p className='mb-6 text-gray-600'>
              Are you about to leave Evento and be redirected to andrerfneves.com?
            </p>
            <div className='mb-6 text-6xl font-bold text-red-500'>{countdown}</div>
            <Button
              onClick={() => {
                setShowWebsiteModal(false);
                window.open('https://andrerfneves.com', '_blank', 'noopener,noreferrer');
              }}
              className='w-full bg-red-500 text-white hover:bg-red-600'
            >
              Take me to andrerfneves.com
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
      <SilkLightbox
        ref={avatarLightboxRef}
        images={[userData.avatar]}
        eventTitle={`${userData.name}'s Profile`}
      />

      {/* Profile Photos Lightbox */}
      <SilkLightbox ref={lightboxRef} images={profilePhotos} eventTitle='Profile Photos' />

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
