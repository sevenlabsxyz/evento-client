'use client';

import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { CameraScanner } from '@/components/wallet/qr-code-scanner';
import { useCheckIn } from '@/lib/hooks/use-event-attendees';
import type { CheckInResult } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { ClipboardPaste, Loader2, ScanLine, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckInResultCard } from './check-in-result-card';

/**
 * Ticket QR codes encode the signed token (`<ticketId>.<signature>`). Accept a
 * URL carrying it as a `token` query param as well, so links pasted from
 * emails resolve to the same token.
 */
export function extractTicketToken(raw: string): string {
  const value = raw.trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const token = url.searchParams.get('token');
    if (token) return token.trim();
  } catch {
    // Not a URL; the raw value is the token.
  }

  return value;
}

type ScanPhase = 'scanning' | 'processing' | 'result';

interface CheckInScannerSheetProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInScannerSheet({ eventId, open, onOpenChange }: CheckInScannerSheetProps) {
  const { mutateAsync: checkInAsync } = useCheckIn(eventId);
  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  // Incremented whenever a session is reset so late responses from a closed
  // or superseded scan never overwrite the current state.
  const requestIdRef = useRef(0);

  const submitToken = useCallback(
    async (raw: string) => {
      const token = extractTicketToken(raw);
      if (!token) return;

      const requestId = ++requestIdRef.current;
      setPhase('processing');
      setResult(null);

      let nextResult: CheckInResult;
      try {
        nextResult = await checkInAsync({ token });
      } catch (error) {
        logger.error('Ticket check-in failed', { error: getErrorMessage(error) });
        nextResult = {
          valid: false,
          error: getErrorMessage(error) || 'Check-in failed. Please try again.',
        };
      }

      if (requestId !== requestIdRef.current) return;
      setResult(nextResult);
      setPhase('result');
    },
    [checkInAsync]
  );

  // CameraScanner restarts (and stops) its camera whenever the callback identity
  // changes, so hand it a stable callback that reads the latest handler.
  const submitTokenRef = useRef(submitToken);
  useEffect(() => {
    submitTokenRef.current = submitToken;
  }, [submitToken]);
  const handleDecoded = useCallback((decodedText: string) => {
    void submitTokenRef.current(decodedText);
  }, []);

  useEffect(() => {
    if (open) return;
    requestIdRef.current += 1;
    setPhase('scanning');
    setResult(null);
  }, [open]);

  const handleScanNext = () => {
    requestIdRef.current += 1;
    setResult(null);
    setPhase('scanning');
  };

  const handlePaste = async () => {
    setIsPasting(true);
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText.trim()) {
        await submitToken(clipboardText);
      } else {
        toast.error('Clipboard is empty');
      }
    } catch (error) {
      logger.error('Clipboard read failed', { error: getErrorMessage(error) });
      toast.error('Unable to access clipboard. Use the manual entry on the check-in page.');
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
              <SheetWithDetent.Title>Scan tickets</SheetWithDetent.Title>
            </VisuallyHidden.Root>

            <div className='relative h-screen w-full overflow-hidden rounded-t-3xl bg-black'>
              {open && phase === 'scanning' ? (
                <CameraScanner onScanSuccess={handleDecoded} />
              ) : null}

              {phase === 'processing' ? (
                <div className='absolute inset-0 z-20 flex items-center justify-center bg-black'>
                  <div className='flex flex-col items-center gap-4'>
                    <Loader2 className='h-10 w-10 animate-spin text-white' />
                    <p className='text-[17px] font-semibold text-white'>Checking ticket…</p>
                  </div>
                </div>
              ) : null}

              {phase === 'result' && result ? (
                <div className='absolute inset-0 z-20 flex flex-col justify-end bg-black/90 p-4 pb-10'>
                  <div className='mx-auto w-full max-w-md space-y-3'>
                    <CheckInResultCard result={result} />
                    <button
                      type='button'
                      onClick={handleScanNext}
                      className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
                    >
                      <ScanLine className='h-5 w-5' />
                      Scan next ticket
                    </button>
                    <button
                      type='button'
                      onClick={() => onOpenChange(false)}
                      className='flex h-12 w-full items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10'
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type='button'
                onClick={() => onOpenChange(false)}
                className='absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70'
                aria-label='Close scanner'
              >
                <X className='h-6 w-6 text-white' />
              </button>

              {phase === 'scanning' ? (
                <>
                  <button
                    type='button'
                    onClick={handlePaste}
                    disabled={isPasting}
                    className='absolute left-4 top-4 z-50 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50'
                    aria-label='Paste ticket code from clipboard'
                  >
                    <ClipboardPaste className='h-5 w-5 text-white' />
                    <span className='text-sm font-medium text-white'>
                      {isPasting ? 'Pasting...' : 'Paste'}
                    </span>
                  </button>

                  <div className='absolute bottom-8 left-0 right-0 z-40 px-6 text-center'>
                    <div className='mx-auto max-w-sm rounded-2xl bg-black/50 p-4 backdrop-blur-sm'>
                      <p className='text-sm font-medium text-white'>
                        Point your camera at a ticket QR code
                      </p>
                      <p className='mt-1 text-xs text-white/80'>
                        Guests will be checked in as soon as their code is read
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
