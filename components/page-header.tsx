"use client"

import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  rightContent?: ReactNode
}

/**
 * PageHeader
 * ----------
 * Re-usable header bar for pages inside the app.
 */
export function PageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <div className="px-4 pt-6 pb-0 border-b border-gray-100">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-black truncate">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-0.5 truncate">{subtitle}</p>}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    </div>
  )
}

// --- provide a default export to satisfy any `import X from` usage ---
export default PageHeader
