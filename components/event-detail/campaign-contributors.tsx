'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEventCampaignFeed } from '@/lib/hooks/use-campaign-feed';
import { Zap } from 'lucide-react';

interface CampaignContributorsProps {
  eventId: string;
}

function formatSats(sats: number): string {
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

export function CampaignContributors({ eventId }: CampaignContributorsProps) {
  const { data: feed, isLoading } = useEventCampaignFeed(eventId);

  if (isLoading || !feed || feed.length === 0) return null;

  return (
    <div className='mt-4'>
      <h4 className='mb-3 text-sm font-semibold text-gray-700'>Contributors</h4>
      <ul className='space-y-2'>
        {feed.map((item, idx) => {
          const initials = item.payer_username
            ? item.payer_username.slice(0, 2).toUpperCase()
            : '⚡';

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
                {formatSats(item.amount_sats)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
