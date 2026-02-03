'use client';

interface ProfileStatsProps {
  eventCount: number;
  followingCount: number;
  followersCount: number;
}

export function ProfileStats({ eventCount, followingCount, followersCount }: ProfileStatsProps) {
  return (
    <div className='mb-3 flex justify-center'>
      <div className='grid grid-cols-3 gap-8'>
        <div className='text-center'>
          <div className='text-xl font-bold text-gray-900'>{eventCount}</div>
          <div className='text-sm text-gray-500'>Events</div>
        </div>
        <div className='text-center'>
          <div className='text-xl font-bold text-gray-900'>{followingCount}</div>
          <div className='text-sm text-gray-500'>Following</div>
        </div>
        <div className='text-center'>
          <div className='text-xl font-bold text-gray-900'>{followersCount}</div>
          <div className='text-sm text-gray-500'>Followers</div>
        </div>
      </div>
    </div>
  );
}
