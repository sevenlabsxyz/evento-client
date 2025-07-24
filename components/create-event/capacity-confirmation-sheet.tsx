import { DetachedSheet } from '@/components/ui/detached-sheet';
import { AlertTriangle } from 'lucide-react';

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
                  <button onClick={onClose} className='font-medium text-red-500'>
                    Cancel
                  </button>
                  <h2 className='text-lg font-semibold'>Turn Off Capacity?</h2>
                  <button
                    onClick={handleConfirm}
                    className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
                  >
                    Turn Off
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className='space-y-4 text-center'>
                <div className='mb-4 flex justify-center'>
                  <AlertTriangle className='h-12 w-12 text-amber-500' />
                </div>

                <div className='space-y-3 text-left'>
                  <p className='text-sm leading-relaxed text-gray-700'>
                    Are you sure you want to turn off capacity limits for this event?
                    {currentCapacity && (
                      <span className='font-semibold text-gray-900'>
                        {' '}
                        Your current capacity is set to {currentCapacity} attendees.
                      </span>
                    )}
                  </p>
                  <p className='text-sm leading-relaxed text-gray-500'>
                    This action will remove all capacity restrictions. You can always set a new
                    capacity later.
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
