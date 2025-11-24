'use client';

import { Button } from '@/components/ui/button';
import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { toast } from '@/lib/utils/toast';
import { Copy, Edit3, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from 'vaul';
import { ReceiveLightningSheet } from './receive-invoice-sheet';

interface ReceiveLightningSheetProps {
  lightningAddress: string;
  onClose: () => void;
}

export function ReceiveLightningSheet({ lightningAddress, onClose }: ReceiveLightningSheetProps) {
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lightningAddress);
      toast.success('Lightning address copied');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Lightning Address',
          text: `Send me Bitcoin: ${lightningAddress}`,
        });
      } catch (error) {
        // User cancelled or share failed
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <>
      <div className='flex h-full flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between border-b p-4'>
          <h2 className='text-xl font-semibold'>Receive</h2>
          <button
            onClick={onClose}
            className='rounded-full p-2 transition-colors hover:bg-gray-100'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Content */}
        <div className='flex flex-1 flex-col items-center justify-center space-y-6 p-6'>
          {/* QR Code */}
          <EventoQRCode value={`lightning:${lightningAddress}`} size={256} />

          {/* Lightning Address */}
          <div className='w-full max-w-md space-y-3'>
            <div className='rounded-xl bg-gray-50 p-4 text-center'>
              <p className='break-all font-mono text-sm text-gray-900'>{lightningAddress}</p>
            </div>

            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-3'>
              <Button onClick={handleCopy} variant='outline' size='lg' className='w-full'>
                <Copy className='mr-2 h-4 w-4' />
                Copy
              </Button>
              <Button onClick={handleShare} variant='outline' size='lg' className='w-full'>
                <Share2 className='mr-2 h-4 w-4' />
                Share
              </Button>
            </div>

            {/* Invoice Button */}
            <Button
              onClick={() => setShowInvoiceSheet(true)}
              variant='default'
              size='lg'
              className='w-full'
            >
              <Edit3 className='mr-2 h-4 w-4' />
              Amount / Note
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Sheet */}
      <Drawer.Root open={showInvoiceSheet} onOpenChange={setShowInvoiceSheet}>
        <Drawer.Portal>
          <Drawer.Overlay className='fixed inset-0 bg-black/40' />
          <Drawer.Content className='fixed bottom-0 left-0 right-0 mt-24 flex max-h-[95vh] flex-col rounded-t-[10px] bg-white'>
            <ReceiveLightningSheet onClose={() => setShowInvoiceSheet(false)} />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
