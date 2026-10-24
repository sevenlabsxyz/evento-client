import { DetachedSheet } from '@/components/ui/detached-sheet';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CapacityConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentCapacity?: string;
}

export default function CapacityConfirmationSheet({
  isOpen,
  onClose,
  onConfirm,
  currentCapacity,
}: CapacityConfirmationSheetProps) {
  const t = useTranslations('createEvent');
  const tCommon = useTranslations('common');
  const handleConfirm = () => {
    onConfirm();
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

              {/* Header */}
              <div className='mb-6'>
                <div className='mb-6 flex items-center justify-between'>
                  <button onClick={onClose} className='font-medium text-red-500 dark:text-red-400'>
                    {tCommon('actions.cancel')}
                  </button>
                  <h2 className='text-lg font-semibold'>{t('capacityConfirm.title')}</h2>
                  <button
                    onClick={handleConfirm}
                    className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white dark:bg-red-600'
                  >
                    {t('capacityConfirm.turnOff')}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className='space-y-4 text-center'>
                <div className='mb-4 flex justify-center'>
                  <AlertTriangle className='h-12 w-12 text-amber-500 dark:text-amber-400' />
                </div>

                <div className='space-y-3 text-left'>
                  <p className='text-sm leading-relaxed text-gray-700 dark:text-neutral-300'>
                    {t('capacityConfirm.question')}
                    {currentCapacity && (
                      <span className='font-semibold text-gray-900 dark:text-neutral-100'>
                        {' '}
                        {t('capacityConfirm.current', { capacity: currentCapacity })}
                      </span>
                    )}
                  </p>
                  <p className='text-sm leading-relaxed text-gray-500 dark:text-neutral-400'>
                    {t('capacityConfirm.description')}
                  </p>
                </div>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
