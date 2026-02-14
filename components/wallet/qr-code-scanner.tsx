'use client';

import { logger } from '@/lib/utils/logger';
import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function CameraScanner({ onScanSuccess }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasStarted = useRef(false);
  const isRunning = useRef(false);
  const hasScanned = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
          },
          (decodedText) => {
            if (hasScanned.current) return;
            hasScanned.current = true;

            // Stop scanner immediately to prevent repeated callbacks
            scannerRef.current?.stop().catch(() => {});
            isRunning.current = false;

            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore error messages during scanning
          }
        );

        isRunning.current = true;
        setIsScanning(true);
      } catch (err) {
        logger.error('Error starting scanner', {
          error: err instanceof Error ? err.message : String(err),
        });
        isRunning.current = false;
      }
    };

    startScanner();

    return () => {
      const stopScanner = async () => {
        if (scannerRef.current && isRunning.current) {
          try {
            await scannerRef.current.stop();
            isRunning.current = false;
          } catch (err) {
            // Only log if it's not the "not running" error
            if (err instanceof Error && !err.message.includes('not running')) {
              logger.error('Error stopping scanner', {
                error: err.message,
              });
            }
          }
        }
      };

      stopScanner();
    };
  }, [onScanSuccess]);

  return (
    <div className='absolute inset-0 z-10 bg-black'>
      <style jsx>{`
        #qr-reader {
          width: 100%;
          height: 100%;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        #qr-reader > div {
          display: none !important;
        }
      `}</style>

      <div id='qr-reader' className='h-full w-full' />

      {!isScanning && (
        <div className='absolute inset-0 flex items-center justify-center bg-black'>
          <div className='flex flex-col items-center gap-4'>
            <div className='h-11 w-11 animate-spin rounded-full border-[3px] border-white/20 border-t-white' />
            <p className='text-[17px] font-semibold text-white'>Starting Camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}
