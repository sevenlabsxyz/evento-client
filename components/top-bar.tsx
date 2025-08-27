'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { useSidebar } from '@/lib/stores/sidebar-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function TopBar() {
  const { openSidebar } = useSidebar();
  const {
    leftMode,
    onBackPress,
    centerMode,
    title,
    subtitle,
    buttons,
    showAvatar,
    isOverlaid,
    chatPartner,
  } = useTopBar();
  const { user } = useUserProfile();
  const router = useRouter();
  const [isSpinning, setIsSpinning] = useState(false);

  // Scroll state for overlay mode animations
  const [scrollY, setScrollY] = useState(0);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);

  // Scroll detection for overlay mode
  useEffect(() => {
    if (!isOverlaid) return;

    let lastScrollY = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollingUp = currentScrollY < lastScrollY;

          setScrollY(currentScrollY);
          setIsScrollingUp(scrollingUp);

          // Show navigation when scrolling up from >100px position
          if (scrollingUp && currentScrollY > 50) {
            setShowNavigation(true);
          } else if (!scrollingUp) {
            setShowNavigation(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOverlaid]);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleMenuClick = () => {
    setIsSpinning(true);
    openSidebar();
    setTimeout(() => setIsSpinning(false), 400);
  };

  const renderLeftContent = () => {
    if (leftMode === 'back') {
      return (
        <button
          onClick={handleBackPress}
          className={
            'mt-0.5 flex h-[32px] w-[32px] items-center justify-center border border-transparent'
          }
        >
          <ArrowLeft className='h-6 w-6 text-gray-500' strokeWidth={2.5} />
        </button>
      );
    }

    return (
      <button
        onClick={handleMenuClick}
        className={`rounded-full border border-gray-200 bg-gray-50 p-0 transition-all duration-300 hover:opacity-80 ${
          isOverlaid ? 'border-gray-200 bg-white' : 'hover:bg-gray-100'
        } ${isSpinning ? 'animate-spin' : ''}`}
      >
        <Image priority src='/assets/img/evento-sublogo.svg' alt='Evento' width={32} height={32} />
      </button>
    );
  };

  const renderCenterContent = () => {
    if (centerMode === 'empty') {
      return null;
    }

    if (centerMode === 'chat-partner' && chatPartner) {
      return (
        <div className='flex flex-1 items-center gap-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={chatPartner.image} alt={chatPartner.name} />
            <AvatarFallback className='bg-gray-100 text-sm'>
              {chatPartner.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-col'>
            <h1 className='text-base font-semibold text-gray-900'>{chatPartner.name}</h1>
            {chatPartner.username && (
              <p className='text-sm text-gray-500'>@{chatPartner.username}</p>
            )}
          </div>
        </div>
      );
    }

    if (centerMode === 'title' && !isOverlaid) {
      return (
        <div className='flex flex-1 flex-col gap-1'>
          <h1 className='text-lg font-semibold text-gray-500'>{title}</h1>
          {subtitle && <p className='text-sm text-gray-500'>{subtitle}</p>}
        </div>
      );
    }

    if (centerMode === 'logo' && !isOverlaid) {
      return (
        <Link
          href='https://evento.so'
          className='flex flex-col items-center gap-1'
          title='Evento logo - Visit evento.so'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Image
            priority
            src='/assets/img/evento-logo.svg'
            alt='Evento logo - Visit evento.so'
            width={80}
            height={24}
            className='cursor-pointer transition-opacity hover:opacity-80'
          />
        </Link>
      );
    }

    return null;
  };

  // Calculate styles based on scroll state
  const getTopBarStyles = () => {
    if (!isOverlaid) {
      return 'bg-white';
    }

    // Always transparent when within 100px of top
    if (scrollY <= 100) {
      return 'bg-transparent';
    }

    if (showNavigation) {
      return 'bg-white shadow-sm transform translate-y-0 transition-all duration-300 ease-out';
    }

    return 'bg-transparent';
  };

  const getContentOpacity = () => {
    if (!isOverlaid) return 'opacity-100';

    if (scrollY > 100 && !showNavigation) {
      return 'opacity-0';
    }

    return 'opacity-100';
  };

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-40 mx-auto h-16 w-full max-w-full transition-all duration-300 md:max-w-sm ${getTopBarStyles()}`}
    >
      <div className='px-4 pb-4 pt-4'>
        <div
          className={`relative flex items-center justify-between transition-opacity duration-300 ${getContentOpacity()}`}
        >
          <div className='flex items-center gap-3'>
            {renderLeftContent()}
            {centerMode !== 'logo' && renderCenterContent()}
          </div>

          {/* Absolutely centered logo */}
          <div className='absolute left-1/2 -translate-x-1/2 transform'>
            {centerMode === 'logo' && renderCenterContent()}
          </div>
          <div className='flex items-center gap-3'>
            {buttons.length > 0 && (
              <div className='flex gap-3'>
                {buttons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      onClick={button.onClick}
                      className={`flex flex-row items-center gap-2 transition-all duration-300 hover:opacity-80 ${
                        isOverlaid
                          ? 'flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white'
                          : 'p-0'
                      }`}
                    >
                      <Icon
                        className={`${
                          isOverlaid ? 'h-5 w-5 text-gray-500' : 'h-6 w-6 text-gray-400'
                        }`}
                        strokeWidth={2.5}
                      />
                    </button>
                  );
                })}
              </div>
            )}
            {showAvatar && (
              <button
                onClick={() => router.push('/e/profile')}
                className={`ml-1 rounded-full transition-opacity hover:opacity-80`}
              >
                <Avatar className='h-8 w-8'>
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
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
