"use client"

import type { ReactNode } from "react"
import { useState, useRef, useEffect } from "react"

export interface DropdownItem {
  label: string
  value?: string
  icon?: ReactNode
  action: () => void
  destructive?: boolean
}

export interface ReusableDropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  width?: string
}

/**
 * ReusableDropdown
 * ----------------
 * Generic dropdown component used across the app.
 */
export function ReusableDropdown({ trigger, items, align = "right", width = "w-64" }: ReusableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(evt: MouseEvent) {
      if (ref.current && !ref.current.contains(evt.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 ${width} bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                item.action()
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
                item.destructive ? "text-red-500" : "text-gray-900"
              }`}
            >
              <span className="font-medium">{item.label}</span>
              {item.icon && (
                <span
                  className={`w-5 h-5 flex items-center justify-center ${
                    item.destructive ? "text-red-500" : "text-gray-600"
                  }`}
                >
                  {item.icon}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// --- default export for `import X from` style ---
export default ReusableDropdown
