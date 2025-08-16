'use client';

import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { RSVPStatus } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { Check, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { DetachedSheet } from '../ui/detached-sheet';

interface RsvpSheetProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RsvpSheet({ eventId, isOpen, onClose }: RsvpSheetProps) {
  const { data, isLoading: isLoadingCurrent } = useUserRSVP(eventId);
  const upsert = useUpsertRSVP();

  const currentStatus = data?.status ?? null;
  const hasExisting = !!data?.rsvp;

  const handleAction = async (status: RSVPStatus) => {
    // If the user taps the same status, just close the sheet and do nothing
    if (status === currentStatus) {
      onClose();
      return;
    }
    try {
      await upsert.mutateAsync(
        { eventId, status, hasExisting },
        {
          onSuccess: () => {
            const msg =
              status === 'yes'
                ? "You're going"
                : status === 'maybe'
                  ? 'Marked as maybe'
                  : 'You are not going';
            toast.success(msg);
            onClose();
          },
          onError: () => {
            toast.error('Failed to update RSVP. Please try again.');
          },
        }
      );
    } catch {
      toast.error('Failed to update RSVP. Please try again.');
    }
  };

  const buttons = useMemo(
    () => [
      {
        key: 'yes' as const,
        label: currentStatus === 'yes' ? "You're going" : 'Yes',
        classes:
          currentStatus === 'yes'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-red-500 text-white hover:bg-red-600',
      },
      {
        key: 'maybe' as const,
        label: currentStatus === 'maybe' ? 'Marked maybe' : 'Maybe',
        classes:
          currentStatus === 'maybe'
            ? 'bg-black text-white hover:bg-black'
            : 'bg-black text-white hover:bg-gray-900',
      },
      {
        key: 'no' as const,
        label: currentStatus === 'no' ? 'Not going' : 'No',
        classes:
          currentStatus === 'no'
            ? 'bg-gray-400 text-white hover:bg-gray-400'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      },
    ],
    [currentStatus]
  );

  const renderLabel = (s: RSVPStatus, label: string) => {
    if (upsert.isPending) {
      return (
        <span className='inline-flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' /> Updating...
        </span>
      );
    }
    if (currentStatus === s) {
      return (
        <span className='inline-flex items-center gap-2'>
          <Check className='h-4 w-4' /> {label}
        </span>
      );
    }
    return label;
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6 pb-24'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              <VisuallyHidden.Root asChild>
                <DetachedSheet.Title>RSVP</DetachedSheet.Title>
              </VisuallyHidden.Root>

              <div className='space-y-3'>
                <button
                  className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[0].classes}`}
                  disabled={isLoadingCurrent || upsert.isPending}
                  onClick={() => handleAction('yes')}
                >
                  {renderLabel('yes', buttons[0].label)}
                </button>
                <button
                  className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[1].classes}`}
                  disabled={isLoadingCurrent || upsert.isPending}
                  onClick={() => handleAction('maybe')}
                >
                  {renderLabel('maybe', buttons[1].label)}
                </button>
                <button
                  className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[2].classes}`}
                  disabled={isLoadingCurrent || upsert.isPending}
                  onClick={() => handleAction('no')}
                >
                  {renderLabel('no', buttons[2].label)}
                </button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
