'use client';

import EventVisibilitySheet from '@/components/create-event/event-visibility-sheet';
import PasswordProtectionSheet from '@/components/create-event/password-protection-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useUpdateEvent } from '@/lib/hooks/use-update-event';
import { apiEventSchema } from '@/lib/schemas/event';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { ChevronRight, Globe, Lock, ShieldCheck, ShieldOff } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SecurityPrivacyPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const updateEventMutation = useUpdateEvent();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();

  const { data: eventData, isLoading, error } = useEventDetails(eventId);

  const {
    visibility,
    passwordProtected,
    password,
    setVisibility,
    setPasswordProtection,
    populateFromApiEvent,
    getFormData,
    isValid,
    hasChanges,
  } = useEventFormStore();

  const [showVisibilitySheet, setShowVisibilitySheet] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);

  const isFormValid = isValid() && hasChanges();

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Security & Privacy',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, pathname, applyRouteConfig, clearRoute]);

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
      const formData = getFormData();
      await updateEventMutation.mutateAsync(
        {
          ...formData,
          id: eventId,
        },
        {
          onSuccess: () => {
            toast.success('Security settings updated successfully!');
            router.push(`/e/${eventId}/manage`);
          },
          onError: () => {
            toast.error('Failed to update security settings');
          },
        }
      );
    } catch (saveError) {
      logger.error('Failed to update security settings', {
        error: saveError instanceof Error ? saveError.message : String(saveError),
      });
    }
  };

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-md'>
        <div className='space-y-4 p-4'>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className='rounded-2xl bg-gray-50 p-4'>
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
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have
            permission.
          </p>
          <button
            onClick={() => router.back()}
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
      <div className='flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 pb-32 pt-4'>
        <div className='rounded-2xl bg-white p-4'>
          <button
            onClick={() => setShowVisibilitySheet(true)}
            className='flex w-full items-center gap-4 text-left'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
              {visibility === 'public' ? (
                <Globe className='h-4 w-4 text-gray-600' />
              ) : (
                <Lock className='h-4 w-4 text-gray-600' />
              )}
            </div>
            <div className='flex-1'>
              <label className='mb-1 block text-sm font-medium text-gray-500'>
                Event Visibility
              </label>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-gray-900'>
                  {visibility === 'public' ? 'Public' : 'Private'}
                </span>
                <ChevronRight className='h-4 w-4 text-gray-400' />
              </div>
            </div>
          </button>
        </div>

        <div className='rounded-2xl bg-white p-4'>
          <button
            onClick={() => setShowPasswordSheet(true)}
            className='flex w-full items-center gap-4 text-left'
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${passwordProtected ? 'bg-red-100' : 'bg-gray-100'}`}
            >
              {passwordProtected ? (
                <ShieldCheck className='h-4 w-4 text-red-600' />
              ) : (
                <ShieldOff className='h-4 w-4 text-gray-600' />
              )}
            </div>
            <div className='flex-1'>
              <label className='mb-1 block text-sm font-medium text-gray-500'>
                Password Protection
              </label>
              <div className='flex items-center justify-between'>
                <span
                  className={`font-medium ${passwordProtected ? 'text-red-600' : 'text-gray-900'}`}
                >
                  {passwordProtected ? 'Protected' : 'Not Protected'}
                </span>
                <ChevronRight className='h-4 w-4 text-gray-400' />
              </div>
            </div>
          </button>
        </div>
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

      <div className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 md:mx-auto md:max-w-3xl md:border-l md:border-r md:border-t'>
        <div className='mx-auto max-w-full md:max-w-md'>
          <SubmitButton
            onClick={handleSaveChanges}
            disabled={!isFormValid || updateEventMutation.isPending}
            loading={updateEventMutation.isPending}
          >
            Save
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
