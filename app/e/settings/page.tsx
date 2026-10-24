'use client';

import { LogoutConfirmationSheet } from '@/components/logout-confirmation-sheet';
import { ContactSheet } from '@/components/settings/contact-sheet';
import { DeveloperModeDialog } from '@/components/settings/developer-mode-dialog';
import { LanguageSetting } from '@/components/settings/language-setting';
import { SettingsRow, SettingsSection } from '@/components/settings/settings-list';
import { TelegramConnectSheet } from '@/components/settings/telegram-connect-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth, useRequireAuth } from '@/lib/hooks/use-auth';
import { useDeveloperSettingsStore } from '@/lib/stores/developer-settings-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import {
  CheckCircle,
  DollarSign,
  Info,
  Key,
  LogOut,
  Mail,
  Moon,
  Scale,
  Send,
  Share,
  Shield,
  ShieldCheck,
  Sun,
  Terminal,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const SETTINGS_PATHNAME = '/e/settings';
const EVENTO_URL = 'https://evento.so';
const PAGE_BACKGROUND_CLASS = 'min-h-full w-full bg-white dark:bg-neutral-900';
const PAGE_CONTAINER_CLASS = 'mx-auto w-full max-w-3xl px-4 pb-40 pt-6 md:px-8 md:pb-16 md:pt-10';

function SettingsPageHeader() {
  const t = useTranslations('settings');

  return (
    <header className='border-b border-gray-200 pb-8 dark:border-neutral-800'>
      <p className='text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400'>
        {t('page.eyebrow')}
      </p>
      <h1 className='mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-4xl'>
        {t('page.heading')}
      </h1>
      <p className='mt-3 text-base text-gray-600 dark:text-neutral-400'>{t('page.description')}</p>
    </header>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className={PAGE_BACKGROUND_CLASS} aria-busy='true'>
      <div className={PAGE_CONTAINER_CLASS}>
        <div className='space-y-3 border-b border-gray-200 pb-8 dark:border-neutral-800'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-9 w-64 max-w-full' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='mt-8 space-y-8'>
          {[1, 3, 2, 4].map((rowCount, sectionIndex) => (
            <div key={sectionIndex}>
              <Skeleton className='mb-3 h-3 w-24' />
              <div className='divide-y divide-gray-100 rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800'>
                {Array.from({ length: rowCount }, (_, rowIndex) => (
                  <div key={rowIndex} className='flex items-center gap-4 px-4 py-3'>
                    <Skeleton className='h-9 w-9 rounded-xl' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-48 max-w-full' />
                    </div>
                    <Skeleton className='h-4 w-4 rounded' />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { user, checkAuth, logout, isLoggingOut } = useAuth();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
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

  // Sheet states
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);

  const topBarTitle = t('page.title');

  // Mobile keeps the top bar; desktop uses the in-page header.
  useEffect(() => {
    applyRouteConfig(SETTINGS_PATHNAME);

    setTopBarForRoute(SETTINGS_PATHNAME, {
      title: topBarTitle,
      subtitle: undefined,
      showAvatar: false,
      leftMode: 'back',
      centerMode: 'title',
      desktopHidden: true,
    });

    return () => {
      clearRoute(SETTINGS_PATHNAME);
    };
  }, [topBarTitle, setTopBarForRoute, applyRouteConfig, clearRoute]);

  const handleShare = async () => {
    const shareData = {
      title: t('share.title'),
      text: t('share.text'),
      url: EVENTO_URL,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(EVENTO_URL);
        toast.success(tCommon('toasts.linkCopied'));
      }
    } catch (error) {
      // If sharing fails or is cancelled, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(EVENTO_URL);
        toast.success(tCommon('toasts.linkCopied'));
      } catch (clipboardError) {
        toast.error(t('share.failed'));
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
      toast.success(t('toasts.developerModeDisabled'));
    }
  };

  const confirmDeveloperMode = () => {
    setDeveloperMode(true);
    setDeveloperDialogOpen(false);
    toast.success(t('toasts.developerModeEnabled'));
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutSheetOpen(false);
  };

  if (isCheckingAuth) {
    return <SettingsPageSkeleton />;
  }

  const externalLabel = t('page.opensInNewTab');

  return (
    <div className={PAGE_BACKGROUND_CLASS}>
      <div className={PAGE_CONTAINER_CLASS}>
        <SettingsPageHeader />

        <div className='mt-8 space-y-8'>
          <SettingsSection title={t('sections.account')}>
            <SettingsRow
              icon={Send}
              tone='telegram'
              label={t('rows.telegram.label')}
              description={t('rows.telegram.description')}
              onClick={() => setTelegramSheetOpen(true)}
              trailing={
                isTelegramConnected ? (
                  <span className='flex items-center gap-1 text-sm text-green-600 dark:text-green-400'>
                    <CheckCircle className='h-4 w-4' aria-hidden='true' />
                    {t('rows.telegram.connected')}
                  </span>
                ) : undefined
              }
            />
          </SettingsSection>

          <SettingsSection title={t('sections.preferences')}>
            <SettingsRow
              icon={isDark ? Moon : Sun}
              label={t('rows.darkMode.label')}
              description={t('rows.darkMode.description')}
              trailing={
                <Switch
                  checked={isDark}
                  disabled={!mounted}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  aria-label={t('rows.darkMode.label')}
                />
              }
            />
            <LanguageSetting />
            <SettingsRow
              icon={DollarSign}
              label={t('rows.currency.label')}
              description={t('rows.currency.description')}
              trailing={
                <span className='text-sm text-gray-500 dark:text-neutral-400'>
                  {t('rows.currency.value')}
                </span>
              }
            />
          </SettingsSection>

          <SettingsSection title={t('sections.developer')}>
            <SettingsRow
              icon={Terminal}
              label={t('rows.developerMode.label')}
              description={t('rows.developerMode.description')}
              trailing={
                <Switch
                  checked={isDeveloperMode}
                  onCheckedChange={handleDeveloperModeToggle}
                  aria-label={t('rows.developerMode.label')}
                />
              }
            />
            {isDeveloperMode && (
              <SettingsRow
                icon={Key}
                label={t('rows.apiKeys.label')}
                description={t('rows.apiKeys.description')}
                href='/e/settings/api-keys'
              />
            )}
          </SettingsSection>

          <SettingsSection title={t('sections.support')}>
            <SettingsRow
              icon={Mail}
              label={t('rows.talkToUs.label')}
              description={t('rows.talkToUs.description')}
              onClick={() => setContactSheetOpen(true)}
            />
            <SettingsRow
              icon={Share}
              label={t('rows.share.label')}
              description={t('rows.share.description')}
              onClick={handleShare}
            />
          </SettingsSection>

          <SettingsSection title={t('sections.about')}>
            <SettingsRow
              icon={Info}
              label={t('rows.about.label')}
              description={t('rows.about.description')}
              href={EVENTO_URL}
              external
              externalLabel={externalLabel}
            />
            <SettingsRow
              icon={ShieldCheck}
              label={t('rows.security.label')}
              description={t('rows.security.description')}
              href='/e/security'
            />
            <SettingsRow
              icon={Scale}
              label={t('rows.terms.label')}
              description={t('rows.terms.description')}
              href={`${EVENTO_URL}/terms`}
              external
              externalLabel={externalLabel}
            />
            <SettingsRow
              icon={Shield}
              label={t('rows.privacy.label')}
              description={t('rows.privacy.description')}
              href={`${EVENTO_URL}/privacy`}
              external
              externalLabel={externalLabel}
            />
          </SettingsSection>

          <SettingsSection title={t('sections.dangerZone')} tone='danger'>
            <SettingsRow
              icon={LogOut}
              tone='danger'
              label={t('rows.logOut.label')}
              description={t('rows.logOut.description')}
              onClick={() => setLogoutSheetOpen(true)}
            />
          </SettingsSection>
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
      <LogoutConfirmationSheet
        isOpen={logoutSheetOpen}
        onClose={() => setLogoutSheetOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />

      {/* Developer Mode Confirmation Dialog */}
      <DeveloperModeDialog
        open={developerDialogOpen}
        onOpenChange={setDeveloperDialogOpen}
        onConfirm={confirmDeveloperMode}
      />
    </div>
  );
}
