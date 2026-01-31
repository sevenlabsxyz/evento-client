'use client';

import { Button } from '@/components/ui/button';
import { Camera, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TicketScannerProps {
  onScan: (token: string) => void;
  isProcessing: boolean;
}

export function TicketScanner({ onScan, isProcessing }: TicketScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;

    setIsStarting(true);
    setError(null);

    try {
      // Dynamically import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Pause scanning while processing
          if (!isProcessing) {
            onScan(decodedText);
          }
        },
        () => {
          // QR code scanning failure callback - ignore
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err: any) {
      console.error('Scanner error:', err);

      if (err.message?.includes('Permission')) {
        setHasPermission(false);
        setError('Camera permission denied. Please allow camera access to scan tickets.');
      } else if (err.message?.includes('NotFoundError')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError('Failed to start scanner. Please try again.');
      }
    } finally {
      setIsStarting(false);
    }
  }, [onScan, isProcessing]);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Auto-start scanner on mount
  useEffect(() => {
    startScanner();
  }, [startScanner]);

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl bg-gray-100 p-8'>
        <XCircle className='h-12 w-12 text-red-500' />
        <p className='mt-4 text-center text-gray-600'>{error}</p>
        <Button className='mt-4 rounded-full' onClick={startScanner}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Scanner Container */}
      <div className='relative overflow-hidden rounded-xl bg-black'>
        <div id='qr-reader' ref={scannerRef} className='w-full' />

        {/* Loading Overlay */}
        {(isStarting || isProcessing) && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
            <div className='text-center'>
              <Loader2 className='mx-auto h-8 w-8 animate-spin text-white' />
              <p className='mt-2 text-sm text-white'>
                {isStarting ? 'Starting camera...' : 'Processing...'}
              </p>
            </div>
          </div>
        )}

        {/* Scan Frame Overlay */}
        {isScanning && !isProcessing && (
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            <div className='h-64 w-64 rounded-lg border-2 border-white/50'>
              <div className='absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-white' />
              <div className='absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-white' />
              <div className='absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-white' />
              <div className='absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-white' />
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className='flex items-center justify-center gap-2 text-gray-500'>
        <Camera className='h-4 w-4' />
        <span className='text-sm'>Point camera at ticket QR code</span>
      </div>
    </div>
  );
}
