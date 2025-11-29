'use client';

import { TopBar } from '@/components/top-bar';
import { useBetaAccess } from '@/lib/hooks/use-beta-access';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Loader2, Share } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const { setTopBar } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();
  const { hasAccess: hasBetaAccess, isLoading: isBetaLoading } = useBetaAccess();

  // Redirect to beta gate if no beta access
  useEffect(() => {
    if (!isBetaLoading && !hasBetaAccess) {
      router.push('/');
    }
  }, [hasBetaAccess, isBetaLoading, router]);

  // Set TopBar content
  useEffect(() => {
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href,
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    const handleBack = () => {
      router.back();
    };

    // Check if we're on a blog detail page (has slug)
    const isBlogDetailPage = pathname.startsWith('/blog/') && pathname !== '/blog';

    if (isBlogDetailPage) {
      // Blog detail page - show back button
      setTopBar({
        leftMode: 'back',
        onBackPress: handleBack,
        centerMode: 'logo',
        title: '',
        subtitle: '',
        showAvatar: false,
        buttons: [
          {
            id: 'share',
            icon: Share,
            onClick: handleShare,
            label: 'Share',
          },
        ],
        isOverlaid: false,
      });
    } else {
      // Blog listing page - show menu
      setTopBar({
        leftMode: 'menu',
        centerMode: 'title',
        title: 'Blog',
        subtitle: '',
        showAvatar: true,
        buttons: [
          {
            id: 'share',
            icon: Share,
            onClick: handleShare,
            label: 'Share',
          },
        ],
        isOverlaid: false,
      });
    }

    return () => {
      setTopBar({ title: '', subtitle: '', buttons: [] });
    };
  }, [setTopBar, pathname, router]);

  // Show loading while checking beta access
  if (isBetaLoading || !hasBetaAccess) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex-1 overflow-y-auto bg-gray-50 pt-16'>{children}</div>
      </div>
    </>
  );
}
