'use client';

import {
  SETTINGS_ROW_INTERACTIVE_CLASS,
  SettingsChevron,
  SettingsRowContent,
} from '@/components/settings/settings-list';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { type AppLocale, isAppLocale, LOCALE_LABELS, LOCALES } from '@/i18n/config';
import { useChangeLocale } from '@/lib/i18n/use-change-locale';
import { cn } from '@/lib/utils';
import { Check, Languages, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { forwardRef, useState } from 'react';

interface LanguageRowTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  currentLabel: string;
  isPending: boolean;
}

const LanguageRowTrigger = forwardRef<HTMLButtonElement, LanguageRowTriggerProps>(
  ({ currentLabel, isPending, className, ...props }, ref) => {
    const t = useTranslations('settings');

    return (
      <button
        {...props}
        ref={ref}
        type='button'
        disabled={isPending}
        aria-busy={isPending}
        className={cn(SETTINGS_ROW_INTERACTIVE_CLASS, className)}
      >
        <SettingsRowContent
          icon={Languages}
          label={t('rows.language.label')}
          description={t('rows.language.description')}
          trailing={
            <>
              {isPending ? (
                <>
                  <span className='sr-only'>{t('rows.language.changing')}</span>
                  <Loader2
                    className='h-4 w-4 animate-spin text-gray-400 dark:text-neutral-500'
                    aria-hidden='true'
                  />
                </>
              ) : (
                <span className='text-sm text-gray-500 dark:text-neutral-400'>{currentLabel}</span>
              )}
              <SettingsChevron />
            </>
          }
        />
      </button>
    );
  }
);
LanguageRowTrigger.displayName = 'LanguageRowTrigger';

/**
 * Preferences row for the interface language: a dropdown on desktop and a
 * detached bottom sheet on mobile. Choosing a language stores it in the locale
 * cookie and refreshes so every message re-renders in that language.
 */
export function LanguageSetting() {
  const t = useTranslations('settings');
  const activeLocale = useLocale();
  const currentLocale: AppLocale = isAppLocale(activeLocale) ? activeLocale : 'en';
  const { changeLocale, isPending } = useChangeLocale();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const selectLocale = (locale: AppLocale) => {
    setIsSheetOpen(false);
    if (locale !== currentLocale) changeLocale(locale);
  };

  const currentLabel = LOCALE_LABELS[currentLocale];

  if (isMobile) {
    return (
      // Single wrapper so the sheet root never picks up the card's row divider.
      <div>
        <LanguageRowTrigger
          currentLabel={currentLabel}
          isPending={isPending}
          aria-haspopup='dialog'
          onClick={() => setIsSheetOpen(true)}
        />
        <DetachedSheet.Root
          presented={isSheetOpen}
          onPresentedChange={(presented) => !presented && setIsSheetOpen(false)}
        >
          <DetachedSheet.Portal>
            <DetachedSheet.View>
              <DetachedSheet.Backdrop />
              <DetachedSheet.Content>
                <div className='p-6 pb-24'>
                  <div className='mb-4 flex justify-center'>
                    <DetachedSheet.Handle />
                  </div>
                  <DetachedSheet.Title className='mb-6 text-center text-lg font-semibold text-gray-900 dark:text-neutral-100'>
                    {t('rows.language.selectTitle')}
                  </DetachedSheet.Title>
                  <div
                    role='radiogroup'
                    aria-label={t('rows.language.label')}
                    className='space-y-2'
                  >
                    {LOCALES.map((locale) => {
                      const isActive = locale === currentLocale;
                      return (
                        <button
                          key={locale}
                          type='button'
                          role='radio'
                          aria-checked={isActive}
                          lang={locale}
                          onClick={() => selectLocale(locale)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                            isActive
                              ? 'border-gray-900 bg-gray-50 text-gray-900 dark:border-neutral-100 dark:bg-neutral-800 dark:text-neutral-100'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800/70'
                          )}
                        >
                          {LOCALE_LABELS[locale]}
                          {isActive && <Check className='h-5 w-5' aria-hidden='true' />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </DetachedSheet.Content>
            </DetachedSheet.View>
          </DetachedSheet.Portal>
        </DetachedSheet.Root>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <LanguageRowTrigger currentLabel={currentLabel} isPending={isPending} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' sideOffset={4} className='w-56 rounded-xl p-1'>
        {LOCALES.map((locale) => {
          const isActive = locale === currentLocale;
          return (
            <DropdownMenuItem
              key={locale}
              lang={locale}
              aria-current={isActive ? 'true' : undefined}
              onSelect={() => selectLocale(locale)}
              className='flex items-center justify-between gap-2 rounded-lg px-2.5 py-2'
            >
              {LOCALE_LABELS[locale]}
              {isActive && <Check className='h-4 w-4' aria-hidden='true' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
