'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmailBlastCancelConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isCancelling: boolean;
}

export default function EmailBlastCancelConfirmation({
  open,
  onOpenChange,
  onConfirm,
  isCancelling,
}: EmailBlastCancelConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel scheduled blast?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the scheduled blast and it will not be sent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep Scheduled</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isCancelling}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Blast'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
