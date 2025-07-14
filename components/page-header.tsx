"use client"

import type React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/lib/stores/sidebar-store"

interface PageHeaderProps {
  title: string
  subtitle: string
  rightContent?: React.ReactNode
  showMenu?: boolean
}

export function PageHeader({ title, subtitle, rightContent, showMenu = false }: PageHeaderProps) {
  const { openSidebar } = useSidebar()
  
  return (
    <div className="px-4 pt-6 pb-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2 flex-1">
          {showMenu && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-100 h-10 w-10 mt-0.5"
              onClick={openSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black mb-1">{title}</h1>
            <p className="text-gray-500 text-sm">{subtitle}</p>
          </div>
        </div>
        {rightContent && <div className="flex gap-2 ml-4">{rightContent}</div>}
      </div>
    </div>
  )
}
