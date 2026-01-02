'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { toast } from '@/lib/utils/toast';
import { Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface NostrSheetProps {
  isOpen: boolean;
  onClose: () => void;
  nip05: string;
}

export default function NostrSheet({ isOpen, onClose, nip05 }: NostrSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNip05 = async () => {
    try {
      await navigator.clipboard.writeText(nip05);
      setCopied(true);
      toast.success('Nostr identifier copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy identifier');
    }
  };

  const handleOpenNostr = () => {
    const nostrUrl = `nostr:${nip05}`;
    window.open(nostrUrl, '_blank');
    onClose();
  };

  return (
    <MasterScrollableSheet
      title='Nostr'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='p-6'
    >
      <div>
        {/* Nostr Info */}
        <div className='mb-6 flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-100'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-purple-600'>
              <span className='text-xs font-bold text-white'>N</span>
            </div>
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>Nostr Protocol</h3>
            <p className='text-sm text-gray-500'>Decentralized social network</p>
          </div>
        </div>

        {/* Description */}
        <div className='mb-6'>
          <p className='mb-4 text-gray-600'>
            This is a Nostr identifier (NIP-05). Nostr is a decentralized protocol for social
            networking.
          </p>
          <div className='rounded-lg bg-gray-50 p-3'>
            <p className='break-all font-mono text-sm text-gray-700'>{nip05}</p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-3'>
          <Button
            onClick={handleOpenNostr}
            className='w-full bg-red-600 text-white hover:bg-red-700'
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            Open in Nostr App
          </Button>
          <Button onClick={handleCopyNip05} className='w-full' variant='outline'>
            <Copy className='mr-2 h-4 w-4' />
            {copied ? 'Copied!' : 'Copy NIP-05'}
          </Button>
        </div>

        <Button variant='outline' onClick={onClose} className='mt-3 w-full'>
          Close
        </Button>
      </div>
    </MasterScrollableSheet>
  );
}
