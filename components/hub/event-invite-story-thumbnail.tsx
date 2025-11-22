import { EventInvite } from '@/lib/types/api';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import Image from 'next/image';
import { UserAvatar } from '../ui/user-avatar';

interface EventInviteStoryThumbnailProps {
  invite: EventInvite;
  onClick: () => void;
}

export function EventInviteStoryThumbnail({ invite, onClick }: EventInviteStoryThumbnailProps) {
  const event = transformApiEventToDisplay(invite.events, [], []);
  const inviter = event.hosts[0];

  return (
    <div className='relative h-[100px] w-[100px] flex-shrink-0'>
      <button
        onClick={onClick}
        className='no-scrollbar relative h-full w-full overflow-hidden rounded-2xl border'
      >
        {/* Event Cover Image */}
        {event.coverImages.length > 0 ? (
          <Image src={event.coverImages[0]} alt={event.title} fill className='object-cover' />
        ) : (
          <div className='h-full w-full bg-gradient-to-br from-red-400 to-red-600' />
        )}
      </button>

      {/* Inviter Avatar - positioned at bottom-right, overlapping and bleeding outside */}
      <div className='pointer-events-none absolute -bottom-2 -right-2'>
        <UserAvatar
          user={{
            name: inviter.name,
            username: inviter.username,
            image: inviter.avatar,
          }}
          size='sm'
          className='shadow-none'
        />
      </div>
    </div>
  );
}
