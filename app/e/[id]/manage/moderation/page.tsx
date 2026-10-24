'use client';

import {
  CommentsModeration,
  countComments,
} from '@/components/manage-dashboard/moderation/comments-moderation';
import { PhotosModeration } from '@/components/manage-dashboard/moderation/photos-moderation';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useEventComments } from '@/lib/hooks/use-event-comments';
import { useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useTopBar } from '@/lib/stores/topbar-store';
import { ImageIcon, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type ModerationTab = 'comments' | 'photos';

const TABS: ModerationTab[] = ['comments', 'photos'];

export default function EventModerationPage() {
  const t = useTranslations('manage');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const [activeTab, setActiveTab] = useState<ModerationTab>('comments');

  // Same query keys as the tab components, so these only read the shared cache for counts.
  const { data: comments, isLoading: commentsLoading } = useEventComments(eventId);
  const { data: photos, isLoading: photosLoading } = useEventGallery(eventId);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('moderationPage.title'),
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
      textButtons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, router, pathname, setTopBarForRoute, applyRouteConfig, clearRoute, t]);

  const commentCount = commentsLoading ? null : countComments(comments ?? []);
  const photoCount = photosLoading ? null : (photos?.length ?? 0);
  const formatTabTitle = (label: string, count: number | null) =>
    count === null ? label : t('moderationPage.tabWithCount', { label, count });

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
          {t('moderationPage.title')}
        </h2>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>
          {t('moderationPage.description')}
        </p>
      </div>

      <div className='flex'>
        <AnimatedTabs
          expanded
          tabs={[
            {
              title: formatTabTitle(t('moderationPage.comments'), commentCount),
              icon: MessageCircle,
              onClick: () => setActiveTab('comments'),
            },
            {
              title: formatTabTitle(t('moderationPage.photos'), photoCount),
              icon: ImageIcon,
              onClick: () => setActiveTab('photos'),
            },
          ]}
          selected={TABS.indexOf(activeTab)}
        />
      </div>

      {activeTab === 'comments' ? (
        <CommentsModeration eventId={eventId} />
      ) : (
        <PhotosModeration eventId={eventId} />
      )}
    </div>
  );
}
