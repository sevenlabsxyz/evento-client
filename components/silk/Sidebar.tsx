'use client'

import React from 'react'
import { useSidebar } from '@/lib/stores/sidebar-store'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUserProfile } from '@/lib/hooks/useUserProfile'

export function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar()
  const router = useRouter()
  const { logout } = useAuth()
  const { user } = useUserProfile()
  
  const handleClose = () => {
    closeSidebar()
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    handleClose()
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }

  // Menu sections matching the example
  const menuSections = [
    {
      title: 'Dashboard',
      items: [
        {
          name: 'Overview',
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
          name: 'Analytics',
          path: '/e/stats',
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
              <path d="M12 16v5" />
              <path d="M16 14v7" />
              <path d="M20 10v11" />
              <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
              <path d="M4 18v3" />
              <path d="M8 14v7" />
            </svg>
          ),
        },
        {
          name: 'Recent Activity',
          path: '/e/feed',
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
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Events',
      items: [
        {
          name: 'All Events',
          path: '/e/search',
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
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          ),
        },
        {
          name: 'My Events',
          path: '/e/me',
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
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
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
        {
          name: 'Create New Event',
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
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          name: 'Messages',
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
          name: 'Notifications',
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
      title: 'Settings',
      items: [
        {
          name: 'Account Settings',
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
        {
          name: 'Profile Settings',
          path: '/e/me',
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
              <path d="M18 20a6 6 0 0 0-12 0" />
              <circle cx="12" cy="10" r="4" />
              <circle cx="12" cy="12" r="10" />
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
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={handleClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white z-50 transform transition-transform shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 'min(90vw, 325px)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header with user info */}
          <div 
            className="border-t border-b" 
            style={{ 
              backgroundColor: 'rgb(245, 245, 245)',
              borderColor: 'rgb(212, 212, 212)',
              padding: '1.5rem',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)'
            }}
          >
            <div className="grid grid-cols-[50px_1fr] gap-x-3 gap-y-0.5">
              {/* User avatar or illustration */}
              <div 
                className="row-span-2 w-[50px] h-[50px] rounded-xl border"
                style={{
                  backgroundImage: `conic-gradient(
                    from -140deg at 100% 100%,
                    rgba(36, 239, 215, 1),
                    rgba(179, 250, 241, 1) 120deg,
                    rgba(36, 239, 215, 1)
                  )`,
                  borderColor: 'rgba(0, 0, 0, 0.05)'
                }}
              />
              <div className="text-xl font-bold" style={{ color: 'rgb(31, 41, 55)' }}>
                {user?.name || 'Evento'}
              </div>
              <div className="text-sm" style={{ color: 'rgb(107, 114, 128)' }}>
                {user?.email || 'Welcome to Evento'}
              </div>
            </div>
          </div>

          {/* Scrollable menu sections */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '1.5rem' }}>
            <div className="grid gap-10">
              {menuSections.map((section) => (
                <div key={section.title} className="grid gap-6">
                  <h3 
                    className="m-0 text-sm font-semibold uppercase"
                    style={{ color: 'rgb(156, 163, 175)' }}
                  >
                    {section.title}
                  </h3>
                  <ul className="m-0 p-0 grid gap-5 list-none">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <button
                          onClick={() => handleNavigation(item.path)}
                          className="w-full grid grid-cols-[auto_1fr] items-center gap-3 text-left transition-colors hover:opacity-70"
                          style={{ color: 'rgb(55, 65, 81)' }}
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
              <div className="pt-6 border-t" style={{ borderColor: 'rgb(229, 231, 235)' }}>
                <button
                  onClick={handleLogout}
                  className="w-full grid grid-cols-[auto_1fr] items-center gap-3 text-left transition-colors hover:opacity-70"
                  style={{ color: 'rgb(239, 68, 68)' }}
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