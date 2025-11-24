'use client';

import { BitcoinSVGIcon } from '@/components/icons/bitcoin';
import { Button } from '@/components/ui/button';
import { Globe, Instagram } from 'lucide-react';
import { useState } from 'react';
import InstagramSheet from './sheets/instagram-sheet';
import LightningSheet from './sheets/lightning-sheet';
import NostrSheet from './sheets/nostr-sheet';
import WebsiteSheet from './sheets/website-sheet';
import XSheet from './sheets/x-sheet';

interface User {
  bio_link?: string;
  instagram_handle?: string;
  x_handle?: string;
  ln_address?: string;
  nip05?: string;
}

interface SocialLinksProps {
  user: User;
}

export default function SocialLinks({ user }: SocialLinksProps) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // Check if user has any social links
  const hasAnyLinks =
    user.bio_link || user.instagram_handle || user.x_handle || user.ln_address || user.nip05;

  if (!hasAnyLinks) {
    return null;
  }

  return (
    <>
      <div className='flex w-full max-w-md flex-wrap justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2.5 transition-all duration-200'>
        {/* Website */}
        {user.bio_link && (
          <Button
            size='icon'
            variant='outline'
            onClick={() => setActiveSheet('website')}
            className='rounded-full'
          >
            <Globe className='h-6 w-6 text-gray-600' />
          </Button>
        )}

        {/* Instagram */}
        {user.instagram_handle && (
          <Button
            size='icon'
            variant='outline'
            onClick={() => setActiveSheet('instagram')}
            className='rounded-full'
          >
            <Instagram className='h-6 w-6 text-pink-500' />
          </Button>
        )}

        {/* X/Twitter */}
        {user.x_handle && (
          <Button
            size='icon'
            variant='outline'
            onClick={() => setActiveSheet('x')}
            className='rounded-full'
          >
            <svg className='h-6 w-6' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
            </svg>
          </Button>
        )}

        {/* Lightning */}
        {user.ln_address && (
          <Button
            size='icon'
            variant='outline'
            onClick={() => setActiveSheet('lightning')}
            className='rounded-full'
          >
            <BitcoinSVGIcon className='h-6 w-6' fill='#f7931a' />
          </Button>
        )}

        {/* Nostr */}
        {user.nip05 && (
          <Button
            size='icon'
            variant='outline'
            onClick={() => setActiveSheet('nostr')}
            className='rounded-full'
          >
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-purple-500'>
              <span className='text-xs font-bold text-white'>N</span>
            </div>
          </Button>
        )}
      </div>

      {/* Detached Sheets */}
      <WebsiteSheet
        isOpen={activeSheet === 'website'}
        onClose={() => setActiveSheet(null)}
        url={user.bio_link || ''}
      />

      <InstagramSheet
        isOpen={activeSheet === 'instagram'}
        onClose={() => setActiveSheet(null)}
        handle={user.instagram_handle || ''}
      />

      <XSheet
        isOpen={activeSheet === 'x'}
        onClose={() => setActiveSheet(null)}
        handle={user.x_handle || ''}
      />

      <LightningSheet
        isOpen={activeSheet === 'lightning'}
        onClose={() => setActiveSheet(null)}
        address={user.ln_address || ''}
      />

      <NostrSheet
        isOpen={activeSheet === 'nostr'}
        onClose={() => setActiveSheet(null)}
        nip05={user.nip05 || ''}
      />
    </>
  );
}
