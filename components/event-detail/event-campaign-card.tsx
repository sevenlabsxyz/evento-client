'use client';

import { Progress } from '@/components/ui/progress';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { ChevronRight, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CampaignDetailSheet } from './campaign-detail-sheet';
import { EventSection } from './event-section';

interface EventCampaignCardProps {
  eventId: string;
  hasCampaign?: boolean;
  className?: string;
}

function formatSats(sats: number): string {
  if (sats >= 1_000_000) {
    return `${(sats / 1_000_000).toFixed(1)}M`;
  }
  if (sats >= 1_000) {
    return `${(sats / 1_000).toFixed(sats >= 10_000 ? 0 : 1)}k`;
  }
  return sats.toLocaleString(getIntlLocale());
}

export default function EventCampaignCard({
  eventId,
  hasCampaign,
  className,
}: EventCampaignCardProps) {
  const t = useTranslations('eventSocial');
  const campaignQueryEnabled = hasCampaign !== false;
  const { data: campaign, isLoading } = useEventCampaign(eventId, {
    enabled: campaignQueryEnabled,
  });
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  if (!campaignQueryEnabled) {
    return null;
  }

  // Only render when campaign exists and is active
  if (isLoading || !campaign || campaign.status !== 'active') {
    return null;
  }

  const hasGoal = campaign.goal_sats !== null && campaign.goal_sats > 0;
  const progressPercent = hasGoal ? campaign.progressPercent : 0;

  return (
    <EventSection title={t('campaignCard.title')} variant='plain' className={className}>
      <button
        type='button'
        data-testid='event-campaign-card'
        onClick={() => setDetailSheetOpen(true)}
        className='flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
      >
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          {/* Zap icon in amber circle */}
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60'>
            <Zap className='h-5 w-5 text-amber-600 dark:text-amber-400' />
          </div>
          {/* Text block */}
          <div className='min-w-0 flex-1 text-left'>
            <p className='truncate text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {campaign.title || t('campaign.defaultTitle')}
            </p>
            <div className='mt-1 flex items-center gap-2'>
              {/* Thin progress bar */}
              {hasGoal && (
                <Progress
                  value={Math.min(progressPercent, 100)}
                  className='h-1 flex-1 bg-gray-200 dark:bg-neutral-700 [&>div]:bg-amber-500'
                />
              )}
              <span className='shrink-0 text-xs text-gray-500 dark:text-neutral-500'>
                {t('campaignCard.raised', { amount: formatSats(campaign.raised_sats) })}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className='h-5 w-5 shrink-0 text-gray-400 dark:text-neutral-500' />
      </button>

      <CampaignDetailSheet
        eventId={eventId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </EventSection>
  );
}
