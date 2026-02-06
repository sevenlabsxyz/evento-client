'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CircledIconButton } from '@/components/circled-icon-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';

export function SiteHeader() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    leftMode,
    onBackPress,
    centerMode,
    title,
    subtitle,
    badge,
    badgePath,
    onBadgeClick,
    buttons,
    chatPartner,
  } = useTopBar();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const renderLeftContent = () => {
    if (leftMode === 'back') {
      return (
        <Button variant='ghost' size='icon' onClick={handleBackPress} className='h-8 w-8'>
          <ArrowLeft className='h-4 w-4' />
          <span className='sr-only'>Go back</span>
        </Button>
      );
    }

    if (!isAuthenticated) {
      return (
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src='/assets/img/evento-logo.svg'
            alt='Evento'
            width={100}
            height={24}
            className='h-6 w-auto'
          />
        </Link>
      );
    }

    return <SidebarTrigger className='-ml-1' />;
  };

  const renderCenterContent = () => {
    if (centerMode === 'empty') {
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
      return (
        <div className='flex items-center gap-2'>
          <h1 className='text-base font-medium'>{title}</h1>
          {badge && (
            <Badge
              variant='secondary'
              className={`text-xs ${onBadgeClick || badgePath ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={onBadgeClick || (badgePath ? () => router.push(badgePath) : undefined)}
            >
              {badge}
            </Badge>
          )}
          {subtitle && <span className='text-sm text-muted-foreground'>{subtitle}</span>}
        </div>
      );
    }

    return null;
  };

  return (
    <header className='group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height] flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        {renderLeftContent()}
        <Separator orientation='vertical' className='mx-2 data-[orientation=vertical]:h-4' />
        {renderCenterContent()}
        <div className='ml-auto flex items-center gap-2'>
          {buttons.length > 0 && (
            <div className='flex gap-2'>
              {buttons.map((button) => (
                <CircledIconButton key={button.id} icon={button.icon} onClick={button.onClick} />
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
