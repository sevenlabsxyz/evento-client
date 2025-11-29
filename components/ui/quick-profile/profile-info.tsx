'use client';

import SocialLinks from '@/components/profile/social-links';
import { UserDetails } from '@/lib/types/api';
import { sanitizeUserBio } from '@/lib/utils/content';

interface ProfileInfoProps {
  user: UserDetails;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const sanitizedBio = user.bio ? sanitizeUserBio(user.bio) : null;

  return (
    <>
      {/* User Info - Centered */}
      <div className='mb-3 text-center'>
        <h2 className='text-2xl font-bold text-gray-900'>{user.name || 'Unknown User'}</h2>
        <p className='text-gray-600'>@{user.username}</p>
      </div>

      {/* Social Links */}
      {(user.bio_link || user.instagram_handle || user.x_handle || user.nip05) && (
        <div className='mb-3'>
          <SocialLinks
            user={{
              bio_link: user.bio_link,
              instagram_handle: user.instagram_handle,
              x_handle: user.x_handle,
              nip05: user.nip05,
            }}
          />
        </div>
      )}

      {/* Bio */}
      {sanitizedBio ? (
        <div className='mb-3 rounded-xl bg-gray-50 p-4'>
          <h4 className='mb-2 text-sm font-semibold text-gray-900'>Bio</h4>
          <p className='text-sm text-gray-700'>{sanitizedBio}</p>
        </div>
      ) : null}
    </>
  );
}
