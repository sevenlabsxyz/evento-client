'use client';

import EventVisibilitySheet from '@/components/create-event/event-visibility-sheet';
import PasswordProtectionSheet from '@/components/create-event/password-protection-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { Switch } from '@/components/ui/switch';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useUpdateEvent } from '@/lib/hooks/use-update-event';
import { useUpdateRegistrationSettings } from '@/lib/hooks/use-update-registration-settings';
import { apiEventSchema } from '@/lib/schemas/event';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { ChevronRight, EyeOff, Globe, Lock, ShieldCheck, ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DEFAULT_REGISTRATION_VISIBILITY = {
  hide_location_for_unapproved: true,
  hide_guest_list_for_unapproved: true,
  hide_description_for_unapproved: false,
};

export default function SecurityPrivacyPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const updateEventMutation = useUpdateEvent();
  const updateRegistrationSettingsMutation = useUpdateRegistrationSettings();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();

  const { data: eventData, isLoading, error } = useEventDetails(eventId);
  const { data: registrationSettings } = useRegistrationSettings(eventId);

  const {
    visibility,
    passwordProtected,
    password,
    setVisibility,
    setPasswordProtection,
    populateFromApiEvent,
    isValid,
    hasChanges,
  } = useEventFormStore();

  const [showVisibilitySheet, setShowVisibilitySheet] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [hideLocationForUnapproved, setHideLocationForUnapproved] = useState<boolean>(
    DEFAULT_REGISTRATION_VISIBILITY.hide_location_for_unapproved
  );
  const [hideGuestListForUnapproved, setHideGuestListForUnapproved] = useState<boolean>(
    DEFAULT_REGISTRATION_VISIBILITY.hide_guest_list_for_unapproved
  );
  const [hideDescriptionForUnapproved, setHideDescriptionForUnapproved] = useState<boolean>(
    DEFAULT_REGISTRATION_VISIBILITY.hide_description_for_unapproved
  );
  const [hideGuestListEntirely, setHideGuestListEntirely] = useState<boolean>(false);

  const isRegistrationMode = eventData?.type === 'registration';

  const hasVisibilitySettingsChanges =
    hideLocationForUnapproved !==
      (registrationSettings?.hide_location_for_unapproved ??
        DEFAULT_REGISTRATION_VISIBILITY.hide_location_for_unapproved) ||
    hideGuestListForUnapproved !==
      (registrationSettings?.hide_guest_list_for_unapproved ??
        DEFAULT_REGISTRATION_VISIBILITY.hide_guest_list_for_unapproved) ||
    hideDescriptionForUnapproved !==
      (registrationSettings?.hide_description_for_unapproved ??
        DEFAULT_REGISTRATION_VISIBILITY.hide_description_for_unapproved);

  const hasHideGuestListEntirelyChanges =
    hideGuestListEntirely !== (eventData?.visibility_settings?.is_guest_list_visible === false);

  const hasEventChanges = isValid() && hasChanges();
  const isFormValid =
    hasEventChanges ||
    hasHideGuestListEntirelyChanges ||
    (isRegistrationMode && hasVisibilitySettingsChanges);

  useEffect(() => {
    setHideLocationForUnapproved(
      registrationSettings?.hide_location_for_unapproved ??
        DEFAULT_REGISTRATION_VISIBILITY.hide_location_for_unapproved
    );
    setHideGuestListForUnapproved(
      registrationSettings?.hide_guest_list_for_unapproved ??
        DEFAULT_REGISTRATION_VISIBILITY.hide_guest_list_for_unapproved
    );
    setHideDescriptionForUnapproved(
      registrationSettings?.hide_description_for_unapproved ??
        DEFAULT_REGISTRATION_VISIBILITY.hide_description_for_unapproved
    );
  }, [
    registrationSettings?.hide_location_for_unapproved,
    registrationSettings?.hide_guest_list_for_unapproved,
    registrationSettings?.hide_description_for_unapproved,
  ]);

  useEffect(() => {
    setHideGuestListEntirely(eventData?.visibility_settings?.is_guest_list_visible === false);
  }, [eventData?.visibility_settings?.is_guest_list_visible]);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('security.title'),
      leftMode: 'back',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, pathname, applyRouteConfig, clearRoute, router, eventId, t]);

  useEffect(() => {
    if (eventData) {
      try {
        const validatedEvent = apiEventSchema.parse(eventData);
        populateFromApiEvent(validatedEvent);
      } catch (validationError) {
        logger.error('Failed to validate event data for security settings', {
          error:
            validationError instanceof Error ? validationError.message : String(validationError),
        });
      }
    }
  }, [eventData, populateFromApiEvent]);

  const handleSaveChanges = async () => {
    try {
      if (hasEventChanges) {
        await updateEventMutation.mutateAsync({
          id: eventId,
          visibility,
          password_protected: passwordProtected,
          password: passwordProtected ? (password ?? undefined) : undefined,
        });
      }

      if (isRegistrationMode && hasVisibilitySettingsChanges) {
        await updateRegistrationSettingsMutation.mutateAsync({
          eventId,
          hide_location_for_unapproved: hideLocationForUnapproved,
          hide_guest_list_for_unapproved: hideGuestListForUnapproved,
          hide_description_for_unapproved: hideDescriptionForUnapproved,
        });
      }

      if (hasHideGuestListEntirelyChanges) {
        await updateEventMutation.mutateAsync({
          id: eventId,
          settings: { is_guest_list_visible: !hideGuestListEntirely },
        });
      }

      toast.success(t('security.toasts.updated'));
      router.push(`/e/${eventId}/manage`);
    } catch (saveError) {
      toast.error(t('security.toasts.updateFailed'));
      logger.error('Failed to update security settings', {
        error: saveError instanceof Error ? saveError.message : String(saveError),
      });
    }
  };

  if (isLoading) {
    return (
      <div className='max-w-2xl py-4 md:py-6'>
        <div className='space-y-4'>
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
            >
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <div className='flex-1'>
                  <Skeleton className='mb-2 h-4 w-36' />
                  <Skeleton className='h-6 w-32' />
                </div>
                <Skeleton className='h-4 w-4' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('security.notFound.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('security.notFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('security.notFound.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
          {t('security.heading')}
        </h2>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('security.description')}</p>
      </div>

      <div className='max-w-2xl space-y-4'>
        {/* Visibility */}
        <section className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='px-4 pt-4'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {t('security.visibility.title')}
            </h3>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              {t('security.visibility.description')}
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowVisibilitySheet(true)}
              className='flex w-full items-center gap-4 p-4 text-left'
            >
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800'>
                {visibility === 'public' ? (
                  <Globe className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
                ) : (
                  <Lock className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
                )}
              </div>
              <div className='flex-1'>
                <label className='mb-1 block text-sm font-medium text-gray-500 dark:text-neutral-400'>
                  {t('security.visibility.eventVisibility')}
                </label>
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-gray-900 dark:text-neutral-100'>
                    {visibility === 'public' ? tCommon('labels.public') : tCommon('labels.private')}
                  </span>
                  <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
                </div>
              </div>
            </button>

            {isRegistrationMode && (
              <>
                <div className='mx-4 border-t border-gray-100 dark:border-neutral-800' />
                <div className='p-4'>
                  <div className='mb-3 flex items-start gap-4'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800'>
                      <EyeOff className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
                        {t('security.registrationVisibility.title')}
                      </p>
                      <p className='mt-0.5 text-xs text-gray-500 dark:text-neutral-400'>
                        {t('security.registrationVisibility.description')}
                      </p>
                    </div>
                  </div>

                  <div className='overflow-hidden rounded-xl bg-gray-50 dark:bg-neutral-800'>
                    <label className='flex items-center justify-between px-4 py-3'>
                      <span className='text-sm text-gray-700 dark:text-neutral-300'>
                        {t('security.registrationVisibility.hideLocation')}
                      </span>
                      <Switch
                        checked={hideLocationForUnapproved}
                        onCheckedChange={(checked) => setHideLocationForUnapproved(checked)}
                      />
                    </label>
                    <div className='mx-4 border-t border-gray-200/60 dark:border-neutral-800/60' />
                    <label className='flex items-center justify-between px-4 py-3'>
                      <span className='text-sm text-gray-700 dark:text-neutral-300'>
                        {t('security.registrationVisibility.hideGuestList')}
                      </span>
                      <Switch
                        checked={hideGuestListForUnapproved}
                        onCheckedChange={(checked) => setHideGuestListForUnapproved(checked)}
                      />
                    </label>
                    <div className='mx-4 border-t border-gray-200/60 dark:border-neutral-800/60' />
                    <label className='flex items-center justify-between px-4 py-3'>
                      <span className='text-sm text-gray-700 dark:text-neutral-300'>
                        {t('security.registrationVisibility.hideDescription')}
                      </span>
                      <Switch
                        checked={hideDescriptionForUnapproved}
                        onCheckedChange={(checked) => setHideDescriptionForUnapproved(checked)}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Password */}
        <section className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='px-4 pt-4'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {t('security.password.title')}
            </h3>
            <p className='text-sm text-gray-500 dark:text-neutral-400'>
              {t('security.password.description')}
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowPasswordSheet(true)}
              className='flex w-full items-center gap-4 p-4 text-left'
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${passwordProtected ? 'bg-red-100 dark:bg-red-950/60' : 'bg-gray-100 dark:bg-neutral-800'}`}
              >
                {passwordProtected ? (
                  <ShieldCheck className='h-4 w-4 text-red-600 dark:text-red-400' />
                ) : (
                  <ShieldOff className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
                )}
              </div>
              <div className='flex-1'>
                <label className='mb-1 block text-sm font-medium text-gray-500 dark:text-neutral-400'>
                  {t('security.password.protection')}
                </label>
                <div className='flex items-center justify-between'>
                  <span
                    className={`font-medium ${passwordProtected ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-neutral-100'}`}
                  >
                    {passwordProtected
                      ? t('security.password.protected')
                      : t('security.password.notProtected')}
                  </span>
                  <ChevronRight className='h-4 w-4 text-gray-400 dark:text-neutral-500' />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Guest list */}
        <section className='rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='px-4 pt-4'>
            <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {t('security.guestList.title')}
            </h3>
          </div>
          <div className='flex items-center justify-between p-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800'>
                <EyeOff className='h-4 w-4 text-gray-600 dark:text-neutral-400' />
              </div>
              <div>
                <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
                  {t('security.guestList.visibility')}
                </p>
                <p className='mt-0.5 text-xs text-gray-500 dark:text-neutral-400'>
                  {t('security.guestList.hiddenFromNonHosts')}
                </p>
              </div>
            </div>
            <Switch
              checked={hideGuestListEntirely}
              onCheckedChange={(checked) => setHideGuestListEntirely(checked)}
            />
          </div>
        </section>
      </div>

      <EventVisibilitySheet
        isOpen={showVisibilitySheet}
        onClose={() => setShowVisibilitySheet(false)}
        onVisibilitySelect={setVisibility}
        currentVisibility={visibility}
      />

      <PasswordProtectionSheet
        isOpen={showPasswordSheet}
        onClose={() => setShowPasswordSheet(false)}
        onSave={setPasswordProtection}
        isPasswordProtected={passwordProtected}
        currentPassword={password}
      />

      <div className='sticky bottom-0 z-30 -mx-4 border-t border-gray-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 dark:border-neutral-800 dark:bg-neutral-950 md:mx-0 md:px-0'>
        <div className='max-w-2xl'>
          <SubmitButton
            onClick={handleSaveChanges}
            disabled={
              !isFormValid ||
              updateEventMutation.isPending ||
              updateRegistrationSettingsMutation.isPending
            }
            loading={updateEventMutation.isPending || updateRegistrationSettingsMutation.isPending}
          >
            {tCommon('actions.save')}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
