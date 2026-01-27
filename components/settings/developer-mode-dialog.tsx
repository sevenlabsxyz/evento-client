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

interface DeveloperModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeveloperModeDialog({ open, onOpenChange, onConfirm }: DeveloperModeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Developer Mode?</AlertDialogTitle>
          <AlertDialogDescription className='space-y-2'>
            <span className='block'>
              Developer Mode is intended for advanced users building integrations with Evento.
            </span>
            <span className='block font-medium text-amber-600'>
              Enabling this will grant access to API keys and technical settings. Make sure you
              understand the security implications of managing API credentials.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-amber-600 hover:bg-amber-700 focus:ring-amber-600'
          >
            Enable Developer Mode
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
