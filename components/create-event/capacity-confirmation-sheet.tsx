import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
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
    <MasterScrollableSheet
      title='Turn Off Capacity?'
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      headerLeft={
        <button onClick={onClose} className='font-medium text-red-500'>
          Cancel
        </button>
      }
      headerCenter={<h2 className='text-lg font-semibold'>Turn Off Capacity?</h2>}
      headerRight={
        <button
          onClick={handleConfirm}
          className='rounded-xl bg-red-500 px-4 py-2 font-medium text-white'
        >
          Turn Off
        </button>
      }
      contentClassName='p-6'
    >
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
            This action will remove all capacity restrictions. You can always set a new capacity
            later.
          </p>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
