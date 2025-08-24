'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { designTokens } from '@/lib/design-tokens/colors';
import { UserDetails } from '@/lib/types/api';

interface ProfileHeaderProps {
  user: UserDetails;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <>
      {/* Banner */}
      <div className={`absolute left-0 right-0 top-0 h-32 w-full ${designTokens.colors.gradients.primaryBanner}`} />

      <div className='relative h-28'>
        {/* Profile Picture - Centered & Overlapping */}
        <UserAvatar
          user={{
            name: user.name,
            username: user.username,
            image: user.image,
            verification_status: user.verification_status,
          }}
          size='lg'
          className='absolute -bottom-12 left-1/2 -translate-x-1/2 transform'
        />
      </div>
    </>
  );
}