'use client';

import { ArrowLeft, Menu } from '@/lib/icons';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CircledIconButton } from '@/components/circled-icon-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { cn } from '@/lib/utils';

const fadeConfig = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export function SiteHeader() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toggleSidebar } = useSidebar();
  const {
    leftMode,
    onBackPress,
    centerMode,
    title,
    subtitle,
    badge,
    badgePath,
    onBadgeClick,
    textButtons,
    buttons,
    chatPartner,
    hideMobileBreadcrumb,
  } = useTopBar();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const showsMainLogoOnMobileLeft = !isAuthenticated || leftMode === 'logo';

  const renderLeftContent = () => {
    if (showsMainLogoOnMobileLeft) {
      return (
        <Link href='/' className='flex items-center gap-2 md:hidden'>
          <Image
            src='/assets/img/evento-logo.svg'
            alt='Evento'
            width={80}
            height={20}
            className='h-5 w-auto'
          />
        </Link>
      );
    }

    if (leftMode === 'back') {
      return <CircledIconButton icon={ArrowLeft} onClick={handleBackPress} />;
    }

    return (
      <div className='flex items-center gap-2 md:hidden'>
        <CircledIconButton icon={Menu} onClick={toggleSidebar} />
        {!hideMobileBreadcrumb && (
          <Link href='/e/hub' className='flex items-center'>
            <Image
              src='/assets/img/evento-logo.svg'
              alt='Evento'
              width={80}
              height={20}
              className='h-5 w-auto'
            />
          </Link>
        )}
      </div>
    );
  };

  const renderCenterContent = () => {
    if (!isAuthenticated || centerMode === 'empty') {
      return null;
    }

    if (centerMode === 'chat-partner' && chatPartner) {
      return (
        <div className='flex items-center gap-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={chatPartner.image} alt={chatPartner.name} />
            <AvatarFallback className='bg-gray-100 text-sm'>
              {chatPartner.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <h1 className='text-sm font-semibold'>{chatPartner.name}</h1>
            {chatPartner.username && (
              <p className='text-xs text-muted-foreground'>@{chatPartner.username}</p>
            )}
          </div>
        </div>
      );
    }

    if (centerMode === 'title') {
      const combinedTitle = subtitle ? `${title} ${subtitle}` : title;

      return (
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <h1 className='min-w-0 truncate text-base font-medium'>{combinedTitle}</h1>
          {badge && (
            <Badge
              variant='secondary'
              className={`text-xs ${onBadgeClick || badgePath ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={onBadgeClick || (badgePath ? () => router.push(badgePath) : undefined)}
            >
              {badge}
            </Badge>
          )}
        </div>
      );
    }

    return null;
  };

  const showLeftOnDesktop = leftMode === 'back';
  const leftKey = `${leftMode}-${isAuthenticated}`;
  const centerKey = `${centerMode}-${title}-${subtitle}`;
  const rightKey =
    [...textButtons.map((b) => b.id), ...buttons.map((b) => b.id)].join('-') || 'empty';

  return (
    <header className='group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height] flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear'>
      <div className='relative flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        {/* Left section */}
        <AnimatePresence mode='wait'>
          <motion.div key={leftKey} {...fadeConfig}>
            {renderLeftContent()}
          </motion.div>
        </AnimatePresence>

        <Separator
          orientation='vertical'
          className={cn(
            'mx-2 data-[orientation=vertical]:h-4',
            !showLeftOnDesktop && 'md:hidden',
            hideMobileBreadcrumb && 'hidden',
            leftMode === 'back' && 'hidden'
          )}
        />

        {/* Center section */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={centerKey}
            className={cn(
              'min-w-0 flex-1',
              hideMobileBreadcrumb && 'hidden md:flex md:min-w-0 md:flex-1'
            )}
            {...fadeConfig}
          >
            {renderCenterContent()}
          </motion.div>
        </AnimatePresence>

        {/* Centered sublogo on mobile when breadcrumb is hidden */}
        <AnimatePresence>
          {hideMobileBreadcrumb && !showsMainLogoOnMobileLeft && (
            <motion.div
              key='sublogo'
              className='pointer-events-none absolute inset-0 flex items-center justify-center md:hidden'
              {...fadeConfig}
            >
              <Image src='/assets/img/evento-sublogo.svg' alt='Evento' width={28} height={28} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right section */}
        <AnimatePresence mode='wait'>
          <motion.div key={rightKey} className='ml-auto flex items-center gap-2' {...fadeConfig}>
            {textButtons.length > 0 && (
              <div className='flex gap-2'>
                {textButtons.map((button) => {
                  const Icon = button.icon;

                  return (
                    <Button
                      key={button.id}
                      variant={button.variant || 'default'}
                      size='sm'
                      onClick={button.onClick}
                      disabled={button.disabled}
                      className='h-8 rounded-full px-3 text-sm font-medium'
                    >
                      {Icon && <Icon className='mr-1.5 h-4 w-4' />}
                      {button.label}
                    </Button>
                  );
                })}
              </div>
            )}
            {buttons.length > 0 && (
              <div className='flex gap-2'>
                {buttons.map((button) => (
                  <CircledIconButton key={button.id} icon={button.icon} onClick={button.onClick} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </header>
  );
}
