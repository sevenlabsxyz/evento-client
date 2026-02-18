'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import type { Event as ApiEvent, RSVPStatus, UserRegistration } from '@/lib/types/api';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DetachedSheet } from '../ui/detached-sheet';
import ContributionPaymentSheet from './contribution-payment-sheet';
import { RegistrationForm } from './registration-form';
import { RegistrationStatus } from './registration-status';

type SheetView = 'rsvp-buttons' | 'registration-form' | 'registration-status';

interface RsvpSheetProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  eventData?: ApiEvent | null;
}

export default function RsvpSheet({ eventId, isOpen, onClose, eventData }: RsvpSheetProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // RSVP data
  const { data: rsvpData, isLoading: isLoadingRsvp } = useUserRSVP(eventId);
  const { data: eventRsvps } = useEventRSVPs(eventId);
  const upsert = useUpsertRSVP();

  // Registration data
  const { data: registrationSettings, isLoading: isLoadingSettings } =
    useRegistrationSettings(eventId);
  const { data: myRegistration, isLoading: isLoadingMyRegistration } = useMyRegistration(eventId);

  const [showContributionSheet, setShowContributionSheet] = useState(false);
  const [currentView, setCurrentView] = useState<SheetView>('rsvp-buttons');
  const [pendingRegistration, setPendingRegistration] = useState<UserRegistration | null>(null);

  const currentStatus = rsvpData?.status ?? null;
  const hasExisting = !!rsvpData?.rsvp;

  const hasContributions = useMemo(() => {
    if (!eventData) return false;
    const methods = getContributionMethods(eventData);
    return methods.length > 0;
  }, [eventData]);

  const registrationRequired =
    eventData?.type !== undefined
      ? eventData.type !== 'rsvp'
      : (registrationSettings?.registration_required ?? false);
  const hasExistingRegistration = myRegistration?.has_registration ?? false;
  const existingRegistration = myRegistration?.registration ?? null;

  const isLoading = isLoadingRsvp || isLoadingSettings || isLoadingMyRegistration;
  const maxCapacity = eventData?.max_capacity ?? null;
  const showCapacityCount = Boolean(eventData?.show_capacity_count);
  const yesRsvpCount = useMemo(
    () => (eventRsvps ?? []).filter((rsvp) => rsvp.status === 'yes').length,
    [eventRsvps]
  );
  const isEventFull = maxCapacity !== null && yesRsvpCount >= maxCapacity;
  const spotsRemaining = maxCapacity !== null ? Math.max(0, maxCapacity - yesRsvpCount) : null;
  const isYesRsvp = currentStatus === 'yes';
  const shouldDisableYes = isEventFull && !isYesRsvp;

  // Determine what to show when sheet opens
  const getInitialView = (): SheetView => {
    // If user has an existing registration, show its status
    if (hasExistingRegistration && existingRegistration) {
      // If approved, show RSVP buttons
      if (existingRegistration.approval_status === 'approved') {
        return 'rsvp-buttons';
      }
      // If pending or denied, show status
      return 'registration-status';
    }
    // Otherwise show RSVP buttons (which will handle registration flow)
    return 'rsvp-buttons';
  };

  // Reset view when sheet opens
  const handleSheetOpenChange = (presented: boolean) => {
    if (!presented) {
      onClose();
      // Reset view and pending registration on close
      setTimeout(() => {
        setCurrentView('rsvp-buttons');
        setPendingRegistration(null);
      }, 300);
    } else {
      setCurrentView(getInitialView());
    }
  };

  const handleAction = async (status: RSVPStatus) => {
    if (status === 'yes' && shouldDisableYes) {
      toast.error('This event has reached its capacity.');
      return;
    }

    // Check if registration is required FIRST (before auth check)
    // This allows non-logged-in users to fill the registration form
    // and complete inline OTP auth during submission
    if (status === 'yes' && registrationRequired && !hasExistingRegistration) {
      setCurrentView('registration-form');
      return;
    }

    // Auth check for non-registration flows (maybe/no buttons, or already registered)
    if (!isAuthenticated) {
      const redirectUrl = `${pathname}?rsvp=${status}&eventId=${eventId}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      onClose();
      return;
    }

    // Check if user's registration is pending/denied
    if (
      status === 'yes' &&
      registrationRequired &&
      hasExistingRegistration &&
      existingRegistration?.approval_status !== 'approved'
    ) {
      setCurrentView('registration-status');
      return;
    }

    if (status === currentStatus) {
      onClose();
      return;
    }

    try {
      await upsert.mutateAsync(
        { eventId, status, hasExisting },
        {
          onSuccess: () => {
            const msg =
              status === 'yes'
                ? "You're going"
                : status === 'maybe'
                  ? 'Marked as maybe'
                  : 'You are not going';
            toast.success(msg);
            onClose();

            // After a successful "yes" RSVP, offer the contribution sheet
            if (status === 'yes' && hasContributions) {
              setShowContributionSheet(true);
            }
          },
          onError: () => {
            toast.error('Failed to update RSVP. Please try again.');
          },
        }
      );
    } catch {
      toast.error('Failed to update RSVP. Please try again.');
    }
  };

  const handleRegistrationSuccess = (autoApproved: boolean, registration?: UserRegistration) => {
    if (autoApproved) {
      // Close sheet, registration was auto-approved and RSVP created
      onClose();
    } else {
      // Store the registration data so we can display status immediately
      // without waiting for the query to refetch
      if (registration) {
        setPendingRegistration(registration);
      }
      setCurrentView('registration-status');
    }
  };

  const buttons = useMemo(
    () => [
      {
        key: 'yes' as const,
        label: currentStatus === 'yes' ? "You're going" : 'Yes',
        classes:
          currentStatus === 'yes'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-red-500 text-white hover:bg-red-600',
      },
      {
        key: 'maybe' as const,
        label: currentStatus === 'maybe' ? 'Marked maybe' : 'Maybe',
        classes:
          currentStatus === 'maybe'
            ? 'bg-black text-white hover:bg-black'
            : 'bg-black text-white hover:bg-gray-900',
      },
      {
        key: 'no' as const,
        label: currentStatus === 'no' ? 'Not going' : 'No',
        classes:
          currentStatus === 'no'
            ? 'bg-gray-400 text-white hover:bg-gray-400'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      },
    ],
    [currentStatus]
  );

  const renderLabel = (s: RSVPStatus, label: string) => {
    if (upsert.isPending) {
      return (
        <span className='inline-flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin' /> Updating...
        </span>
      );
    }
    if (currentStatus === s) {
      return (
        <span className='inline-flex items-center gap-2'>
          <Check className='h-4 w-4' /> {label}
        </span>
      );
    }
    return label;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      );
    }

    switch (currentView) {
      case 'registration-form':
        return (
          <>
            <div className='mb-4 flex items-center gap-3'>
              <button
                onClick={() => setCurrentView('rsvp-buttons')}
                className='rounded-full p-2 hover:bg-gray-100'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <h2 className='text-lg font-semibold'>Register for Event</h2>
            </div>
            <RegistrationForm
              eventId={eventId}
              questions={registrationSettings?.questions ?? []}
              onSuccess={handleRegistrationSuccess}
              onCancel={() => setCurrentView('rsvp-buttons')}
            />
          </>
        );

      case 'registration-status':
        // Use existing registration from query, or fall back to pending registration
        // from form submission (prevents flash while query refetches)
        const registrationToShow = existingRegistration || pendingRegistration;
        return (
          <>
            {registrationToShow && (
              <RegistrationStatus
                registration={registrationToShow}
                onShowRsvp={
                  registrationToShow.approval_status === 'approved'
                    ? () => setCurrentView('rsvp-buttons')
                    : undefined
                }
              />
            )}
            <button
              onClick={onClose}
              className='mt-4 w-full rounded-xl bg-gray-200 px-4 py-3 text-center font-medium text-gray-800 hover:bg-gray-300'
            >
              Close
            </button>
          </>
        );

      case 'rsvp-buttons':
      default:
        return (
          <div className='space-y-3'>
            {/* Show info if registration required but user already approved */}
            {registrationRequired &&
              hasExistingRegistration &&
              existingRegistration?.approval_status === 'approved' && (
                <div className='mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700'>
                  Your registration has been approved. Update your attendance below.
                </div>
              )}

            <button
              className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[0].classes}`}
              disabled={isLoading || upsert.isPending || shouldDisableYes}
              onClick={() => handleAction('yes')}
            >
              {shouldDisableYes ? 'NO SPOTS LEFT' : renderLabel('yes', buttons[0].label)}
            </button>
            <button
              className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[1].classes}`}
              disabled={isLoading || upsert.isPending}
              onClick={() => handleAction('maybe')}
            >
              {renderLabel('maybe', buttons[1].label)}
            </button>
            <button
              className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[2].classes}`}
              disabled={isLoading || upsert.isPending}
              onClick={() => handleAction('no')}
            >
              {renderLabel('no', buttons[2].label)}
            </button>

            {/* Show registration requirement hint */}
            {registrationRequired && !hasExistingRegistration && (
              <p className='mt-4 text-center text-sm text-gray-500'>
                This event requires registration. Clicking &quot;Yes&quot; will open the
                registration form.
              </p>
            )}

            {showCapacityCount &&
              maxCapacity !== null &&
              spotsRemaining !== null &&
              (!isEventFull || isYesRsvp) && (
                <p className='text-center text-sm text-gray-500'>
                  {isEventFull && isYesRsvp
                    ? 'No more spots left'
                    : `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`}
                </p>
              )}
          </div>
        );
    }
  };

  return (
    <>
      <DetachedSheet.Root presented={isOpen} onPresentedChange={handleSheetOpenChange}>
        <DetachedSheet.Portal>
          <DetachedSheet.View>
            <DetachedSheet.Backdrop />
            <DetachedSheet.Content>
              <div className='max-h-[80vh] overflow-y-auto p-6 pb-24'>
                <div className='mb-4 flex justify-center'>
                  <DetachedSheet.Handle />
                </div>

                <VisuallyHidden.Root asChild>
                  <DetachedSheet.Title>
                    {currentView === 'registration-form'
                      ? 'Register for Event'
                      : currentView === 'registration-status'
                        ? 'Registration Status'
                        : 'RSVP'}
                  </DetachedSheet.Title>
                </VisuallyHidden.Root>

                {renderContent()}
              </div>
            </DetachedSheet.Content>
          </DetachedSheet.View>
        </DetachedSheet.Portal>
      </DetachedSheet.Root>

      {eventData && (
        <ContributionPaymentSheet
          isOpen={showContributionSheet}
          onClose={() => setShowContributionSheet(false)}
          eventData={eventData}
        />
      )}
    </>
  );
}
