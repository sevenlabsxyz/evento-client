'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Env } from '@/lib/constants/env';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/utils/toast';
import { CheckCircle, Loader2, Send, Unlink } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

// Match the apiClient base URL shape (lib/api/client.ts) by stripping the trailing '/api'
// so the fetch below hits `${EVENTO_API_BASE}/api/v1/user/telegram/link`.
const EVENTO_API_BASE = Env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
const BOT_USERNAME = Env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function TelegramConnectSheet({
  open,
  onOpenChange,
  isConnected,
  onConnectionChange,
}: TelegramConnectSheetProps) {
  const t = useTranslations('settings');
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
        const {
          data: { session },
        } = await createClient().auth.getSession();
        const token = session?.access_token;

        if (!token) {
          throw new Error(t('telegram.noSession'));
        }

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
          throw new Error(body?.error ?? t('telegram.linkFailed'));
        }

        toast.success(t('telegram.connectedToast'));
        onConnectionChange?.();
        if (user) setUser({ ...user, telegram_id: Number(telegramUser.id) });
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('telegram.connectFailed'));
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
  }, [open, isConnected, onOpenChange, onConnectionChange, user, setUser, t]);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const {
        data: { session },
      } = await createClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error(t('telegram.noSession'));
      }

      const res = await fetch(`${EVENTO_API_BASE}/api/v1/user/telegram/link`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(t('telegram.disconnectFailed'));

      toast.success(t('telegram.disconnectedToast'));
      onConnectionChange?.();
      if (user) setUser({ ...user, telegram_id: null });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('telegram.disconnectFailed'));
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
            <div className='border-b border-gray-100 p-4 dark:border-neutral-800'>
              <div className='mb-4 flex justify-center'>
                <SheetWithDetentFull.Handle />
              </div>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#2AABEE]'>
                  <Send className='h-5 w-5 text-white' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-gray-900 dark:text-neutral-100'>
                    Telegram
                  </h2>
                  <p className='text-sm text-gray-500 dark:text-neutral-400'>
                    {isConnected ? t('telegram.subtitleConnected') : t('telegram.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent className='p-6'>
                  {isConnected ? (
                    <div className='space-y-6'>
                      <div className='flex items-center gap-3 rounded-2xl bg-green-50 p-4 dark:bg-green-950/40'>
                        <CheckCircle className='h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400' />
                        <p className='text-sm text-green-800 dark:text-green-400'>
                          {t('telegram.connectedBody')}
                        </p>
                      </div>
                      <Button
                        variant='secondary'
                        className='w-full rounded-xl border border-red-200 py-4 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40'
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            {t('telegram.disconnecting')}
                          </>
                        ) : (
                          <>
                            <Unlink className='mr-2 h-4 w-4' />
                            {t('telegram.disconnect')}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className='space-y-6'>
                      <p className='text-sm text-gray-600 dark:text-neutral-400'>
                        {t('telegram.connectBody')}
                      </p>
                      <div className='flex min-h-[56px] items-center justify-center'>
                        {!widgetLoaded && (
                          <Loader2 className='h-6 w-6 animate-spin text-gray-400 dark:text-neutral-500' />
                        )}
                        <div
                          ref={widgetContainerRef}
                          className={widgetLoaded ? 'block' : 'hidden'}
                        />
                      </div>
                      {!BOT_USERNAME && (
                        <p className='text-center text-xs text-red-500 dark:text-red-400'>
                          {t('telegram.notConfigured', {
                            variable: 'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME',
                          })}
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
