'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { Switch } from '@/components/ui/switch';
import {
  toggleReminderOffset,
  useEventReminders,
  useUpdateEventReminders,
} from '@/lib/hooks/use-event-reminders';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  EVENT_REMINDER_OFFSETS,
  MAX_EVENT_REMINDERS,
  type ApiError,
  type EventReminderOffset,
} from '@/lib/types/api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function offsetsMatch(left: EventReminderOffset[], right: EventReminderOffset[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((offset, index) => offset === right[index]);
}

const OFFSET_LABEL_KEYS = {
  '1h': 'reminders.offsets.oneHour',
  '2h': 'reminders.offsets.twoHours',
  '3h': 'reminders.offsets.threeHours',
  '8h': 'reminders.offsets.eightHours',
  '1d': 'reminders.offsets.oneDay',
  '3d': 'reminders.offsets.threeDays',
} as const satisfies Record<EventReminderOffset, string>;

export default function EventRemindersPage() {
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const { data, isLoading, error } = useEventReminders(eventId);
  const updateReminders = useUpdateEventReminders(eventId);
  const [selectedOffsets, setSelectedOffsets] = useState<EventReminderOffset[]>([]);
  const hasInitializedSelection = useRef(false);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('reminders.topBarTitle'),
      leftMode: 'back',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, pathname, applyRouteConfig, clearRoute, router, eventId, t]);

  // Only seed local state on first load. Background refetches must not
  // overwrite toggles the host has not saved yet.
  useEffect(() => {
    if (hasInitializedSelection.current || !data?.offsets) {
      return;
    }

    hasInitializedSelection.current = true;
    setSelectedOffsets(data.offsets);
  }, [data?.offsets]);

  const isForbidden = (error as ApiError | null)?.status === 403;

  useEffect(() => {
    if (isForbidden) {
      router.replace(`/e/${eventId}`);
    }
  }, [isForbidden, router, eventId]);

  const savedOffsets = data?.offsets ?? [];
  const hasChanges = !offsetsMatch(selectedOffsets, savedOffsets);

  const handleToggle = (offset: EventReminderOffset, checked: boolean) => {
    const isSelected = selectedOffsets.includes(offset);

    if (checked === isSelected) {
      return;
    }

    const result = toggleReminderOffset(selectedOffsets, offset);

    if (result.error) {
      toast.error(t('reminders.maxReached', { max: MAX_EVENT_REMINDERS }));
      return;
    }

    setSelectedOffsets(result.offsets);
  };

  const handleSave = async () => {
    try {
      await updateReminders.mutateAsync(selectedOffsets);
      toast.success(
        selectedOffsets.length === 0
          ? t('reminders.toasts.turnedOff')
          : t('reminders.toasts.updated')
      );
      router.push(`/e/${eventId}/manage`);
    } catch (saveError) {
      const status = (saveError as ApiError)?.status;
      const message =
        status === 404
          ? t('reminders.toasts.notAvailable')
          : getErrorMessage(saveError) || t('reminders.toasts.updateFailed');

      toast.error(message);
      logger.error('Failed to update guest reminders', {
        error: getErrorMessage(saveError),
      });
    }
  };

  if (isLoading) {
    return (
      <div className='max-w-2xl py-4 md:py-6'>
        <div className='space-y-4'>
          <Skeleton className='h-20 w-full rounded-2xl' />
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
            >
              <div className='flex items-center justify-between'>
                <Skeleton className='h-4 w-36' />
                <Skeleton className='h-6 w-11 rounded-full' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return null;
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('reminders.error.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('reminders.error.description')}
          </p>
          <button
            onClick={() => router.push(`/e/${eventId}/manage`)}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('reminders.goBack')}
          </button>
        </div>
      </div>
    );
  }

  if (data?.available === false) {
    return (
      <div data-testid='reminders-unavailable' className='flex items-center justify-center py-16'>
        <div className='max-w-sm text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('reminders.unavailable.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('reminders.unavailable.description')}
          </p>
          <button
            onClick={() => router.push(`/e/${eventId}/manage`)}
            className='rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
          >
            {t('reminders.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 py-4 md:py-6'>
      <div>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
          {t('reminders.heading')}
        </h2>
        <p className='text-sm text-gray-500 dark:text-neutral-400'>{t('reminders.subtitle')}</p>
      </div>

      <div className='max-w-2xl space-y-4'>
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mb-3 flex items-start gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60'>
              <Bell className='h-5 w-5 text-amber-600 dark:text-amber-400' />
            </div>
            <div>
              <h3 className='text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {t('reminders.guestReminders.title')}
              </h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
                {t('reminders.guestReminders.description', { max: MAX_EVENT_REMINDERS })}
              </p>
            </div>
          </div>
          <p className='text-xs text-gray-400 dark:text-neutral-400'>
            {t('reminders.selectedCount', {
              count: selectedOffsets.length,
              max: MAX_EVENT_REMINDERS,
            })}
          </p>
        </div>

        {selectedOffsets.length === 0 ? (
          <div
            data-testid='reminders-empty-state'
            className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900'
          >
            <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
              {t('reminders.empty.title')}
            </p>
            <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>
              {t('reminders.empty.description')}
            </p>
          </div>
        ) : null}

        <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
          {EVENT_REMINDER_OFFSETS.map((offset, index) => {
            const checked = selectedOffsets.includes(offset);
            const label = t(OFFSET_LABEL_KEYS[offset]);

            return (
              <div key={offset}>
                {index > 0 ? (
                  <div className='mx-4 border-t border-gray-100 dark:border-neutral-800' />
                ) : null}
                <div className='flex items-center justify-between p-4'>
                  <span className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
                    {label}
                  </span>
                  <Switch
                    checked={checked}
                    onCheckedChange={(nextChecked) => handleToggle(offset, nextChecked)}
                    aria-label={label}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className='px-1 text-xs text-gray-400 dark:text-neutral-400'>
          {t('reminders.maxHint', { max: MAX_EVENT_REMINDERS })}
        </p>
      </div>

      <div className='sticky bottom-0 z-30 -mx-4 border-t border-gray-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 dark:border-neutral-800 dark:bg-neutral-950 md:mx-0 md:px-0'>
        <div className='max-w-2xl'>
          <SubmitButton
            onClick={handleSave}
            disabled={!hasChanges || updateReminders.isPending}
            loading={updateReminders.isPending}
          >
            {tCommon('actions.save')}
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
