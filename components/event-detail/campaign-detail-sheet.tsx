'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Progress } from '@/components/ui/progress';
import SegmentedTabs from '@/components/ui/segmented-tabs';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useEventCampaignFeed } from '@/lib/hooks/use-campaign-feed';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { CampaignPledgeSheet } from './campaign-pledge-sheet';

interface CampaignDetailSheetProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Inline creator shape — mirrors the API extension from Task 1/3 (may not be present yet). */
interface CreatorDetails {
  id: string;
  username: string;
  name: string;
  image: string;
  verification_status: string | null;
}

function formatSatsAbbreviated(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(1)}M`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(sats >= 10_000 ? 0 : 1)}k`;
  return sats.toLocaleString();
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CampaignDetailSheet({ eventId, open, onOpenChange }: CampaignDetailSheetProps) {
  const { data: campaign } = useEventCampaign(eventId);
  const { data: feed } = useEventCampaignFeed(eventId);
  const [activeTab, setActiveTab] = useState<'details' | 'contributors'>('details');
  const [pledgeSheetOpen, setPledgeSheetOpen] = useState(false);

  if (!campaign) return null;

  // Safely access creator_details which may not yet exist on the type
  const creatorDetails = (campaign as unknown as Record<string, unknown>).creator_details as
    | CreatorDetails
    | undefined;

  const hasGoal = campaign.goal_sats !== null && campaign.goal_sats > 0;
  const progressPercent = hasGoal ? campaign.progressPercent : 0;

  return (
    <>
      <MasterScrollableSheet
        title={campaign.title || 'Crowdfunding'}
        open={open}
        onOpenChange={onOpenChange}
        headerSecondary={
          <div className='space-y-3 px-4 pb-2'>
            {/* Creator row */}
            <div className='flex items-center gap-3'>
              {creatorDetails ? (
                <UserAvatar
                  user={{
                    name: creatorDetails.name,
                    username: creatorDetails.username,
                    image: creatorDetails.image,
                    verification_status:
                      (creatorDetails.verification_status as 'verified' | null) ?? null,
                  }}
                  size='sm'
                />
              ) : (
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100'>
                  <Zap className='h-4 w-4 text-amber-600' />
                </div>
              )}
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium text-gray-900'>
                  {creatorDetails?.name || creatorDetails?.username || 'Campaign organizer'}
                </p>
                {creatorDetails?.username && (
                  <p className='truncate text-xs text-gray-500'>@{creatorDetails.username}</p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <SegmentedTabs
              items={[
                { value: 'details', label: 'Details' },
                { value: 'contributors', label: 'Contributors' },
              ]}
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'details' | 'contributors')}
              wrapperClassName='px-0 py-0'
            />
          </div>
        }
        contentClassName='px-4 pb-6 pt-4'
        footer={
          <button
            data-testid='campaign-detail-contribute-btn'
            onClick={() => setPledgeSheetOpen(true)}
            className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700'
          >
            <Zap className='h-4 w-4' />
            Contribute
          </button>
        }
      >
        <div data-testid='campaign-detail-sheet'>
          {activeTab === 'details' && (
            <DetailsTabContent
              campaign={campaign}
              hasGoal={hasGoal}
              progressPercent={progressPercent}
            />
          )}
          {activeTab === 'contributors' && <ContributorsTabContent feed={feed ?? []} />}
        </div>
      </MasterScrollableSheet>

      <CampaignPledgeSheet
        eventId={eventId}
        open={pledgeSheetOpen}
        onOpenChange={setPledgeSheetOpen}
      />
    </>
  );
}

/* ---------- Details tab ---------- */

function DetailsTabContent({
  campaign,
  hasGoal,
  progressPercent,
}: {
  campaign: {
    description?: string | null;
    raised_sats: number;
    goal_sats: number | null;
    pledge_count: number;
    status: string;
    created_at: string;
  };
  hasGoal: boolean;
  progressPercent: number;
}) {
  return (
    <div className='space-y-5'>
      {/* Status badge */}
      <div className='flex items-center gap-2'>
        <span className='rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700'>
          {campaign.status === 'active' ? 'Active' : campaign.status}
        </span>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className='text-sm leading-relaxed text-gray-600'>{campaign.description}</p>
      )}

      {/* Stats */}
      <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4'>
        <div className='mb-2 flex items-baseline gap-1'>
          <span className='text-2xl font-bold tabular-nums text-gray-900'>
            {formatSatsAbbreviated(campaign.raised_sats)}
          </span>
          <span className='text-sm text-gray-500'>sats raised</span>
          {hasGoal && (
            <>
              <span className='text-sm text-gray-400'>of</span>
              <span className='text-sm font-medium text-gray-700'>
                {formatSatsAbbreviated(campaign.goal_sats!)} goal
              </span>
            </>
          )}
        </div>

        {hasGoal && (
          <div className='mb-3'>
            <Progress
              value={Math.min(progressPercent, 100)}
              className='h-2 bg-gray-200 [&>div]:bg-amber-500'
            />
          </div>
        )}

        <p className='text-sm text-gray-500'>
          {campaign.pledge_count} {campaign.pledge_count === 1 ? 'contribution' : 'contributions'}
        </p>
      </div>

      {/* Created date */}
      <p className='text-xs text-gray-400'>
        Created{' '}
        {new Date(campaign.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}

/* ---------- Contributors tab ---------- */

function ContributorsTabContent({
  feed,
}: {
  feed: {
    payer_username: string | null;
    payer_avatar: string | null;
    amount_sats: number;
    settled_at: string | null;
  }[];
}) {
  if (feed.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 rounded-2xl bg-gray-100 p-4 text-gray-400'>
          <Zap className='h-6 w-6' />
        </div>
        <h3 className='mb-1 text-base font-semibold text-gray-900'>No contributions yet</h3>
        <p className='max-w-xs text-sm text-gray-500'>
          Be the first to contribute to this campaign.
        </p>
      </div>
    );
  }

  return (
    <ul className='space-y-2'>
      {feed.map((item, idx) => {
        const initials = item.payer_username ? item.payer_username.slice(0, 2).toUpperCase() : '⚡';

        return (
          <li key={idx} className='flex items-center gap-3'>
            <Avatar className='h-8 w-8 shrink-0'>
              {item.payer_avatar && (
                <AvatarImage src={item.payer_avatar} alt={item.payer_username ?? 'anon'} />
              )}
              <AvatarFallback className='bg-amber-100 text-xs text-amber-700'>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium text-gray-900'>
                {item.payer_username ? `@${item.payer_username}` : 'Anonymous'}
              </p>
              {item.settled_at && (
                <p className='text-xs text-gray-400'>{timeAgo(item.settled_at)}</p>
              )}
            </div>

            <div className='flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-amber-600'>
              <Zap className='h-3.5 w-3.5' />
              {formatSatsAbbreviated(item.amount_sats)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
