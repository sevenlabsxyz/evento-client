"use client";

import {
  Globe,
  Zap,
  X,
  MessageCircle,
  UserPlus,
  UserMinus,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTopBar } from "@/lib/stores/topbar-store";
import { toast } from "@/lib/utils/toast";
import { SilkLightbox, SilkLightboxRef } from "@/components/ui/silk-lightbox";
import { useUserByUsername, useUserEventCount, useUserFollowers, useUserFollowing } from "@/lib/hooks/useUserProfile";
import FollowersSheet from "@/components/followers-sheet/FollowersSheet";
import FollowingSheet from "@/components/followers-sheet/FollowingSheet";

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { setTopBar, setTransparent } = useTopBar();
  const [activeTab, setActiveTab] = useState("about");
  const [eventsFilter, setEventsFilter] = useState("attending");
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
  const { data: userData, isLoading: isUserLoading, error: userError } = useUserByUsername(username);
  const { data: eventCount = 0 } = useUserEventCount(userData?.id || '');
  const { data: followers = [] } = useUserFollowers(userData?.id || '');
  const { data: following = [] } = useUserFollowing(userData?.id || '');

  // Handle loading state
  if (isUserLoading) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Handle user not found
  if (userError || !userData) {
    return (
      <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <UserMinus className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-500 mb-4">The user @{username} doesn't exist or may have been deleted.</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Transform API data to match expected format
  const userProfile = {
    name: userData.name || 'Unknown User',
    username: `@${userData.username}`,
    avatar: userData.image || "/placeholder.svg?height=80&width=80",
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
  };

  // Set TopBar content for transparent mode
  useEffect(() => {
    setTopBar({
      title: userProfile.name,
      subtitle: userProfile.username,
      rightContent: null, // No right content for other users' profiles
    });
    setTransparent(true);

    return () => {
      setTopBar({ rightContent: null });
      setTransparent(false);
    };
  }, [userProfile.name, userProfile.username, setTopBar, setTransparent]);

  const attendingEvents = [
    {
      id: 1,
      title: "Tokyo Skytree Sunset",
      date: "Sep 15, 2025",
      time: "6:30 PM",
      location: "Tokyo, Japan",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      title: "Shibuya Food Tour",
      date: "Sep 20, 2025",
      time: "7:00 PM",
      location: "Tokyo, Japan",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 3,
      title: "Kyoto Temple Walk",
      date: "Sep 25, 2025",
      time: "9:00 AM",
      location: "Kyoto, Japan",
      image: "/placeholder.svg?height=60&width=60",
    },
  ];

  const hostingEvents = [
    {
      id: 4,
      title: "Photography Meetup",
      date: "Sep 18, 2025",
      time: "2:00 PM",
      location: "Tokyo, Japan",
      image: "/placeholder.svg?height=60&width=60",
    },
  ];

  const followingList = following.map(user => ({
    id: user.id,
    name: user.name || 'Unknown User',
    username: `@${user.username}`,
    avatar: user.image || "/placeholder.svg?height=50&width=50",
  }));

  const followersList = followers.map(user => ({
    id: user.id,
    name: user.name || 'Unknown User',
    username: `@${user.username}`,
    avatar: user.image || "/placeholder.svg?height=50&width=50",
  }));

  const mockFollowingList = [
    {
      id: 1,
      name: "Marcus Johnson",
      username: "@marcusj",
      avatar: "/placeholder.svg?height=50&width=50",
    },
    {
      id: 2,
      name: "Emma Rodriguez",
      username: "@emmar",
      avatar: "/placeholder.svg?height=50&width=50",
    },
  ];


  const profilePhotos = [
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
  ];

  const profileQuestions = [
    {
      question: "My travel style",
      answer: "Slow travel with deep cultural immersion",
    },
    {
      question: "Dream destination",
      answer: "Patagonia - for the untouched wilderness",
    },
    {
      question: "Can't travel without",
      answer: "My Fujifilm camera and matcha powder",
    },
    {
      question: "Best travel memory",
      answer: "Sunrise hot air balloon ride over Cappadocia",
    },
  ];

  const interestTags = [
    "Photography",
    "Food",
    "Culture",
    "Architecture",
    "Street Art",
    "Coffee",
    "Hiking",
  ];

  const handleWebsiteClick = () => {
    setShowWebsiteModal(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowWebsiteModal(false);
          window.open(userProfile.website, "_blank", "noopener,noreferrer");
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
        toast.success("Unfollowed user");
      } else {
        newFollowingUsers.add(userId);
        toast.success("Following user");
      }
      setFollowingUsers(newFollowingUsers);
    } else {
      setIsFollowing(!isFollowing);
      toast.success(
        isFollowing
          ? `Unfollowed ${userProfile.name}`
          : `Following ${userProfile.name}`
      );
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/${username.replace("@", "")}`);
  };

  const handleMessage = () => {
    toast.success("Message feature coming soon!");
  };

  const handleZap = () => {
    toast.success("Lightning payment coming soon!");
  };

  const handleProfilePhotoClick = (index: number) => {
    photosLightboxRef.current?.open(index);
  };

  const handleAvatarClick = () => {
    avatarLightboxRef.current?.open();
  };

  const groupEventsByDate = (events: typeof attendingEvents) => {
    const grouped = events.reduce((acc, event) => {
      const date = event.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, typeof events>);

    return Object.entries(grouped).map(([date, events]) => ({
      date,
      events,
      formattedDate: formatDateHeader(date),
    }));
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + ", 2025");
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const monthNames = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();

    return `${dayName}, ${monthName} ${day}`;
  };

  const renderEventsTab = () => {
    const currentEvents =
      eventsFilter === "attending" ? attendingEvents : hostingEvents;
    const groupedEvents = groupEventsByDate(currentEvents);

    return (
      <div className="space-y-4">
        {/* Filter Badges */}
        <div className="flex gap-2">
          <button
            onClick={() => setEventsFilter("attending")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              eventsFilter === "attending"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Attending
          </button>
          <button
            onClick={() => setEventsFilter("hosting")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              eventsFilter === "hosting"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Hosting
          </button>
        </div>

        {/* Events List with Date Dividers */}
        <div className="space-y-6">
          {groupedEvents.map((group, groupIndex) => (
            <div key={group.date}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-gray-500 font-medium text-sm">
                  {group.formattedDate}
                </h2>
              </div>

              <div className="space-y-4">
                {group.events.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors" onClick={() => router.push(`/e/event/cosmoprof-2025`)}>
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg hover:text-red-600 transition-colors">{event.title}</h3>
                      <p className="text-gray-500">{event.location}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-600 text-sm">
                        {event.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {currentEvents.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No {eventsFilter} events yet</p>
          </div>
        )}
      </div>
    );
  };

  const renderAboutTab = () => (
    <div className="space-y-6">
      {/* Bio/Description */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Bio</h4>
        <p className="text-gray-700">{userProfile.bio}</p>
      </div>

      {/* Interest Tags */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Interests</h4>
        <div className="flex flex-wrap gap-2">
          {interestTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Profile Questions */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">About Me</h4>
        <div className="space-y-3">
          {profileQuestions.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {item.question}
              </p>
              <p className="text-sm text-gray-900">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Album */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Photos</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {profilePhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => handleProfilePhotoClick(index)}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={photo || "/placeholder.svg"}
                alt={`Profile photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-xl">
        <div className="text-3xl font-bold text-blue-600">
          {userProfile.stats.countries}
        </div>
        <div className="text-sm text-gray-600">Countries</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-xl">
        <div className="text-3xl font-bold text-green-600">
          {userProfile.stats.mutuals}
        </div>
        <div className="text-sm text-gray-600">Mutuals</div>
      </div>
    </div>
  );

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover Image Section */}
        <div className="relative">
          {/* Back Button - Absolute positioned */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-white/80 backdrop-blur-sm z-10"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {/* Banner */}
          <div className="w-full h-48 md:h-64 bg-gradient-to-br from-red-400 to-red-600" />
          
          {/* Profile Picture - Centered & Clickable */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16">
            <button onClick={handleAvatarClick} className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={userProfile.avatar || ''} 
                  alt="Profile" 
                />
                <AvatarFallback className="text-3xl bg-white">
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
                  className="absolute bottom-0 right-0 hover:scale-105 transition-transform"
                >
                  <BadgeCheck className="w-8 h-8 bg-red-600 text-white rounded-full shadow-sm" />
                </button>
              )}
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white px-6 pt-20 pb-6 mb-4">
          {/* User Info - Centered */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
            <p className="text-gray-600">{userProfile.username}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6 max-w-xs mx-auto">
            <Button
              onClick={() => handleFollowToggle()}
              className={`flex-1 ${
                isFollowing
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Follow
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleMessage}
              className="flex-1 bg-transparent"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-100"
              onClick={handleZap}
            >
              <Zap className="h-5 w-5 text-yellow-500" />
            </Button>
          </div>

          {/* Stats - Centered */}
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {userProfile.stats.events}
                </div>
                <div className="text-sm text-gray-500">Events</div>
              </div>
              <button
                className="text-center"
                onClick={() => setShowFollowingSheet(true)}
              >
                <div className="text-xl font-bold text-gray-900">
                  {userProfile.stats.following}
                </div>
                <div className="text-sm text-gray-500">Following</div>
              </button>
              <button
                className="text-center"
                onClick={() => setShowFollowersSheet(true)}
              >
                <div className="text-xl font-bold text-gray-900">
                  {userProfile.stats.followers}
                </div>
                <div className="text-sm text-gray-500">Followers</div>
              </button>
            </div>
          </div>

          {/* Status/Bio - Centered */}
          {userProfile.status && (
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm font-medium">
                {userProfile.status}
              </p>
            </div>
          )}

          {/* Website - Centered */}
          {userProfile.website && (
            <div className="flex items-center justify-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <button
                onClick={handleWebsiteClick}
                className="text-blue-600 hover:underline text-sm"
              >
                {userProfile.website.replace(/^https?:\/\//, '')}
              </button>
            </div>
          )}
        </div>

        {/* Tabbed Section */}
        <div className="bg-white mb-4">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("about")}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "about"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "events"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Stats
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "about" && renderAboutTab()}
            {activeTab === "events" && renderEventsTab()}
            {activeTab === "stats" && renderStatsTab()}
          </div>
        </div>
      </div>

      {/* Followers Sheet */}
      <FollowersSheet
        isOpen={showFollowersSheet}
        onClose={() => setShowFollowersSheet(false)}
        userId={userData?.id || ""}
        username={userData?.username || "user"}
      />

      {/* Following Sheet */}
      <FollowingSheet
        isOpen={showFollowingSheet}
        onClose={() => setShowFollowingSheet(false)}
        userId={userData?.id || ""}
        username={userData?.username || "user"}
      />

      {/* Website Redirect Modal */}
      {showWebsiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full md:max-w-sm max-w-full text-center">
            <h3 className="text-xl font-bold mb-4">Leaving Evento</h3>
            <p className="text-gray-600 mb-6">
              Are you about to leave Evento and be redirected to sarahchen.com?
            </p>
            <div className="text-6xl font-bold text-red-500 mb-6">
              {countdown}
            </div>
            <Button
              onClick={() => {
                setShowWebsiteModal(false);
                window.open(userProfile.website, "_blank", "noopener,noreferrer");
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Take me to sarahchen.com
            </Button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full md:max-w-sm max-w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="w-8 h-8 bg-red-600 text-white rounded-full shadow-sm" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">This user is verified</h3>
            <p className="text-gray-600 mb-6">
              This user is a premium member with a verified account. Verified users have enhanced credibility and access to exclusive features on our platform.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setShowVerificationModal(false);
                  router.push('/e/contact?title=Account%20Verification%20Inquiry&message=Hi,%20I%20would%20like%20to%20learn%20more%20about%20account%20verification%20and%20how%20I%20can%20become%20a%20verified%20user.%20Please%20provide%20information%20about%20the%20verification%20process%20and%20requirements.');
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                Get in touch about verification
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowVerificationModal(false)}
                className="w-full"
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
