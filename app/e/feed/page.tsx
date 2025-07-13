"use client"

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Calendar,
  Search,
  Clock,
  Flag,
  UserMinus,
  Share,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "../../../components/page-header"
import { Navbar } from "../../../components/navbar"
import { ReusableDropdown } from "../../../components/reusable-dropdown"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("feed")
  const [isLoading, setIsLoading] = useState(true)
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set())
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const router = useRouter()

  // Mock saved lists - in real app this would come from API
  const [savedLists] = useState([
    { id: 1, name: "Event toes", isDefault: true },
    { id: 2, name: "Tokyo Adventures", isDefault: false },
    { id: 3, name: "Food Experiences", isDefault: false },
  ])

  useEffect(() => {
    // Simulate loading to prevent white screen
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const feedPosts = [
    {
      id: 1,
      type: "event",
      user: {
        name: "Marcus Johnson",
        username: "@marcusj",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      event: {
        title: "Eiffel Tower Night Photography",
        date: "Sep 20, 2025",
        time: "7:00 PM",
        location: "Paris, France",
        image: "/placeholder.svg?height=300&width=300",
      },
      caption: "First time in Paris and I'm absolutely mesmerized! The Eiffel Tower at night is pure magic ✨",
      likes: 156,
      timeAgo: "4h ago",
    },
    {
      id: 2,
      type: "event",
      user: {
        name: "Sarah Chen",
        username: "@sarahc",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      event: {
        title: "Tokyo Skytree Sunset Experience",
        date: "Sep 15, 2025",
        time: "6:30 PM",
        location: "Tokyo, Japan",
        image: "/placeholder.svg?height=300&width=300",
      },
      caption: "Amazing sunset view from Tokyo Skytree! The city looks incredible from up here 🌅",
      likes: 234,
      timeAgo: "2h ago",
    },
    {
      id: 3,
      type: "event",
      user: {
        name: "Emma Rodriguez",
        username: "@emmar",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      event: {
        title: "Tegallalang Rice Terraces Tour",
        date: "Sep 18, 2025",
        time: "9:00 AM",
        location: "Bali, Indonesia",
        image: "/placeholder.svg?height=300&width=300",
      },
      caption: "The rice terraces in Bali are breathtaking! Nature's artwork at its finest 🌾",
      likes: 189,
      timeAgo: "6h ago",
    },
  ]

  const getDropdownItems = (postId: number, userName: string) => [
    {
      label: "Share Event",
      icon: <Share className="w-4 h-4" />,
      action: () => {
        toast.success("Event shared!")
      },
    },
    {
      label: "Copy Link",
      icon: <Copy className="w-4 h-4" />,
      action: () => {
        navigator.clipboard.writeText(`https://evento.so/event/${postId}`)
        toast.success("Link copied to clipboard!")
      },
    },
    {
      label: `Unfollow ${userName}`,
      icon: <UserMinus className="w-4 h-4" />,
      action: () => {
        toast.success(`Unfollowed ${userName}`)
      },
    },
    {
      label: "Report Post",
      icon: <Flag className="w-4 h-4" />,
      action: () => {
        toast.success("Post reported. Thank you for your feedback.")
      },
      destructive: true,
    },
  ]

  const handleBookmark = (postId: number) => {
    setSelectedPostId(postId)

    // If only one list exists, save automatically
    if (savedLists.length === 1) {
      const newBookmarkedPosts = new Set(bookmarkedPosts)
      if (bookmarkedPosts.has(postId)) {
        newBookmarkedPosts.delete(postId)
        toast.success("Event removed from saved!")
      } else {
        newBookmarkedPosts.add(postId)
        toast.success(`Event saved to "${savedLists[0].name}"!`)
      }
      setBookmarkedPosts(newBookmarkedPosts)
    } else {
      // Show modal to choose list
      setShowSaveModal(true)
    }
  }

  const handleSaveToList = (listId: number, listName: string) => {
    if (selectedPostId) {
      const newBookmarkedPosts = new Set(bookmarkedPosts)
      newBookmarkedPosts.add(selectedPostId)
      setBookmarkedPosts(newBookmarkedPosts)
      toast.success(`Event saved to "${listName}"!`)
    }
    setShowSaveModal(false)
    setSelectedPostId(null)
  }

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto bg-white min-h-screen flex flex-col">
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white z-40 border-b border-gray-100">
          <PageHeader
            title="Feed"
            subtitle="Discover amazing travel events"
            rightContent={
              <>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-100">
                  <Search className="h-5 w-5" />
                </Button>
              </>
            }
          />
        </div>
        <div className="flex-1 flex items-center justify-center pt-[120px] pb-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white z-40 border-b border-gray-100">
        <PageHeader
          title="Feed"
          subtitle="Discover amazing travel events"
          rightContent={
            <>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-100"
                onClick={() => router.push("/e/search")}
              >
                <Search className="h-5 w-5" />
              </Button>
            </>
          }
        />
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pt-[120px] pb-20">
        {feedPosts.map((post) => (
          <div key={post.id} className="mb-6 bg-white">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src={post.user.avatar || "/placeholder.svg"}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{post.user.name}</p>
                  <p className="text-xs text-gray-500">
                    Posted by {post.user.username} {post.timeAgo}
                  </p>
                </div>
              </div>
              <ReusableDropdown
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gray-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
                items={getDropdownItems(post.id, post.user.name)}
                align="right"
                width="w-56"
              />
            </div>

            {/* Event Image - Square aspect ratio */}
            <div className="relative">
              <img
                src={post.event.image || "/placeholder.svg"}
                alt="Event"
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Event Details */}
            <div className="px-4 py-3">
              <h3 className="font-bold text-lg mb-2">{post.event.title}</h3>

              {/* Date, Time, Location */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{post.event.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.event.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                <MapPin className="h-4 w-4" />
                <span>{post.event.location}</span>
              </div>

              {/* Post Actions - All on left side */}
              <div className="flex items-center gap-4 mb-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full bg-gray-100">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full bg-gray-100">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full bg-gray-100">
                  <Send className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 rounded-full bg-gray-100"
                  onClick={() => handleBookmark(post.id)}
                >
                  <Bookmark
                    className={`h-5 w-5 ${bookmarkedPosts.has(post.id) ? "fill-current text-orange-600" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save to List Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Save to List</h3>
            <div className="space-y-2">
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleSaveToList(list.id, list.name)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Bookmark className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-medium">{list.name}</span>
                    {list.isDefault && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <Check className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveModal(false)
                setSelectedPostId(null)
              }}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
