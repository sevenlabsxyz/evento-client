'use client';

import { Progress } from '@/components/ui/progress';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
import { cn } from '@/lib/utils';
import { ChevronRight, Zap } from 'lucide-react';
import { useState } from 'react';
import { CampaignDetailSheet } from './campaign-detail-sheet';

interface EventCampaignCardProps {
  eventId: string;
  className?: string;
}

function formatSats(sats: number): string {
  if (sats >= 1_000_000) {
    return `${(sats / 1_000_000).toFixed(1)}M`;
  }
  if (sats >= 1_000) {
    return `${(sats / 1_000).toFixed(sats >= 10_000 ? 0 : 1)}k`;
  }
  return sats.toLocaleString();
}

export default function EventCampaignCard({ eventId, className }: EventCampaignCardProps) {
  const { data: campaign, isLoading } = useEventCampaign(eventId);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Only render when campaign exists and is active
  if (isLoading || !campaign || campaign.status !== 'active') {
    return null;
  }

  const hasGoal = campaign.goal_sats !== null && campaign.goal_sats > 0;
  const progressPercent = hasGoal ? campaign.progressPercent : 0;

  return (
    <div className={cn('', className)}>
      <button
        data-testid='event-campaign-card'
        onClick={() => setDetailSheetOpen(true)}
        className='flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100'
      >
        <div className='flex items-center gap-3'>
          {/* Zap icon in amber circle */}
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100'>
            <Zap className='h-5 w-5 text-amber-600' />
          </div>
          {/* Text block */}
          <div className='min-w-0 flex-1 text-left'>
            <p className='truncate font-medium text-gray-900'>{campaign.title || 'Crowdfunding'}</p>
            <div className='mt-1 flex items-center gap-2'>
              {/* Thin progress bar */}
              {hasGoal && (
                <Progress
                  value={Math.min(progressPercent, 100)}
                  className='h-1 flex-1 bg-gray-200 [&>div]:bg-amber-500'
                />
              )}
              <span className='shrink-0 text-xs text-gray-500'>
                {formatSats(campaign.raised_sats)} raised
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className='h-5 w-5 shrink-0 text-gray-400' />
      </button>

      <CampaignDetailSheet
        eventId={eventId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}
