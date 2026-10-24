'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { useCancelEvent } from '@/lib/hooks/use-cancel-event';
import { toast } from '@/lib/utils/toast';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');

  const handleConfirm = () => {
    cancelEventMutation.mutate(
      { eventId, sendEmails: sendEmail },
      {
        onSuccess: () => {
          toast.success(
            sendEmail
              ? t('cancelEvent.toasts.canceledWithEmails')
              : t('cancelEvent.toasts.canceled')
          );

          onClose();
          // Redirect to hub page after successful cancellation
          router.push('/e/hub');
        },
        onError: () => {
          toast.error(t('cancelEvent.toasts.failed'));
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
                <h2 className='text-2xl font-bold text-gray-900 dark:text-neutral-100'>
                  {t('cancelEvent.title')}
                </h2>
                <button
                  onClick={onClose}
                  className='rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800'
                >
                  <X className='h-5 w-5 text-gray-600 dark:text-neutral-400' />
                </button>
              </div>

              {/* Warning Icon */}
              <div className='mb-6 flex justify-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
                  <AlertTriangle className='h-8 w-8 text-red-600 dark:text-red-400' />
                </div>
              </div>

              {/* Description */}
              <div className='mb-6 space-y-4 text-center'>
                <p className='text-gray-600 dark:text-neutral-400'>
                  {t.rich('cancelEvent.aboutToCancel', {
                    title: eventTitle || t('cancelEvent.thisEvent'),
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>

                {/* Warning Text */}
                <div className='rounded-xl bg-red-50 p-4 text-left dark:bg-red-950/40'>
                  <p className='mb-2 font-medium text-red-600 dark:text-red-400'>
                    {t('cancelEvent.warning')}
                  </p>
                  <ul className='list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-neutral-300'>
                    <li>{t('cancelEvent.consequences.hidden')}</li>
                    <li>{t('cancelEvent.consequences.noAccess')}</li>
                    <li>{t('cancelEvent.consequences.subEvents')}</li>
                    <li>{t('cancelEvent.consequences.noReopen')}</li>
                  </ul>
                </div>
              </div>

              {/* Email Notification Toggle */}
              <div className='mb-6 rounded-2xl bg-gray-50 p-4 dark:bg-neutral-950'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h3 className='mb-1 font-medium text-gray-900 dark:text-neutral-100'>
                      {t('cancelEvent.notifyTitle')}
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-neutral-400'>
                      {t('cancelEvent.notifyDescription')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`ml-4 h-6 w-12 rounded-full transition-colors ${
                      sendEmail ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white transition-transform dark:bg-neutral-100 ${
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
                className='mt-4 w-full bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-neutral-600'
                size='lg'
              >
                {cancelEventMutation.isPending ? (
                  <span className='animate-pulse'>{t('cancelEvent.cancelling')}</span>
                ) : (
                  <>
                    <Trash2 className='mr-2 h-5 w-5' />
                    {t('cancelEvent.title')}
                  </>
                )}
              </Button>

              {/* Close button */}
              <Button variant='outline' onClick={onClose} className='mt-3 w-full'>
                {tCommon('actions.close')}
              </Button>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
