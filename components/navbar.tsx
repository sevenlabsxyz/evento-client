"use client"

import { Calendar, Layers, Plus, Bell, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"

interface NavbarProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { id: "hub", icon: Calendar, path: "/" },
    { id: "feed", icon: Layers, path: "/e/feed" },
    { id: "add", icon: Plus, path: "/e/create", isCenter: true },
    { id: "notifications", icon: Bell, path: "/e/notifications" },
    { id: "messages", icon: MessageCircle, path: "/e/messages" },
  ]

  const handleNavigation = (item: any) => {
    if (onTabChange) {
      onTabChange(item.id)
    }
    router.push(item.path)
  }

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-5 items-center py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || activeTab === item.id

          if (item.isCenter) {
            return (
              <div key={item.id} className="flex justify-center">
                <Button
                  size="icon"
                  className="bg-orange-500 hover:bg-orange-600 rounded-full shadow-lg w-14 h-14"
                  onClick={() => handleNavigation(item)}
                >
                  <Icon className="text-white font-bold stroke-2 w-9 h-9" />
                </Button>
              </div>
            )
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex justify-center py-3 px-1 rounded-lg transition-colors ${
                isActive ? "text-orange-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "text-orange-600" : ""}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
