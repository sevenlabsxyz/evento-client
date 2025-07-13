"use client"

import type React from "react"

interface PageHeaderProps {
  title: string
  subtitle: string
  rightContent?: React.ReactNode
}

export function PageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <div className="px-4 pt-6 pb-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-black mb-1">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        {rightContent && <div className="flex gap-2 ml-4">{rightContent}</div>}
      </div>
    </div>
  )
}
