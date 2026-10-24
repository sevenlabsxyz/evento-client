'use client';

import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useEventCampaignFeed } from '@/lib/hooks/use-campaign-feed';
import { useEventCampaign } from '@/lib/hooks/use-event-campaign';
import { getIntlLocale } from '@/lib/i18n/active-locale';
import { Info, Users, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
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
  return sats.toLocaleString(getIntlLocale());
}

type TimeAgo = { key: 'justNow' } | { key: 'minutesAgo' | 'hoursAgo' | 'daysAgo'; count: number };

function timeAgo(dateStr: string): TimeAgo {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return { key: 'justNow' };
  if (mins < 60) return { key: 'minutesAgo', count: mins };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { key: 'hoursAgo', count: hours };
  const days = Math.floor(hours / 24);
  return { key: 'daysAgo', count: days };
}

function TimeAgoText({ date }: { date: string }) {
  const t = useTranslations('eventSocial');
  const ago = timeAgo(date);
  return (
    <p className='text-xs text-gray-400 dark:text-neutral-400'>
      {ago.key === 'justNow'
        ? t('campaignDetail.timeAgo.justNow')
        : t(`campaignDetail.timeAgo.${ago.key}`, { count: ago.count })}
    </p>
  );
}

export function CampaignDetailSheet({ eventId, open, onOpenChange }: CampaignDetailSheetProps) {
  const t = useTranslations('eventSocial');
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
        title={campaign.title || t('campaign.defaultTitle')}
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
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60'>
                  <Zap className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                </div>
              )}
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium text-gray-900 dark:text-neutral-100'>
                  {creatorDetails?.name ||
                    creatorDetails?.username ||
                    t('campaignDetail.organizerFallback')}
                </p>
                {creatorDetails?.username && (
                  <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
                    @{creatorDetails.username}
                  </p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <AnimatedTabs
              tabs={[
                {
                  title: t('campaignDetail.tabs.details'),
                  icon: Info,
                  onClick: () => setActiveTab('details'),
                },
                {
                  title: t('campaignDetail.tabs.contributors'),
                  icon: Users,
                  onClick: () => setActiveTab('contributors'),
                },
              ]}
              selected={['details', 'contributors'].indexOf(activeTab)}
            />
          </div>
        }
        contentClassName='px-4 pb-6 pt-4'
        footer={
          <div className='pb-2'>
            <button
              data-testid='campaign-detail-contribute-btn'
              onClick={() => setPledgeSheetOpen(true)}
              className='flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:active:bg-neutral-300'
            >
              <Zap className='h-4 w-4' />
              {t('campaignDetail.contribute')}
            </button>
          </div>
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
  const t = useTranslations('eventSocial');
  const locale = useLocale();
  return (
    <div className='space-y-5'>
      {/* Stats */}
      <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
        <div className='mb-2 flex items-baseline gap-1'>
          <span className='text-2xl font-bold tabular-nums text-gray-900 dark:text-neutral-100'>
            {formatSatsAbbreviated(campaign.raised_sats)}
          </span>
          <span className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('campaignDetail.satsRaised')}
          </span>
          {hasGoal && (
            <>
              <span className='text-sm text-gray-400 dark:text-neutral-400'>
                {t('campaignDetail.of')}
              </span>
              <span className='text-sm font-medium text-gray-700 dark:text-neutral-300'>
                {t('campaignDetail.goal', {
                  amount: formatSatsAbbreviated(campaign.goal_sats!),
                })}
              </span>
            </>
          )}
        </div>

        {hasGoal && (
          <div className='mb-3'>
            <Progress
              value={Math.min(progressPercent, 100)}
              className='h-2 bg-gray-200 dark:bg-neutral-700 [&>div]:bg-amber-500'
            />
          </div>
        )}

        <p className='text-sm text-gray-500 dark:text-neutral-400'>
          {t('campaignDetail.contributionCount', { count: campaign.pledge_count })}
        </p>
      </div>

      {/* Created date — lower hierarchy */}
      <p className='text-xs italic tracking-wide text-gray-400 dark:text-neutral-400'>
        {t('campaignDetail.created', {
          date: new Date(campaign.created_at).toLocaleDateString(getIntlLocale(locale), {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
        })}
      </p>

      {/* Description */}
      {campaign.description && (
        <p className='text-sm leading-relaxed text-gray-600 dark:text-neutral-400'>
          {campaign.description}
        </p>
      )}
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
  const t = useTranslations('eventSocial');
  if (feed.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 rounded-2xl bg-gray-100 p-4 text-gray-400 dark:bg-neutral-800 dark:text-neutral-500'>
          <Zap className='h-6 w-6' />
        </div>
        <h3 className='mb-1 text-base font-semibold text-gray-900 dark:text-neutral-100'>
          {t('campaignDetail.emptyTitle')}
        </h3>
        <p className='max-w-xs text-sm text-gray-500 dark:text-neutral-400'>
          {t('campaignDetail.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <ul className='-mx-1 space-y-2 overflow-y-auto'>
      {feed.map((item, idx) => (
        <li key={idx} className='flex items-center gap-3 px-1'>
          <UserAvatar
            user={{
              username: item.payer_username || undefined,
              image: item.payer_avatar || undefined,
            }}
            size='sm'
          />

          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium text-gray-900 dark:text-neutral-100'>
              {item.payer_username ? `@${item.payer_username}` : t('campaignDetail.anonymous')}
            </p>
            {item.settled_at && <TimeAgoText date={item.settled_at} />}
          </div>

          <div className='flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400'>
            <Zap className='h-3.5 w-3.5' />
            {formatSatsAbbreviated(item.amount_sats)}
          </div>
        </li>
      ))}
    </ul>
  );
}
