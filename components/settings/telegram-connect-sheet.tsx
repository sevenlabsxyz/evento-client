'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from '@/lib/utils/toast';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TelegramConnectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnectionChange: () => void;
}

const EVENTO_API_BASE = 'https://evento.so';
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';

declare global {
  interface Window {
    onTelegramAuthConnect?: (user: Record<string, string>) => void;
  }
}

export function TelegramConnectSheet({
  open,
  onOpenChange,
  isConnected,
  onConnectionChange,
}: TelegramConnectSheetProps) {
  const { accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || isConnected || !widgetContainerRef.current) return;

    // Define the callback Telegram widget calls after auth
    window.onTelegramAuthConnect = async (telegramUser: Record<string, string>) => {
      if (!accessToken) {
        toast.error('You must be logged in to connect Telegram.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${EVENTO_API_BASE}/api/v1/user/telegram/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(telegramUser),
        });

        if (res.ok) {
          toast.success('Telegram connected!');
          onConnectionChange();
          onOpenChange(false);
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || 'Failed to connect Telegram. Try again.');
        }
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Inject the Telegram Login Widget script
    if (TELEGRAM_BOT_USERNAME) {
      const container = widgetContainerRef.current;
      container.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramAuthConnect(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuthConnect;
    };
  }, [open, isConnected, accessToken, onConnectionChange, onOpenChange]);

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${EVENTO_API_BASE}/api/v1/user/telegram/link`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        toast.success('Telegram disconnected.');
        onConnectionChange();
        onOpenChange(false);
      } else {
        toast.error('Failed to disconnect Telegram.');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SheetWithDetentFull.Root
      presented={open}
      onPresentedChange={(presented) => onOpenChange(presented)}
      activeDetent={1}
      onActiveDetentChange={() => {}}
    >
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='grid grid-rows-[min-content_1fr]'>
            <div className='border-b border-gray-100 p-4'>
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#2AABEE]'>
                  <Send className='h-5 w-5 text-white' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-gray-900'>Telegram</h2>
                  <p className='text-sm text-gray-500'>
                    {isConnected ? 'Connected' : 'Connect your account'}
                  </p>
                </div>
              </div>
            </div>

            <div className='p-6 space-y-4'>
              {isConnected ? (
                <div className='space-y-4'>
                  <div className='flex items-center gap-3 rounded-2xl bg-green-50 p-4'>
                    <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                    <p className='text-sm text-green-800'>
                      Your Telegram account is linked. You can log in with Telegram and receive notifications there.
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    className='w-full border-red-200 text-red-600 hover:bg-red-50'
                    onClick={handleDisconnect}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : null}
                    Disconnect Telegram
                  </Button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <p className='text-sm text-gray-600'>
                    Link your Telegram account to log in faster and receive event notifications via Telegram.
                  </p>
                  {isLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Loader2 className='h-6 w-6 animate-spin text-[#2AABEE]' />
                    </div>
                  ) : TELEGRAM_BOT_USERNAME ? (
                    <div ref={widgetContainerRef} className='flex justify-center' />
                  ) : (
                    <p className='text-center text-sm text-gray-400'>Telegram not configured.</p>
                  )}
                </div>
              )}
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
