'use client';

import { ClipboardPaste, X } from '@/components/icons/lucide';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { CameraScanner } from '@/components/wallet/qr-code-scanner';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { useState } from 'react';

interface ScanQrSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (decodedText: string) => void;
}

export function ScanQrSheet({ open, onOpenChange, onScanSuccess }: ScanQrSheetProps) {
  const [isPasting, setIsPasting] = useState(false);

  const handleScanSuccess = (decodedText: string) => {
    onScanSuccess(decodedText);
    onOpenChange(false);
  };

  const handlePasteFromClipboard = async () => {
    setIsPasting(true);
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        handleScanSuccess(clipboardText.trim());
      } else {
        toast.error('Clipboard is empty');
      }
    } catch (error) {
      toast.error('Unable to access clipboard. Please paste manually.');
    } finally {
      setIsPasting(false);
    }
  };

  return (
    <SheetWithDetent.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetent.Portal>
        <SheetWithDetent.View detents={undefined}>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className='min-h-max p-0'>
            <VisuallyHidden.Root asChild>
              <SheetWithDetent.Title>Scan QR Code</SheetWithDetent.Title>
            </VisuallyHidden.Root>

            {/* Fullscreen Camera Scanner */}
            <div className='relative h-screen w-full overflow-hidden rounded-t-3xl bg-black'>
              {open && <CameraScanner onScanSuccess={handleScanSuccess} />}

              {/* Close Button Overlay */}
              <button
                onClick={() => onOpenChange(false)}
                className='absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70'
                aria-label='Close scanner'
              >
                <X className='h-6 w-6 text-white' />
              </button>

              {/* Paste Button Overlay */}
              <button
                onClick={handlePasteFromClipboard}
                disabled={isPasting}
                className='absolute left-4 top-4 z-50 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50'
                aria-label='Paste from clipboard'
              >
                <ClipboardPaste className='h-5 w-5 text-white' />
                <span className='text-sm font-medium text-white'>
                  {isPasting ? 'Pasting...' : 'Paste'}
                </span>
              </button>

              {/* Scanner Instructions */}
              <div className='absolute bottom-8 left-0 right-0 z-40 px-6 text-center'>
                <div className='mx-auto max-w-sm rounded-2xl bg-black/50 p-4 backdrop-blur-sm'>
                  <p className='text-sm font-medium text-white'>Point your camera at a QR code</p>
                  <p className='mt-1 text-xs text-white/80'>
                    Lightning, LNURL, or Bitcoin payment QR
                  </p>
                </div>
              </div>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
