"use client"

import { Globe, Zap, X, MessageCircle, UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState("events")
  const [eventsFilter, setEventsFilter] = useState("attending")
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showWebsiteModal, setShowWebsiteModal] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followingUsers, setFollowingUsers] = useState(new Set([1, 3, 5]))

  // Mock user data - in real app this would come from API based on params.username
  const userData = {
    name: "Sarah Chen",
    username: "@sarahc",
    avatar: "/placeholder.svg?height=80&width=80",
    bio: "Digital nomad exploring Asia 🌏 Food lover and photography enthusiast. Currently in Tokyo!",
    website: "https://sarahchen.com",
    stats: {
      events: 18,
      following: 156,
      followers: 342,
      countries: 12,
      mutuals: 23,
    },
  }

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
  ]

  const hostingEvents = [
    {
      id: 4,
      title: "Photography Meetup",
      date: "Sep 18, 2025",
      time: "2:00 PM",
      location: "Tokyo, Japan",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  const followingList = [
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
  ]

  const followersList = [
    {
      id: 6,
      name: "David Wilson",
      username: "@davidw",
      avatar: "/placeholder.svg?height=50&width=50",
    },
    {
      id: 7,
      name: "Maria Garcia",
      username: "@mariag",
      avatar: "/placeholder.svg?height=50&width=50",
    },
  ]

  const profilePhotos = [
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
    "/placeholder.svg?height=120&width=120",
  ]

  const profileQuestions = [
    { question: "My travel style", answer: "Slow travel with deep cultural immersion" },
    { question: "Dream destination", answer: "Patagonia - for the untouched wilderness" },
    { question: "Can't travel without", answer: "My Fujifilm camera and matcha powder" },
    { question: "Best travel memory", answer: "Sunrise hot air balloon ride over Cappadocia" },
  ]

  const interestTags = ["Photography", "Food", "Culture", "Architecture", "Street Art", "Coffee", "Hiking"]

  const handleWebsiteClick = () => {
    setShowWebsiteModal(true)
    setCountdown(3)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowWebsiteModal(false)
          window.open(userData.website, "_blank", "noopener,noreferrer")
          return 3
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleFollowToggle = (userId?: number) => {
    if (userId) {
      const newFollowingUsers = new Set(followingUsers)
      if (followingUsers.has(userId)) {
        newFollowingUsers.delete(userId)
        toast.success("Unfollowed user")
      } else {
        newFollowingUsers.add(userId)
        toast.success("Following user")
      }
      setFollowingUsers(newFollowingUsers)
    } else {
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? `Unfollowed ${userData.name}` : `Following ${userData.name}`)
    }
  }

  const handleUserClick = (username: string) => {
    router.push(`/${username.replace("@", "")}`)
  }

  const handleMessage = () => {
    toast.success("Message feature coming soon!")
  }

  const handleZap = () => {
    toast.success("Lightning payment coming soon!")
  }

  const groupEventsByDate = (events: typeof attendingEvents) => {
    const grouped = events.reduce(
      (acc, event) => {
        const date = event.date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(event)
        return acc
      },
      {} as Record<string, typeof events>,
    )

    return Object.entries(grouped).map(([date, events]) => ({
      date,
      events,
      formattedDate: formatDateHeader(date),
    }))
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr + ", 2025")
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
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
    ]

    const dayName = dayNames[date.getDay()]
    const monthName = monthNames[date.getMonth()]
    const day = date.getDate()

    return `${dayName}, ${monthName} ${day}`
  }

  const renderEventsTab = () => {
    const currentEvents = eventsFilter === "attending" ? attendingEvents : hostingEvents
    const groupedEvents = groupEventsByDate(currentEvents)

    return (
      <div className="space-y-4">
        {/* Filter Badges */}
        <div className="flex gap-2">
          <button
            onClick={() => setEventsFilter("attending")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              eventsFilter === "attending" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Attending
          </button>
          <button
            onClick={() => setEventsFilter("hosting")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              eventsFilter === "hosting" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                <h2 className="text-gray-500 font-medium text-sm">{group.formattedDate}</h2>
              </div>

              <div className="space-y-4">
                {group.events.map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <p className="text-gray-500">{event.location}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-600 text-sm">{event.time}</span>
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
    )
  }

  const renderAboutTab = () => (
    <div className="space-y-6">
      {/* Photo Album */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Photos</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {profilePhotos.map((photo, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={photo || "/placeholder.svg"}
                alt={`Profile photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Profile Questions */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">About Me</h4>
        <div className="space-y-3">
          {profileQuestions.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">{item.question}</p>
              <p className="text-sm text-gray-900">{item.answer}</p>
            </div>
          ))}
        </div>
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
    </div>
  )

  const renderStatsTab = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-blue-50 rounded-xl">
        <div className="text-3xl font-bold text-blue-600">{userData.stats.countries}</div>
        <div className="text-sm text-gray-600">Countries</div>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-xl">
        <div className="text-3xl font-bold text-green-600">{userData.stats.mutuals}</div>
        <div className="text-sm text-gray-600">Mutuals</div>
      </div>
    </div>
  )

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="bg-white p-6 mb-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-gray-100"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <img
              src={userData.avatar || "/placeholder.svg"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{userData.name}</h2>
              <p className="text-gray-600 text-sm">{userData.username}</p>
            </div>
          </div>

          {/* Stats above description */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{userData.stats.events}</div>
              <div className="text-sm text-gray-500">Events</div>
            </div>
            <button className="text-center" onClick={() => setShowFollowingModal(true)}>
              <div className="text-xl font-bold text-gray-900">{userData.stats.following}</div>
              <div className="text-sm text-gray-500">Following</div>
            </button>
            <button className="text-center" onClick={() => setShowFollowersModal(true)}>
              <div className="text-xl font-bold text-gray-900">{userData.stats.followers}</div>
              <div className="text-sm text-gray-500">Followers</div>
            </button>
          </div>

          <p className="text-gray-700 mb-4">{userData.bio}</p>

          {/* Website */}
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-gray-500" />
            <button onClick={handleWebsiteClick} className="text-blue-600 hover:underline text-sm">
              sarahchen.com
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleFollowToggle()}
              className={`flex-1 ${
                isFollowing
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
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
            <Button variant="outline" onClick={handleMessage} className="flex-1 bg-transparent">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-100" onClick={handleZap}>
              <Zap className="h-5 w-5 text-yellow-500" />
            </Button>
          </div>
        </div>

        {/* Tabbed Section */}
        <div className="bg-white mb-4">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "events"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "about"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Stats
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "events" && renderEventsTab()}
            {activeTab === "about" && renderAboutTab()}
            {activeTab === "stats" && renderStatsTab()}
          </div>
        </div>
      </div>

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Following</h3>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100"
                onClick={() => setShowFollowingModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {followingList.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2">
                    <button
                      onClick={() => handleUserClick(user.username)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.username}</p>
                      </div>
                    </button>
                    <Button
                      variant={followingUsers.has(user.id) ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollowToggle(user.id)}
                      className={
                        followingUsers.has(user.id) ? "bg-transparent" : "bg-orange-500 hover:bg-orange-600 text-white"
                      }
                    >
                      {followingUsers.has(user.id) ? "Following" : "Follow"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Followers</h3>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100"
                onClick={() => setShowFollowersModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {followersList.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2">
                    <button
                      onClick={() => handleUserClick(user.username)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.username}</p>
                      </div>
                    </button>
                    <Button
                      variant={followingUsers.has(user.id) ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollowToggle(user.id)}
                      className={
                        followingUsers.has(user.id) ? "bg-transparent" : "bg-orange-500 hover:bg-orange-600 text-white"
                      }
                    >
                      {followingUsers.has(user.id) ? "Following" : "Follow"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Website Redirect Modal */}
      {showWebsiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold mb-4">Leaving Evento</h3>
            <p className="text-gray-600 mb-6">Are you about to leave Evento and be redirected to sarahchen.com?</p>
            <div className="text-6xl font-bold text-orange-500 mb-6">{countdown}</div>
            <Button
              onClick={() => {
                setShowWebsiteModal(false)
                window.open(userData.website, "_blank", "noopener,noreferrer")
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Take me to sarahchen.com
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
