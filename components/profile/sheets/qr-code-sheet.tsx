'use client';

import { toPng } from 'html-to-image';
import { Check, Copy, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { toast } from '@/lib/utils/toast';

interface QRCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userImage?: string | null;
}

export default function QRCodeSheet({ isOpen, onClose, username, userImage }: QRCodeSheetProps) {
  const [isCopied, setIsCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const profileUrl = `https://evento.so/${username}`;

  const logoImage = useMemo(() => {
    const svgString = encodeURIComponent(`
      <svg width="294" height="294" viewBox="0 0 294 294" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="294" height="294" rx="53.4545" fill="white"/>
        <path d="M236.014 99.5158L251.551 138.23L183.687 157.847L226.261 207.122L188.299 231.759L145.725 179.974L105.463 231.77L66.9255 207.144L109.488 157.869L42.7637 138.263L58.2891 99.5379L123.288 121.654V58.8H169.29V121.654L236.014 99.5158Z" fill="black"/>
      </svg>
    `);
    return `data:image/svg+xml,${svgString}`;
  }, []);

  const handleDownload = useCallback(() => {
    if (!qrCodeRef.current) return;

    toPng(qrCodeRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `evento-${username}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('QR Code downloaded!');
      })
      .catch((err) => {
        console.error('Error downloading QR code:', err);
        toast.error('Failed to download QR code');
      });
  }, [username]);

  const handleCopyLink = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(profileUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = profileUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setIsCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [profileUrl]);

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
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              <h2 className='mb-2 text-center text-lg font-semibold'>Profile QR Code</h2>
              <p className='mb-6 text-center text-sm text-gray-500'>@{username}</p>

              <div className='mb-6 flex justify-center'>
                <div
                  ref={qrCodeRef}
                  className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'
                >
                  <QRCodeSVG
                    value={profileUrl}
                    size={200}
                    level='M'
                    includeMargin={false}
                    fgColor='#000000'
                    imageSettings={{
                      src: userImage || logoImage,
                      x: undefined,
                      y: undefined,
                      height: 50,
                      width: 50,
                      excavate: true,
                    }}
                  />
                </div>
              </div>

              <div className='mb-6'>
                <div className='rounded-lg bg-gray-50 p-3'>
                  <p className='text-center text-sm text-gray-700'>evento.so/{username}</p>
                </div>
              </div>

              <div className='flex flex-col gap-3'>
                <Button
                  onClick={handleDownload}
                  className='w-full bg-red-600 text-white hover:bg-red-700'
                >
                  <Download className='mr-2 h-4 w-4' />
                  Download QR Code
                </Button>
                <Button variant='outline' onClick={handleCopyLink} className='w-full'>
                  {isCopied ? (
                    <>
                      <Check className='mr-2 h-4 w-4' />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className='mr-2 h-4 w-4' />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
