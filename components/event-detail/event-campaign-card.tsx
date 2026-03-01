'use client';

import { Progress } from '@/components/ui/progress';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { CampaignContributors } from './campaign-contributors';
import { CampaignPledgeSheet } from './campaign-pledge-sheet';

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
  const [pledgeSheetOpen, setPledgeSheetOpen] = useState(false);

  // Only render when campaign exists and is active
  if (isLoading || !campaign || campaign.status !== 'active') {
    return null;
  }

  const hasGoal = campaign.goal_sats !== null && campaign.goal_sats > 0;
  const progressPercent = hasGoal ? campaign.progressPercent : 0;

  return (
    <>
      <div data-testid='event-campaign-card' className={cn('', className)}>
        <div className='mb-3 flex items-center gap-2'>
          <Zap className='h-4 w-4 text-amber-500' />
          <span className='text-lg font-semibold text-gray-900'>
            {campaign.title || 'Crowdfunding'}
          </span>
          <span
            data-testid='event-campaign-status'
            className='ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
          >
            Active
          </span>
        </div>

        {campaign.description && (
          <p className='mb-3 text-sm leading-relaxed text-gray-600'>{campaign.description}</p>
        )}

        {/* Raised / Goal stats */}
        <div className='mb-2 flex items-baseline gap-1'>
          <span className='text-2xl font-bold tabular-nums text-gray-900'>
            {formatSats(campaign.raised_sats)}
          </span>
          <span className='text-sm text-gray-500'>sats raised</span>
          {hasGoal && (
            <>
              <span className='text-sm text-gray-400'>of</span>
              <span className='text-sm font-medium text-gray-700'>
                {formatSats(campaign.goal_sats!)} goal
              </span>
            </>
          )}
        </div>

        {/* Progress bar — only when goal_sats is set */}
        {hasGoal && (
          <div className='mb-3'>
            <Progress
              value={Math.min(progressPercent, 100)}
              className='h-2 bg-gray-100 [&>div]:bg-amber-500'
            />
          </div>
        )}

        {/* Pledge count */}
        <p className='mb-4 text-sm text-gray-500'>
          {campaign.pledge_count} {campaign.pledge_count === 1 ? 'contribution' : 'contributions'}
        </p>

        <CampaignContributors eventId={eventId} />

        {/* CTA */}
        <button
          data-testid='event-campaign-pledge-cta'
          onClick={() => setPledgeSheetOpen(true)}
          className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700'
        >
          <Zap className='h-4 w-4' />
          Contribute sats
        </button>
      </div>

      <CampaignPledgeSheet
        eventId={eventId}
        open={pledgeSheetOpen}
        onOpenChange={setPledgeSheetOpen}
      />
    </>
  );
}
