'use client';

import { TopBar } from '@/components/top-bar';
import { useTopBar } from '@/lib/stores/topbar-store';
import { Share } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const { isOverlaid, setTopBar } = useTopBar();
  const pathname = usePathname();

  // Configure TopBar based on route
  useEffect(() => {
    if (pathname.startsWith('/e/') && pathname !== '/e' && !pathname.includes('/profile')) {
      // This is a single event page (e.g., /e/evt_123)
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

      setTopBar({
        leftMode: 'back',
        centerMode: 'empty',
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
      // Reset to default for other routes
      setTopBar({
        leftMode: 'menu',
        centerMode: 'title',
        showAvatar: true,
        buttons: [],
        isOverlaid: false,
      });
    }
  }, [pathname, setTopBar]);

  return (
    <>
      <TopBar />
      <div className={isOverlaid ? '' : 'pt-16'}>{children}</div>
    </>
  );
}
