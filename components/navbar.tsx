'use client';

import { Calendar1, Home, Inbox, MessageCircle, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: 'hub', icon: Home, path: '/' },
    { id: 'feed', icon: Calendar1, path: '/e/feed' },
    { id: 'add', icon: Plus, path: '/e/create', isCenter: true },
    { id: 'notifications', icon: Inbox, path: '/e/notifications' },
    { id: 'messages', icon: MessageCircle, path: '/e/messages' },
  ];

  const handleNavigation = (item: any) => {
    if (onTabChange) {
      onTabChange(item.id);
    }
    router.push(item.path);
  };

  return (
    <div className='fixed bottom-0 left-1/2 z-10 w-full max-w-full -translate-x-1/2 transform border-t border-gray-200 bg-white pb-4 md:max-w-sm'>
      <div className='grid grid-cols-5 items-center px-2 py-3'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || activeTab === item.id;

          if (item.isCenter) {
            return (
              <div className='flex justify-center'>
                <div
                  key={item.id}
                  className='m-0 flex h-12 w-16 items-center justify-center rounded-xl bg-gray-200 p-0 transition-colors duration-150 hover:bg-gray-300'
                  onClick={() => handleNavigation(item)}
                >
                  <Icon className='h-6 w-6 text-gray-500' strokeWidth={2.5} />
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`flex justify-center rounded-lg px-1 py-3 transition-colors ${
                isActive ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'text-red-600' : ''}`} strokeWidth={2.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
