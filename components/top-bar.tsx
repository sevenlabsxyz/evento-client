'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useSidebar } from '@/lib/stores/sidebar-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { usePathname } from 'next/navigation';

export function TopBar() {
  const { openSidebar } = useSidebar();
  const { title, subtitle, rightContent, isTransparent } = useTopBar();
  const { user } = useUserProfile();
  const pathname = usePathname();

  return (
    <div
      className={`fixed left-1/2 top-0 z-40 w-full max-w-full -translate-x-1/2 transform md:max-w-sm ${
        isTransparent ? '' : 'bg-white shadow-sm'
      }`}
    >
      <div className='px-4 pb-4 pt-6'>
        <div className='mb-2 flex items-start justify-between'>
          <div className='flex flex-1 items-start gap-2'>
            <button
              onClick={openSidebar}
              className={`mt-0.5 rounded-full transition-opacity hover:opacity-80 ${
                pathname === '/e/profile' ? 'ring-2 ring-red-500' : ''
              } ${isTransparent ? 'bg-white/10 backdrop-blur-sm' : ''}`}
            >
              <Avatar className='h-10 w-10'>
                <AvatarImage src={user?.image || ''} alt={user?.name || 'Profile'} />
                <AvatarFallback className='bg-gray-100 text-sm'>
                  {user?.name?.charAt(0).toUpperCase() ||
                    user?.username?.charAt(0).toUpperCase() ||
                    'U'}
                </AvatarFallback>
              </Avatar>
            </button>
            {!isTransparent && (
              <div className='flex-1'>
                <h1 className='mb-1 text-3xl font-bold text-black'>{title}</h1>
                <p className='text-sm text-gray-500'>{subtitle}</p>
              </div>
            )}
          </div>
          {rightContent && <div className='ml-4 flex gap-2'>{rightContent}</div>}
        </div>
      </div>
    </div>
  );
}
