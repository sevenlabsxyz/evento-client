'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { RSVPError, useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Event as ApiEvent, RSVPStatus, UserRegistration } from '@/lib/types/api';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ContributionPaymentSheet from './contribution-payment-sheet';
import { RegistrationForm } from './registration-form';
import { RegistrationStatus } from './registration-status';

type SheetView = 'rsvp-buttons' | 'registration-form' | 'registration-status';
type RegistrationStep = 'form' | 'otp';
type RsvpPhase = 'idle' | 'fading-out' | 'loading' | 'success';

interface RsvpSheetProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  eventData?: ApiEvent | null;
}

export default function RsvpSheet({ eventId, isOpen, onClose, eventData }: RsvpSheetProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { clearAuth } = useAuthStore();
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
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('form');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [isRegistrationStepBusy, setIsRegistrationStepBusy] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<UserRegistration | null>(null);
  const [rsvpPhase, setRsvpPhase] = useState<RsvpPhase>('idle');
  const [selectedStatus, setSelectedStatus] = useState<RSVPStatus | null>(null);
  const pendingCloseRef = useRef<{ status: RSVPStatus; hasContributions: boolean } | null>(null);

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
  const authResolved = !isAuthLoading;

  const redirectToLogin = useCallback(
    (status: RSVPStatus, message?: string) => {
      clearAuth();
      if (message) {
        toast.error(message);
      }
      const redirectUrl = `${pathname}?rsvp=${status}&eventId=${eventId}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      onClose();
    },
    [clearAuth, eventId, onClose, pathname, router]
  );

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

  const resetRegistrationFlow = useCallback(() => {
    setRegistrationStep('form');
    setRegistrationEmail('');
    setIsRegistrationStepBusy(false);
  }, []);

  // Reset view when sheet opens
  const handleSheetOpenChange = (presented: boolean) => {
    if (!presented) {
      onClose();
      // Reset view and pending registration on close
      setTimeout(() => {
        setCurrentView('rsvp-buttons');
        resetRegistrationFlow();
        setPendingRegistration(null);
        setRsvpPhase('idle');
        setSelectedStatus(null);
        pendingCloseRef.current = null;
      }, 300);
    } else {
      setCurrentView(getInitialView());
      resetRegistrationFlow();
    }
  };

  const handleRegistrationStepChange = useCallback((step: RegistrationStep) => {
    setRegistrationStep(step);
  }, []);

  const handleRegistrationHeaderBack = useCallback(() => {
    if (registrationStep === 'otp') {
      setRegistrationStep('form');
      return;
    }

    resetRegistrationFlow();
    setCurrentView('rsvp-buttons');
  }, [registrationStep, resetRegistrationFlow]);

  const closeAfterSuccess = useCallback(
    (status: RSVPStatus) => {
      const msg =
        status === 'yes'
          ? "You're going"
          : status === 'maybe'
            ? 'Marked as maybe'
            : 'You are not going';
      toast.success(msg);
      onClose();

      if (status === 'yes' && hasContributions) {
        setShowContributionSheet(true);
      }
    },
    [hasContributions, onClose]
  );

  // Handle phase transitions after success
  useEffect(() => {
    if (rsvpPhase === 'success') {
      const timer = setTimeout(() => {
        if (pendingCloseRef.current) {
          closeAfterSuccess(pendingCloseRef.current.status);
          pendingCloseRef.current = null;
        }
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [rsvpPhase, closeAfterSuccess]);

  const handleAction = async (status: RSVPStatus) => {
    if (!authResolved) {
      return;
    }

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
      redirectToLogin(status);
      return;
    }

    // Check if user's registration is pending/denied
    if (
      status === 'yes' &&
      registrationRequired &&
      hasExistingRegistration &&
      existingRegistration?.approval_status !== 'approved'
    ) {
      resetRegistrationFlow();
      setCurrentView('registration-status');
      return;
    }

    if (status === currentStatus) {
      onClose();
      return;
    }

    // Start the transition: fade out buttons, then show loading
    setSelectedStatus(status);
    setRsvpPhase('fading-out');

    // After fade-out completes, start the API call with loading state
    setTimeout(async () => {
      setRsvpPhase('loading');

      try {
        await upsert.mutateAsync(
          { eventId, status, hasExisting },
          {
            onSuccess: () => {
              pendingCloseRef.current = { status, hasContributions };
              setRsvpPhase('success');
            },
            onError: (error: Error) => {
              // Check if this is an RSVPError with a redirect
              if (error instanceof RSVPError && error.redirectTo) {
                toast.error(error.message);
                router.push(error.redirectTo);
                onClose();
                return;
              }
              if (error instanceof RSVPError && error.status === 401) {
                redirectToLogin(status, 'Please sign in to RSVP.');
                return;
              }
              toast.error(error.message || 'Failed to update RSVP. Please try again.');
              setRsvpPhase('idle');
              setSelectedStatus(null);
            },
          }
        );
      } catch (error) {
        // Check if this is an RSVPError with a redirect
        if (error instanceof RSVPError && error.redirectTo) {
          const message =
            error instanceof Error ? error.message : 'Failed to update RSVP. Please try again.';
          toast.error(message);
          router.push(error.redirectTo);
          onClose();
          return;
        }
        if (error instanceof RSVPError && error.status === 401) {
          redirectToLogin(status, 'Please sign in to RSVP.');
          return;
        }
        const message =
          error instanceof Error ? error.message : 'Failed to update RSVP. Please try again.';
        toast.error(message);
        setRsvpPhase('idle');
        setSelectedStatus(null);
      }
    }, 300);
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
      resetRegistrationFlow();
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

  const renderButtonLabel = (s: RSVPStatus, label: string) => {
    if (currentStatus === s) {
      return (
        <span className='inline-flex items-center gap-2'>
          <Check className='h-4 w-4' /> {label}
        </span>
      );
    }
    return label;
  };

  const rsvpStatusLabel =
    selectedStatus === 'yes'
      ? "You're going"
      : selectedStatus === 'maybe'
        ? 'Marked as maybe'
        : 'Not going';

  const renderRsvpButtons = () => {
    const isBusy = rsvpPhase !== 'idle';
    const isActionDisabled = isLoading || isBusy || !authResolved;

    return (
      <div className='relative'>
        {/* Buttons layer - fades out when a selection is made */}
        <div
          className={`transition-opacity duration-300 ${
            rsvpPhase !== 'idle' ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className='space-y-3'>
            {registrationRequired &&
              hasExistingRegistration &&
              existingRegistration?.approval_status === 'approved' && (
                <div className='mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700'>
                  Your registration has been approved. Update your attendance below.
                </div>
              )}

            <button
              type='button'
              className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[0].classes}`}
              disabled={isActionDisabled || shouldDisableYes}
              onClick={() => handleAction('yes')}
            >
              {shouldDisableYes ? 'NO SPOTS LEFT' : renderButtonLabel('yes', buttons[0].label)}
            </button>
            <button
              type='button'
              className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[1].classes}`}
              disabled={isActionDisabled}
              onClick={() => handleAction('maybe')}
            >
              {renderButtonLabel('maybe', buttons[1].label)}
            </button>
            <button
              type='button'
              className={`w-full rounded-xl px-4 py-4 text-center text-base font-semibold ${buttons[2].classes}`}
              disabled={isActionDisabled}
              onClick={() => handleAction('no')}
            >
              {renderButtonLabel('no', buttons[2].label)}
            </button>

            {!authResolved && (
              <p className='mt-4 text-center text-sm text-gray-500'>Checking session...</p>
            )}

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
        </div>

        {/* Loading state - fades in after buttons fade out */}
        {(rsvpPhase === 'loading' || rsvpPhase === 'fading-out') && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${
              rsvpPhase === 'loading' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
            <p className='mt-3 text-sm font-medium text-gray-500'>Updating RSVP...</p>
          </div>
        )}

        {/* Success state - fades in after loading */}
        {rsvpPhase === 'success' && (
          <div className='duration-400 absolute inset-0 flex flex-col items-center justify-center animate-in fade-in'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-green-100'>
              <Check className='h-7 w-7 text-green-600' strokeWidth={3} />
            </div>
            <p className='mt-3 text-sm font-medium text-gray-700'>{rsvpStatusLabel}</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && currentView !== 'registration-form') {
      return (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
        </div>
      );
    }

    switch (currentView) {
      case 'registration-form': {
        return (
          <RegistrationForm
            eventId={eventId}
            questions={registrationSettings?.questions ?? []}
            step={registrationStep}
            onStepChange={handleRegistrationStepChange}
            onEmailChange={setRegistrationEmail}
            onStepBusyChange={setIsRegistrationStepBusy}
            onSuccess={handleRegistrationSuccess}
            onCancel={() => {
              resetRegistrationFlow();
              setCurrentView('rsvp-buttons');
            }}
          />
        );
      }

      case 'registration-status': {
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
                    ? () => {
                        resetRegistrationFlow();
                        setCurrentView('rsvp-buttons');
                      }
                    : undefined
                }
              />
            )}
            <button
              type='button'
              onClick={onClose}
              className='mt-4 w-full rounded-xl bg-gray-200 px-4 py-3 text-center font-medium text-gray-800 hover:bg-gray-300'
            >
              Close
            </button>
          </>
        );
      }

      case 'rsvp-buttons':
      default:
        return renderRsvpButtons();
    }
  };

  return (
    <>
      <MasterScrollableSheet
        title={
          currentView === 'registration-form'
            ? registrationStep === 'otp'
              ? 'Verify your email'
              : 'Register for Event'
            : 'RSVP'
        }
        open={isOpen}
        onOpenChange={handleSheetOpenChange}
        headerLeft={
          currentView === 'registration-form' ? (
            <div className='flex min-w-0 items-center gap-3'>
              <button
                type='button'
                onClick={handleRegistrationHeaderBack}
                disabled={isRegistrationStepBusy}
                className='flex-shrink-0 rounded-full p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <div className='min-w-0'>
                <h2 className='truncate text-lg font-semibold text-gray-900'>
                  {registrationStep === 'otp' ? 'Verify your email' : 'Register for Event'}
                </h2>
                {registrationStep === 'otp' && (
                  <p className='truncate text-sm text-gray-500'>
                    Code sent to{' '}
                    <span className='font-medium text-gray-700'>{registrationEmail}</span>
                  </p>
                )}
              </div>
            </div>
          ) : undefined
        }
        contentClassName='px-4 pb-6 pt-0'
      >
        {renderContent()}
      </MasterScrollableSheet>

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
