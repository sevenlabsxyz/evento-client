'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Plus, type AppIconComponent } from '@/lib/icons';
import { navigationIcons } from '@/lib/icons/semantic';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

// ── Animation config (identical to AnimatedTabs) ─────────────────────────────

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: '.75rem',
    paddingRight: '.75rem',
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? '.5rem' : 0,
    paddingLeft: isSelected ? '1.25rem' : '.75rem',
    paddingRight: isSelected ? '1.25rem' : '.75rem',
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: 'auto', opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition: Transition = { delay: 0.1, type: 'spring', bounce: 0, duration: 0.6 };

// ── Slide-in/out for the whole bar ───────────────────────────────────────────

const barVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
};

const barTransition: Transition = { type: 'spring', damping: 26, stiffness: 300 };

// ── Tab definitions ──────────────────────────────────────────────────────────

interface NavTab {
  title: string;
  icon: AppIconComponent;
  path: string;
  isCreate?: boolean;
  isProfile?: boolean;
}

const NAV_ITEMS: NavTab[] = [
  { title: 'Events', icon: navigationIcons.events, path: '/e/hub' },
  { title: 'Wallet', icon: navigationIcons.wallet, path: '/e/wallet' },
  { title: 'Create', icon: navigationIcons.create, path: '/e/create', isCreate: true },
  { title: 'Search', icon: navigationIcons.search, path: '/e/search' },
  // icon unused — avatar renders instead
  { title: 'Profile', icon: Plus, path: '/e/profile', isProfile: true },
];

const PATH_TO_INDEX: Record<string, number> = {
  '/e/hub': 0,
  '/e/wallet': 1,
  '/e/create': 2,
  '/e/search': 3,
  '/e/profile': 4,
};

// ── Component ────────────────────────────────────────────────────────────────

interface BottomTabBarProps {
  className?: string;
}

export function BottomTabBar({ className }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserProfile();

  const selected = React.useMemo((): number | null => {
    if (!pathname) return null;
    if (PATH_TO_INDEX[pathname] !== undefined) return PATH_TO_INDEX[pathname];
    if (pathname === '/' || pathname === '/e') return 0;
    for (const [path, index] of Object.entries(PATH_TO_INDEX)) {
      if (pathname.startsWith(path + '/')) return index;
    }
    return null;
  }, [pathname]);

  // Routes where the tab bar slides away
  const hidden = pathname?.startsWith('/e/create') || pathname?.match(/\/manage(?:\/|$)/);

  return (
    <div
      className={cn('fixed bottom-0 left-0 right-0 z-50 flex justify-center md:hidden', className)}
      style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 12px) + 10px)' }}
    >
      <AnimatePresence>
        {!hidden && (
          <motion.div
            key='bottom-tab-bar'
            variants={barVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            transition={barTransition}
            className='mx-3 mb-1 flex w-fit items-center gap-2 rounded-full border border-border/40 bg-foreground p-1.5 shadow-lg'
          >
            {NAV_ITEMS.map((tab, index) => {
              const isSelected = selected === index;

              // Create button — always prominent, no expanding label
              if (tab.isCreate) {
                return (
                  <motion.button
                    key={tab.title}
                    onClick={() => router.push(tab.path)}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className='relative flex items-center justify-center rounded-xl bg-primary-foreground px-5 py-2.5 text-foreground shadow-sm'
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </motion.button>
                );
              }

              // Profile tab — avatar instead of icon
              if (tab.isProfile) {
                return (
                  <motion.button
                    key={tab.title}
                    variants={buttonVariants}
                    initial={false}
                    animate='animate'
                    custom={isSelected}
                    onClick={() => router.push(tab.path)}
                    transition={transition}
                    className={cn(
                      'relative flex items-center rounded-full px-3 py-2 text-base font-medium transition-colors duration-300',
                      isSelected
                        ? 'bg-muted-foreground/20 text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary-foreground/80'
                    )}
                  >
                    <Avatar className='h-7 w-7'>
                      <AvatarImage src={user?.image} alt={user?.name || 'Me'} />
                      <AvatarFallback className='bg-muted'>
                        <Image
                          src='/assets/img/evento-sublogo.svg'
                          alt='Evento'
                          width={24}
                          height={24}
                          className='h-full w-full p-0.5'
                        />
                      </AvatarFallback>
                    </Avatar>
                    <AnimatePresence initial={false}>
                      {isSelected && (
                        <motion.span
                          variants={spanVariants}
                          initial='initial'
                          animate='animate'
                          exit='exit'
                          transition={transition}
                          className='overflow-hidden whitespace-nowrap'
                        >
                          {tab.title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              }

              // Standard nav tab
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.title}
                  variants={buttonVariants}
                  initial={false}
                  animate='animate'
                  custom={isSelected}
                  onClick={() => router.push(tab.path)}
                  transition={transition}
                  className={cn(
                    'relative flex items-center rounded-full py-2.5 text-base font-medium transition-colors duration-300',
                    isSelected
                      ? 'bg-muted-foreground/20 text-primary-foreground'
                      : 'text-muted-foreground hover:text-primary-foreground/80'
                  )}
                >
                  <Icon size={24} />
                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.span
                        variants={spanVariants}
                        initial='initial'
                        animate='animate'
                        exit='exit'
                        transition={transition}
                        className='overflow-hidden whitespace-nowrap'
                      >
                        {tab.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BottomTabBar;
