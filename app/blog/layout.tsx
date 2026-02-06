'use client';

import { TopBar } from '@/components/top-bar';
import { useTopBar } from '@/lib/stores/topbar-store';
import { logger } from '@/lib/utils/logger';
import { Share } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const { setTopBar } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: window.location.href,
          });
        } catch (error) {
          logger.error('Error sharing', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    };

    const handleBack = () => {
      router.back();
    };

    const isBlogDetailPage = pathname.startsWith('/blog/') && pathname !== '/blog';

    if (isBlogDetailPage) {
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

  return (
    <>
      <TopBar />
      <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex-1 overflow-y-auto bg-gray-50 pt-16'>{children}</div>
      </div>
    </>
  );
}
