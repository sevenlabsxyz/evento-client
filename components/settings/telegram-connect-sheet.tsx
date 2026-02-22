'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from '@/lib/utils/toast';
import { CheckCircle, Loader2, Send, Unlink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TelegramConnectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  onConnectionChange?: () => void;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, string>) => void;
  }
}

const EVENTO_API_BASE = 'https://evento.so';
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '';

export function TelegramConnectSheet({
  open,
  onOpenChange,
  isConnected,
  onConnectionChange,
}: TelegramConnectSheetProps) {
  const { user, setUser } = useAuthStore();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  // Load Telegram Login Widget when sheet opens and Telegram is not yet linked
  useEffect(() => {
    if (!open || isConnected || !widgetContainerRef.current || !BOT_USERNAME) return;

    setWidgetLoaded(false);

    // Define the callback Telegram widget will call after auth
    window.onTelegramAuth = async (telegramUser) => {
      try {
        const token = localStorage.getItem('supabase_access_token') ?? '';
        const res = await fetch(`${EVENTO_API_BASE}/api/v1/user/telegram/link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(telegramUser),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Failed to link Telegram');
        }

        toast.success('Telegram connected!');
        onConnectionChange?.();
        if (user) setUser({ ...user, telegram_id: Number(telegramUser.id) });
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to connect Telegram');
      }
    };

    // Inject widget script
    const container = widgetContainerRef.current;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    script.onload = () => setWidgetLoaded(true);
    container.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [open, isConnected, onOpenChange, onConnectionChange, user, setUser]);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const token = localStorage.getItem('supabase_access_token') ?? '';
      const res = await fetch(`${EVENTO_API_BASE}/api/v1/user/telegram/link`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to disconnect Telegram');

      toast.success('Telegram disconnected');
      onConnectionChange?.();
      if (user) setUser({ ...user, telegram_id: null });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect Telegram');
    } finally {
      setIsDisconnecting(false);
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
                    {isConnected ? 'Your Telegram account is connected' : 'Connect your Telegram account'}
                  </p>
                </div>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {isConnected ? (
                    <div className='space-y-6'>
                      <div className='flex items-center gap-3 rounded-2xl bg-green-50 p-4'>
                        <CheckCircle className='h-5 w-5 flex-shrink-0 text-green-600' />
                        <p className='text-sm text-green-800'>
                          Telegram is connected. You can log in with Telegram and receive notifications there.
                        </p>
                      </div>
                      <Button
                        variant='secondary'
                        className='w-full rounded-xl border border-red-200 py-4 text-red-600 hover:bg-red-50'
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Disconnecting...
                          </>
                        ) : (
                          <>
                            <Unlink className='mr-2 h-4 w-4' />
                            Disconnect Telegram
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-6'>
                      <p className='text-sm text-gray-600'>
                        Connect Telegram to log in with your Telegram account and receive event notifications via Telegram.
                      </p>
                      <div className='flex min-h-[56px] items-center justify-center'>
                        {!widgetLoaded && (
                          <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
                        )}
                        <div
                          ref={widgetContainerRef}
                          className={widgetLoaded ? 'block' : 'hidden'}
                        />
                      </div>
                      {!BOT_USERNAME && (
                        <p className='text-center text-xs text-red-500'>
                          NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured.
                        </p>
                      )}
                    </div>
                  )}
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
