'use client';

import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { RSVPStatus } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface RsvpSheetProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function RsvpSheet({ eventId, isOpen, onClose }: RsvpSheetProps) {
  const [activeDetent, setActiveDetent] = useState(1);
  const { data, isLoading: isLoadingCurrent } = useUserRSVP(eventId);
  const upsert = useUpsertRSVP();
  const [pending, setPending] = useState<RSVPStatus | null>(null);

  const currentStatus = data?.status ?? null;
  const hasExisting = !!data?.rsvp;

  useEffect(() => {
    if (isOpen) setActiveDetent(1);
  }, [isOpen]);

  const handleAction = async (status: RSVPStatus) => {
    setPending(status);
    try {
      await upsert.mutateAsync({ eventId, status, hasExisting });
      const msg =
        status === 'yes'
          ? "You're going"
          : status === 'maybe'
            ? 'Marked as maybe'
            : 'You are not going';
      toast.success(msg);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update RSVP');
    } finally {
      setPending(null);
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

  const isPending = (s: RSVPStatus) => pending === s || upsert.isPending;

  const renderLabel = (s: RSVPStatus, label: string) => {
    if (isPending(s)) {
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
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className='p-4'>
            <div className='flex items-center justify-center py-2'>
              <SheetWithDetent.Handle />
            </div>
            <VisuallyHidden.Root asChild>
              <SheetWithDetent.Title>RSVP</SheetWithDetent.Title>
            </VisuallyHidden.Root>

            <div className='space-y-3'>
              <button
                className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[0].classes}`}
                disabled={isLoadingCurrent || isPending('yes')}
                onClick={() => handleAction('yes')}
              >
                {renderLabel('yes', buttons[0].label)}
              </button>
              <button
                className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[1].classes}`}
                disabled={isLoadingCurrent || isPending('maybe')}
                onClick={() => handleAction('maybe')}
              >
                {renderLabel('maybe', buttons[1].label)}
              </button>
              <button
                className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[2].classes}`}
                disabled={isLoadingCurrent || isPending('no')}
                onClick={() => handleAction('no')}
              >
                {renderLabel('no', buttons[2].label)}
              </button>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
