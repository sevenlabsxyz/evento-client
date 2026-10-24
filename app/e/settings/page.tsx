'use client';

import { ContactSheet } from '@/components/settings/contact-sheet';
import { DeveloperModeDialog } from '@/components/settings/developer-mode-dialog';
import { TelegramConnectSheet } from '@/components/settings/telegram-connect-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth, useRequireAuth } from '@/lib/hooks/use-auth';
import { useDeveloperSettingsStore } from '@/lib/stores/developer-settings-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import {
  CheckCircle,
  ChevronRight,
  DollarSign,
  Info,
  Key,
  Languages,
  Mail,
  Moon,
  Scale,
  Send,
  Share,
  Shield,
  Sun,
  Terminal,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { user, checkAuth } = useAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Developer mode state
  const { isDeveloperMode, setDeveloperMode } = useDeveloperSettingsStore();
  const [developerDialogOpen, setDeveloperDialogOpen] = useState(false);

  // Telegram connect state
  const [telegramSheetOpen, setTelegramSheetOpen] = useState(false);
  const isTelegramConnected = Boolean(user?.telegram_id);

  // Set TopBar content
  useEffect(() => {
    // Apply any existing route configuration first
    applyRouteConfig(pathname);

    // Set route-specific configuration
    setTopBarForRoute(pathname, {
      title: 'Settings',
      subtitle: undefined,
      showAvatar: false,
      leftMode: 'back',
      centerMode: 'title',
    });

    // Cleanup function to clear route config when leaving this page
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, applyRouteConfig, clearRoute]);

  // Sheet states
  const [contactSheetOpen, setContactSheetOpen] = useState(false);

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Evento - Travel Events App',
      text: 'Check out Evento, the best way to plan and organize your travel events!',
      url: 'https://evento.so',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText('https://evento.so');
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      // If sharing fails or is cancelled, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText('https://evento.so');
        toast.success('Link copied to clipboard!');
      } catch (clipboardError) {
        toast.error('Unable to share. Please copy the link manually: evento.so');
      }
    }
  };

  const handleDeveloperModeToggle = (checked: boolean) => {
    if (checked) {
      // If turning ON, show confirmation dialog
      setDeveloperDialogOpen(true);
    } else {
      // If turning OFF, just do it
      setDeveloperMode(false);
      toast.success('Developer Mode disabled');
    }
  };

  const confirmDeveloperMode = () => {
    setDeveloperMode(true);
    setDeveloperDialogOpen(false);
    toast.success('Developer Mode enabled');
  };

  if (isCheckingAuth) {
    return (
      <div className='flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-3xl md:px-4'>
        <div className='flex-1 overflow-y-auto bg-white px-0 pt-4 dark:bg-neutral-900'>
          <div>
            {/* GENERAL */}
            <div className='mb-2 px-4'>
              <Skeleton className='h-3 w-24' />
            </div>
            <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
              <div className='border-b border-gray-100 dark:border-neutral-800'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-lg' />
                    <Skeleton className='h-4 w-28' />
                  </div>
                  <Skeleton className='h-4 w-16' />
                </div>
              </div>
              <div className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-lg' />
                    <Skeleton className='h-4 w-24' />
                  </div>
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            </div>

            {/* HELP CENTER */}
            <div className='mb-2 px-4'>
              <Skeleton className='h-3 w-28' />
            </div>
            <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
              <div className='border-b border-gray-100 dark:border-neutral-800'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-lg' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <Skeleton className='h-4 w-4 rounded' />
                </div>
              </div>
              <div className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-8 w-8 rounded-lg' />
                    <Skeleton className='h-4 w-28' />
                  </div>
                  <Skeleton className='h-4 w-4 rounded' />
                </div>
              </div>
            </div>

            {/* ABOUT */}
            <div className='mb-2 px-4'>
              <Skeleton className='h-3 w-16' />
            </div>
            <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`p-4 ${i < 3 ? 'border-b border-gray-100 dark:border-neutral-800' : ''}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-8 w-8 rounded-lg' />
                      <Skeleton className='h-4 w-36' />
                    </div>
                    <Skeleton className='h-4 w-4 rounded' />
                  </div>
                </div>
              ))}
            </div>

            {/* Version */}
            <div className='px-4 pb-24 pt-6 text-center'>
              <Skeleton className='mx-auto h-4 w-28' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen max-w-full flex-col bg-white dark:bg-neutral-900 md:max-w-3xl md:px-4'>
      {/* Content */}
      <div className='flex-1 overflow-y-auto bg-white px-0 pt-4 dark:bg-neutral-900'>
        <div>
          {/* APPEARANCE Section */}
          <div className='mb-2 px-4'>
            <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              APPEARANCE
            </h2>
          </div>
          <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
            <div className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-neutral-700'>
                    {isDark ? (
                      <Moon className='h-4 w-4 text-gray-700 dark:text-neutral-300' />
                    ) : (
                      <Sun className='h-4 w-4 text-gray-700 dark:text-neutral-300' />
                    )}
                  </div>
                  <div>
                    <span className='font-medium'>Dark mode</span>
                    <p className='text-xs text-gray-500 dark:text-neutral-400'>
                      Use a darker palette across Evento.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  disabled={!mounted}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  aria-label='Dark mode'
                />
              </div>
            </div>
          </div>

          {/* GENERAL Section */}
          <div className='mb-2 px-4'>
            <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              GENERAL
            </h2>
          </div>
          <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
            <div className='border-b border-gray-100 p-4 dark:border-neutral-800'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <Languages className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>Language</span>
                </div>
                <div>
                  <span className='text-gray-500 dark:text-neutral-400'>English</span>
                </div>
              </div>
            </div>

            <div className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <DollarSign className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>Currency</span>
                </div>
                <div>
                  <span className='text-gray-500 dark:text-neutral-400'>US Dollar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Section */}
          <div className='mb-2 px-4'>
            <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              ACCOUNTS
            </h2>
          </div>
          <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
            <button
              className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
              onClick={() => setTelegramSheetOpen(true)}
            >
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF7FD] dark:bg-[#2AABEE]/15'>
                  <Send className='h-4 w-4 text-[#2AABEE]' />
                </div>
                <span className='font-medium'>Telegram</span>
              </div>
              {isTelegramConnected ? (
                <div className='flex items-center gap-1 text-sm text-green-600 dark:text-green-400'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Connected</span>
                </div>
              ) : (
                <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
              )}
            </button>
          </div>

          {/* Help Center Section */}
          <div className='mb-2 px-4'>
            <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              HELP CENTER
            </h2>
          </div>
          <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
            <div className='border-b border-gray-100 dark:border-neutral-800'>
              <button
                className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                onClick={() => setContactSheetOpen(true)}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <Mail className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>Talk to us</span>
                </div>
                <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
              </button>
            </div>
          </div>

          {/* About Section */}
          <div className='mb-2 px-4'>
            <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              ABOUT
            </h2>
          </div>
          <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
            <div className='border-b border-gray-100 dark:border-neutral-800'>
              <button
                className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                onClick={() => handleExternalLink('https://evento.so')}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <Info className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>About Evento</span>
                </div>
                <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
              </button>
            </div>

            <div className='border-b border-gray-100 dark:border-neutral-800'>
              <button
                className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                onClick={() => handleExternalLink('https://evento.so/terms')}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <Scale className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>Terms of Service</span>
                </div>
                <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
              </button>
            </div>

            <div className='border-b border-gray-100 dark:border-neutral-800'>
              <button
                className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                onClick={() => handleExternalLink('https://evento.so/privacy')}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <Shield className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>Privacy Policy</span>
                </div>
                <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
              </button>
            </div>

            <div>
              <button
                className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                onClick={handleShare}
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                    <Share className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium'>Share to a Friend</span>
                </div>
                <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
              </button>
            </div>
          </div>

          {/* Advanced Section */}
          <div className='mb-2 px-4'>
            <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
              ADVANCED
            </h2>
          </div>
          <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
            <div className='border-b border-gray-100 dark:border-neutral-800'>
              <div className='flex w-full items-center justify-between p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800'>
                    <Terminal className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
                  </div>
                  <span className='font-medium'>Developer Mode</span>
                </div>
                <Switch checked={isDeveloperMode} onCheckedChange={handleDeveloperModeToggle} />
              </div>
            </div>
          </div>

          {/* Developer Section - conditionally rendered */}
          {isDeveloperMode && (
            <>
              <div className='mb-2 px-4'>
                <h2 className='text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400'>
                  DEVELOPER
                </h2>
              </div>
              <div className='mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-950'>
                <div className='border-b border-gray-100 dark:border-neutral-800'>
                  <button
                    className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
                    onClick={() => (window.location.href = '/e/settings/api-keys')}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/60'>
                        <Key className='h-4 w-4 text-red-600 dark:text-red-400' />
                      </div>
                      <span className='font-medium'>API Keys</span>
                    </div>
                    <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sheet Components */}
      <TelegramConnectSheet
        open={telegramSheetOpen}
        onOpenChange={setTelegramSheetOpen}
        isConnected={isTelegramConnected}
        onConnectionChange={() => checkAuth()}
      />
      <ContactSheet open={contactSheetOpen} onOpenChange={setContactSheetOpen} />

      {/* Developer Mode Confirmation Dialog */}
      <DeveloperModeDialog
        open={developerDialogOpen}
        onOpenChange={setDeveloperDialogOpen}
        onConfirm={confirmDeveloperMode}
      />
    </div>
  );
}
