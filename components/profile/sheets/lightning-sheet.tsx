'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { toast } from '@/lib/utils/toast';
import { Copy, ExternalLink, Zap } from 'lucide-react';
import { useState } from 'react';

interface LightningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export default function LightningSheet({ isOpen, onClose, address }: LightningSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Lightning address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleOpenLightning = () => {
    const lightningUrl = `lightning:${address}`;
    window.open(lightningUrl, '_blank');
    onClose();
  };

  return (
    <MasterScrollableSheet
      title='Lightning Address'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='p-6'
    >
      <div>
        {/* Lightning Info */}
        <div className='mb-6 flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
            <Zap className='h-6 w-6 text-yellow-600' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>{address}</h3>
            <p className='text-sm text-gray-500'>Bitcoin Lightning Address</p>
          </div>
        </div>

        {/* Description */}
        <div className='mb-6'>
          <p className='mb-4 text-gray-600'>
            This is a Bitcoin Lightning Network address. You can use it to send instant, low-fee
            Bitcoin payments globally.
          </p>
          <div className='rounded-lg bg-gray-50 p-3'>
            <p className='break-all font-mono text-sm text-gray-700'>{address}</p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col gap-3'>
          <Button
            onClick={handleOpenLightning}
            className='w-full bg-red-600 text-white hover:bg-red-700'
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            Open in Wallet
          </Button>
          <Button onClick={handleCopyAddress} className='w-full' variant='outline'>
            <Copy className='mr-2 h-4 w-4' />
            {copied ? 'Copied!' : 'Copy Address'}
          </Button>
        </div>

        <Button variant='outline' onClick={onClose} className='mt-3 w-full'>
          Close
        </Button>
      </div>
    </MasterScrollableSheet>
  );
}
