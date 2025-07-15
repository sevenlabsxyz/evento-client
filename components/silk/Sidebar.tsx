'use client'

import React from 'react'
import { useSidebar } from '@/lib/stores/sidebar-store'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar()
  const router = useRouter()
  const { logout } = useAuth()
  const { user } = useUserProfile()
  
  const handleClose = () => {
    closeSidebar()
  }

  const handleNavigation = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, '_blank')
    } else {
      router.push(path)
    }
    handleClose()
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }

  // Menu sections
  const menuSections = [
    {
      title: 'Menu',
      items: [
        {
          name: 'Hub',
          path: '/',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          ),
        },
        {
          name: 'Chat',
          path: '/e/messages',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
            </svg>
          ),
        },
        {
          name: 'Activity',
          path: '/e/notifications',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Events',
      items: [
        {
          name: 'Create Event',
          path: '/e/create',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          ),
        },
        {
          name: 'Saved Events',
          path: '/e/saved',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="5" x="2" y="3" rx="1" />
              <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
              <path d="M10 12h4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          name: 'Settings',
          path: '/e/settings',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="15" r="3" />
              <circle cx="9" cy="7" r="4" />
              <path d="M10 15H6a4 4 0 0 0-4 4v2" />
              <path d="m21.7 16.4-.9-.3" />
              <path d="m15.2 13.9-.9-.3" />
              <path d="m16.6 18.7.3-.9" />
              <path d="m19.1 12.2.3-.9" />
              <path d="m19.6 18.7-.4-1" />
              <path d="m16.8 12.3-.4-1" />
              <path d="m14.3 16.6 1-.4" />
              <path d="m20.7 13.8 1-.4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          name: 'Help Center',
          path: '/e/help',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          ),
        },
        {
          name: 'Contact Support',
          path: '/e/contact',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Evento',
      items: [
        {
          name: 'Blog',
          path: '/blog',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20" />
              <path d="M8 11h8" />
              <path d="M8 7h6" />
            </svg>
          ),
        },
        {
          name: 'Store',
          path: 'https://store.evento.so',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          ),
          isExternal: true,
        },
      ],
    },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity"
          onClick={handleClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full z-50 transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          width: 'min(90vw, 325px)',
          backgroundColor: '#0f0f0f',
          boxShadow: isOpen ? '2px 0 12px rgba(0, 0, 0, 0.2)' : 'none',
          transition: 'transform 300ms, box-shadow 300ms'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with user info */}
          <div 
            style={{ 
              backgroundColor: '#1a1a1a',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)'
            }}
          >
            <div className="grid grid-cols-[50px_1fr] gap-x-3 gap-y-0.5">
              {/* User avatar */}
              <Avatar className="row-span-2 w-[50px] h-[50px] border border-white/10">
                <AvatarImage 
                  src={user?.image || ''} 
                  alt={user?.name || user?.username || 'User'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-cyan-400 via-cyan-300 to-cyan-400 text-black font-semibold">
                  {user?.name
                    ? user.name.charAt(0).toUpperCase()
                    : user?.username
                    ? user.username.charAt(0).toUpperCase()
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-xl font-bold text-white">
                {user?.name || 'Evento'}
              </div>
              <div className="text-sm text-gray-400">
                {user?.username ? `@${user.username}` : 'Welcome to Evento'}
              </div>
            </div>
          </div>

          {/* Scrollable menu sections */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '1.5rem', backgroundColor: '#0f0f0f' }}>
            <div className="grid gap-10">
              {menuSections.map((section) => (
                <div key={section.title} className="grid gap-6">
                  <h3 
                    className="m-0 text-sm font-semibold uppercase"
                    style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {section.title}
                  </h3>
                  <ul className="m-0 p-0 grid gap-5 list-none">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <button
                          onClick={() => handleNavigation(item.path, (item as any).isExternal)}
                          className="w-full grid grid-cols-[auto_1fr] items-center gap-3 text-left transition-colors hover:bg-white/10 rounded-lg px-3 py-2 -mx-3"
                          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                        >
                          <span className="text-[0]">{item.icon}</span>
                          <span className="text-lg font-medium">{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {/* Logout button */}
              <div className="pt-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <button
                  onClick={handleLogout}
                  className="w-full grid grid-cols-[auto_1fr] items-center gap-3 text-left transition-colors hover:bg-red-500/20 rounded-lg px-3 py-2 -mx-3"
                  style={{ color: '#ef4444' }}
                >
                  <span className="text-[0]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                  </span>
                  <span className="text-lg font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}