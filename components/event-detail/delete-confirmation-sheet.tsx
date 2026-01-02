'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

interface DeleteConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType?: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationSheet({
  isOpen,
  onClose,
  onConfirm,
  itemType = 'comment',
  isLoading = false,
}: DeleteConfirmationSheetProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <MasterScrollableSheet
      title={`Delete ${itemType}`}
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      contentClassName='p-6'
    >
      <div className='mb-6 flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-50'>
          <AlertTriangle className='h-5 w-5 text-red-500' />
        </div>
        <h2 className='text-xl font-semibold'>Delete {itemType}</h2>
      </div>

      {/* Body */}
      <div className='mb-8 text-gray-600'>
        <p>Are you sure you want to delete this {itemType}? This action cannot be undone.</p>
      </div>

      {/* Actions */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <Button onClick={onClose} variant='outline' className='w-full'>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant='destructive'
          className='w-full'
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : `Delete ${itemType}`}
        </Button>
      </div>
    </MasterScrollableSheet>
  );
}
