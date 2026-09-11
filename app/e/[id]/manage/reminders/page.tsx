'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { Switch } from '@/components/ui/switch';
import {
  FOURTH_REMINDER_ERROR,
  toggleReminderOffset,
  useEventReminders,
  useUpdateEventReminders,
} from '@/lib/hooks/use-event-reminders';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  EVENT_REMINDER_OFFSETS,
  EVENT_REMINDER_OFFSET_LABELS,
  MAX_EVENT_REMINDERS,
  type EventReminderOffset,
} from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Bell } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function offsetsMatch(left: EventReminderOffset[], right: EventReminderOffset[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((offset, index) => offset === right[index]);
}

export default function EventRemindersPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const { data, isLoading, error } = useEventReminders(eventId);
  const updateReminders = useUpdateEventReminders(eventId);
  const [selectedOffsets, setSelectedOffsets] = useState<EventReminderOffset[]>([]);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Reminders',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, pathname, applyRouteConfig, clearRoute]);

  useEffect(() => {
    if (data?.offsets) {
      setSelectedOffsets(data.offsets);
    }
  }, [data?.offsets]);

  const savedOffsets = data?.offsets ?? [];
  const hasChanges = !offsetsMatch(selectedOffsets, savedOffsets);

  const handleToggle = (offset: EventReminderOffset, checked: boolean) => {
    const isSelected = selectedOffsets.includes(offset);

    if (checked === isSelected) {
      return;
    }

    const result = toggleReminderOffset(selectedOffsets, offset);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSelectedOffsets(result.offsets);
  };

  const handleSave = async () => {
    try {
      await updateReminders.mutateAsync(selectedOffsets);
      toast.success(
        selectedOffsets.length === 0
          ? 'Guest reminders turned off'
          : 'Guest reminders updated successfully'
      );
      router.push(`/e/${eventId}/manage`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Failed to update guest reminders';
      toast.error(message);
      logger.error('Failed to update guest reminders', {
        error: saveError instanceof Error ? saveError.message : String(saveError),
      });
    }
  };

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-md'>
        <div className='space-y-4 p-4'>
          <Skeleton className='h-20 w-full rounded-2xl' />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className='rounded-2xl bg-gray-50 p-4'>
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

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Reminders unavailable</h1>
          <p className='mb-4 text-gray-600'>
            We couldn&apos;t load reminder settings for this event.
          </p>
          <button
            onClick={() => router.push(`/e/${eventId}/manage`)}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-md'>
      <div className='flex-1 space-y-6 overflow-y-auto bg-gray-50 px-4 pb-32 pt-4'>
        <div className='rounded-2xl bg-white p-4'>
          <div className='mb-3 flex items-start gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100'>
              <Bell className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <h2 className='text-base font-semibold text-gray-900'>Guest reminders</h2>
              <p className='mt-1 text-sm text-gray-500'>
                Automatically email guests who RSVP&apos;d Yes before the event starts. Choose up to{' '}
                {MAX_EVENT_REMINDERS} times. Times are relative to the event start.
              </p>
            </div>
          </div>
          <p className='text-xs text-gray-400'>
            {selectedOffsets.length} of {MAX_EVENT_REMINDERS} reminders selected
          </p>
        </div>

        {selectedOffsets.length === 0 ? (
          <div
            data-testid='reminders-empty-state'
            className='rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center'
          >
            <p className='text-sm font-medium text-gray-900'>No reminders scheduled</p>
            <p className='mt-1 text-sm text-gray-500'>
              Guests who RSVP Yes will not receive automatic reminder emails until you turn one on.
            </p>
          </div>
        ) : null}

        <div className='overflow-hidden rounded-2xl bg-white'>
          {EVENT_REMINDER_OFFSETS.map((offset, index) => {
            const checked = selectedOffsets.includes(offset);

            return (
              <div key={offset}>
                {index > 0 ? <div className='mx-4 border-t border-gray-100' /> : null}
                <label className='flex items-center justify-between p-4'>
                  <span className='text-sm font-medium text-gray-900'>
                    {EVENT_REMINDER_OFFSET_LABELS[offset]}
                  </span>
                  <Switch
                    checked={checked}
                    onCheckedChange={(nextChecked) => handleToggle(offset, nextChecked)}
                    aria-label={EVENT_REMINDER_OFFSET_LABELS[offset]}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <p className='px-1 text-xs text-gray-400'>{FOURTH_REMINDER_ERROR}.</p>
      </div>

      <div className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:rounded-t-2xl md:border md:shadow-sm'>
        <div className='mx-auto max-w-full'>
          <SubmitButton
            onClick={handleSave}
            disabled={!hasChanges || updateReminders.isPending}
            loading={updateReminders.isPending}
          >
            Save
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
