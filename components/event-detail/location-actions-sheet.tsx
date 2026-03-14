'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';

interface LocationActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullAddress: string;
  destination: string;
}

export function LocationActionsSheet({
  open,
  onOpenChange,
  fullAddress,
  destination,
}: LocationActionsSheetProps) {
  const encodedDestination = encodeURIComponent(destination);
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${encodedDestination}&dirflg=d`;

  const handleOpenMaps = (provider: 'apple' | 'google') => {
    const mapUrl = provider === 'apple' ? appleMapsUrl : googleMapsDirectionsUrl;
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      toast.success('Address copied');
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to copy address', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to copy address');
    }
  };

  return (
    <MasterScrollableSheet title='Open in Maps' open={open} onOpenChange={onOpenChange}>
      <div className='px-4 pb-6'>
        <p className='mb-5 text-sm text-gray-600'>{fullAddress}</p>

        <div className='space-y-3'>
          <Button
            type='button'
            variant='outline'
            className='h-14 w-full justify-start text-base font-medium'
            onClick={() => handleOpenMaps('apple')}
          >
            Open in Apple Maps
          </Button>

          <Button
            type='button'
            variant='outline'
            className='h-14 w-full justify-start text-base font-medium'
            onClick={() => handleOpenMaps('google')}
          >
            Open in Google Maps
          </Button>

          <Button
            type='button'
            variant='outline'
            className='h-14 w-full justify-start text-base font-medium'
            onClick={handleCopyAddress}
          >
            Copy Address
          </Button>

          <Button
            type='button'
            variant='outline'
            className='mt-2 h-14 w-full text-base font-medium text-gray-600'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
