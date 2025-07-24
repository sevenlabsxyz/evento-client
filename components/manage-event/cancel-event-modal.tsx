'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { useCancelEvent } from '@/lib/hooks/useCancelEvent';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CancelEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
}

export default function CancelEventModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: CancelEventModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const router = useRouter();
  const cancelEventMutation = useCancelEvent();

  const handleConfirm = () => {
    cancelEventMutation.mutate(
      { eventId, sendEmails: sendEmail },
      {
        onSuccess: () => {
          onClose();
          // Redirect to feed page after successful cancellation
          router.push('/e/feed');
        },
      }
    );
  };

  return (
    <DetachedSheet.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && onClose()}
    >
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              {/* Handle */}
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Header with close button */}
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-2xl font-bold text-gray-900'>Cancel Event</h2>
                <button onClick={onClose} className='rounded-full p-2 hover:bg-gray-100'>
                  <X className='h-5 w-5 text-gray-600' />
                </button>
              </div>

              {/* Warning Icon */}
              <div className='mb-6 flex justify-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                  <AlertTriangle className='h-8 w-8 text-red-600' />
                </div>
              </div>

              {/* Description */}
              <div className='mb-6 space-y-4 text-center'>
                <p className='text-gray-600'>
                  You are about to cancel <strong>{eventTitle || 'this event'}</strong>.
                </p>

                {/* Warning Text */}
                <div className='rounded-xl bg-red-50 p-4 text-left'>
                  <p className='mb-2 font-medium text-red-600'>
                    Warning: This action is permanent and cannot be undone.
                  </p>
                  <ul className='list-disc space-y-1 pl-5 text-sm text-gray-700'>
                    <li>All event data will be permanently deleted</li>
                    <li>All RSVPs, comments, and photos will be removed</li>
                    <li>Links to this event will no longer work</li>
                    <li>This action cannot be reversed</li>
                  </ul>
                </div>
              </div>

              {/* Email Notification Toggle */}
              <div className='mb-6 rounded-2xl bg-gray-50 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h3 className='mb-1 font-medium text-gray-900'>Notify attendees via email</h3>
                    <p className='text-sm text-gray-500'>
                      Send cancellation notification to all registered guests
                    </p>
                  </div>
                  <button
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`ml-4 h-6 w-12 rounded-full transition-colors ${
                      sendEmail ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        sendEmail ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Cancel Event Button */}
              <Button
                onClick={handleConfirm}
                disabled={cancelEventMutation.isPending}
                className='mt-4 w-full bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300'
                size='lg'
              >
                {cancelEventMutation.isPending ? (
                  <span className='animate-pulse'>Cancelling...</span>
                ) : (
                  <>
                    <Trash2 className='mr-2 h-5 w-5' />
                    Cancel Event
                  </>
                )}
              </Button>

              {/* Close button */}
              <Button variant='outline' onClick={onClose} className='mt-3 w-full'>
                Close
              </Button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
