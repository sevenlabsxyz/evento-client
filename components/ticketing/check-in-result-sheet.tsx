'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { CheckInResponse } from '@/lib/types/api';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface CheckInResultSheetProps {
  result: CheckInResponse | null;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanAgain: () => void;
}

export function CheckInResultSheet({
  result,
  error,
  open,
  onOpenChange,
  onScanAgain,
}: CheckInResultSheetProps) {
  const getContent = () => {
    if (error) {
      return {
        icon: XCircle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100',
        title: 'Invalid Ticket',
        message: error,
      };
    }

    if (!result) {
      return null;
    }

    if (result.alreadyCheckedIn) {
      return {
        icon: AlertCircle,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-100',
        title: 'Already Checked In',
        message: `This ticket was checked in at ${new Date(result.checkedInAt!).toLocaleTimeString()}`,
      };
    }

    return {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      title: 'Check-In Successful',
      message: `${result.ticketTypeName} ticket verified`,
    };
  };

  const content = getContent();

  if (!content) return null;

  const Icon = content.icon;

  return (
    <MasterScrollableSheet title='Check-In Result' open={open} onOpenChange={onOpenChange}>
      <div className='space-y-6 px-4 pb-4'>
        {/* Status Icon */}
        <div className='flex justify-center'>
          <div className={`rounded-full p-6 ${content.bgColor}`}>
            <Icon className={`h-16 w-16 ${content.iconColor}`} />
          </div>
        </div>

        {/* Status Message */}
        <div className='text-center'>
          <h3 className='text-xl font-semibold'>{content.title}</h3>
          <p className='mt-2 text-gray-600'>{content.message}</p>
        </div>

        {/* Attendee Info (if available) */}
        {result && result.attendeeName && (
          <div className='rounded-xl bg-gray-50 p-4 text-center'>
            <p className='text-sm text-gray-500'>Attendee</p>
            <p className='font-medium text-gray-900'>{result.attendeeName}</p>
            {result.attendeeEmail && (
              <p className='text-sm text-gray-500'>{result.attendeeEmail}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-3'>
          <Button
            variant='outline'
            className='flex-1 rounded-full'
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button className='flex-1 rounded-full' onClick={onScanAgain}>
            Scan Another
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
