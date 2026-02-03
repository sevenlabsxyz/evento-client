'use client';

import { BadgeItem } from '@/components/badges/badge-item';
import { UserBadge } from '@/lib/types/badges';
import { cn } from '@/lib/utils';
import { ChevronRight, Settings2 } from 'lucide-react';

interface UserBadgesDisplayProps {
  badges: UserBadge[];
  isOwnProfile?: boolean;
  onManageClick?: () => void;
  onBadgeClick?: (badge: UserBadge) => void;
  className?: string;
}

export function UserBadgesDisplay({
  badges,
  isOwnProfile = false,
  onManageClick,
  onBadgeClick,
  className,
}: UserBadgesDisplayProps) {
  // Don't render if no badges
  if (!badges || badges.length === 0) {
    return null;
  }

  // Sort by display_order, filter to only displayed badges (display_order is not null)
  const displayedBadges = badges
    .filter((b) => b.display_order !== null)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  // If no displayed badges, don't render
  if (displayedBadges.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-3xl border border-gray-200 bg-gray-50 p-6', className)}>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-bold text-gray-900'>Badges</h2>
        {isOwnProfile && onManageClick && (
          <button
            onClick={onManageClick}
            className='flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700'
          >
            <Settings2 className='h-4 w-4' />
            <span>Manage</span>
            <ChevronRight className='h-4 w-4' />
          </button>
        )}
      </div>

      {/* Badges Row */}
      <div className='flex flex-wrap gap-4'>
        {displayedBadges.map((userBadge) => (
          <BadgeItem
            key={userBadge.id}
            badge={userBadge.badge}
            earnedAt={userBadge.earned_at}
            size='md'
            showDescription={true}
            onClick={onBadgeClick ? () => onBadgeClick(userBadge) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
