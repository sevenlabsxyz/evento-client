"use client"

import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "@/lib/stores/sidebar-store"
import { useTopBar } from "@/lib/stores/topbar-store"
import { useUserProfile } from "@/lib/hooks/useUserProfile"
import { usePathname } from "next/navigation"

export function TopBar() {
  const { openSidebar } = useSidebar()
  const { title, subtitle, rightContent, isTransparent } = useTopBar()
  const { user } = useUserProfile()
  const pathname = usePathname()
  
  return (
    <div className={`fixed top-0 left-1/2 transform -translate-x-1/2 w-full md:max-w-sm max-w-full z-40 ${
      isTransparent ? '' : 'bg-white shadow-sm'
    }`}>
      <div className="px-4 pt-6 pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start gap-2 flex-1">
            <button
              onClick={openSidebar}
              className={`rounded-full hover:opacity-80 transition-opacity mt-0.5 ${
                pathname === "/e/profile" ? "ring-2 ring-red-500" : ""
              } ${isTransparent ? 'bg-white/10 backdrop-blur-sm' : ''}`}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={user?.image || ''} 
                  alt={user?.name || 'Profile'} 
                />
                <AvatarFallback className="bg-gray-100 text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 
                   user?.username?.charAt(0).toUpperCase() || 
                   'U'}
                </AvatarFallback>
              </Avatar>
            </button>
            {!isTransparent && (
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-1">{title}</h1>
                <p className="text-gray-500 text-sm">{subtitle}</p>
              </div>
            )}
          </div>
          {rightContent && <div className="flex gap-2 ml-4">{rightContent}</div>}
        </div>
      </div>
    </div>
  )
}