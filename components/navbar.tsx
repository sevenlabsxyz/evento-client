'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { motion } from 'framer-motion';
import { Calendar1, MessageCircle, Plus, User, Wallet } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserProfile();

  const navItems = [
    { id: 'hub', icon: Calendar1, path: '/e/hub' },
    { id: 'wallet', icon: Wallet, path: '/e/wallet' },
    // Hiding feed until improvements are made
    // { id: 'feed', icon: Calendar1, path: '/e/feed' },
    { id: 'add', icon: Plus, path: '/e/create', isCenter: true },
    { id: 'messages', icon: MessageCircle, path: '/e/messages' },
    // Temporarily hidden until notifications are fully working
    // { id: 'inbox', icon: Inbox, path: '/e/inbox' },
    { id: 'profile', icon: User, path: '/e/profile' },
  ];

  const handleNavigation = (item: any) => {
    if (onTabChange) {
      onTabChange(item.id);
    }
    router.push(item.path);
  };

  return (
    <div className='fixed bottom-0 left-1/2 z-10 w-full max-w-full -translate-x-1/2 transform border-t border-gray-200 bg-white pb-4 md:max-w-3xl md:border-l md:border-r'>
      <div className='grid grid-cols-5 items-center px-2 py-3'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || activeTab === item.id;

          if (item.isCenter) {
            return (
              <div key={item.id} className='flex justify-center'>
                <motion.div
                  className='m-0 flex h-12 w-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-0 transition-colors duration-150 hover:bg-gray-200'
                  onClick={() => handleNavigation(item)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon className='h-6 w-6 text-gray-500' strokeWidth={2.5} />
                </motion.div>
              </div>
            );
          }

          // Special rendering for profile item - show avatar
          if (item.id === 'profile') {
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex justify-center rounded-lg px-1 py-3 transition-opacity hover:opacity-80`}
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{ display: 'inline-block' }}
                >
                  <Avatar
                    className={`h-8 w-8 ${isActive ? 'ring-2 ring-red-600 ring-offset-2' : ''}`}
                  >
                    <AvatarImage src={user?.image} alt={user?.name || 'Profile'} />
                    <AvatarFallback className='bg-gray-100'>
                      <Image
                        src='/assets/img/evento-sublogo.svg'
                        alt='Evento'
                        width={32}
                        height={32}
                        className='h-full w-full p-1'
                      />
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </button>
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
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ display: 'inline-block' }}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-red-600' : ''}`} strokeWidth={2.5} />
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
