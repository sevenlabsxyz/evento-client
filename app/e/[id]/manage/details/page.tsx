'use client';

import CapacityConfirmationSheet from '@/components/create-event/capacity-confirmation-sheet';
import CapacitySettingSheet from '@/components/create-event/capacity-setting-sheet';
import CoverImageSelector from '@/components/create-event/cover-image-selector';
import DatePickerSheet from '@/components/create-event/date-picker-sheet';
import DescriptionSheet from '@/components/create-event/description-sheet';
import ImageSelectionModal from '@/components/create-event/image-selection-modal';
import LocationSheet from '@/components/create-event/location-sheet';
import TimePickerSheet from '@/components/create-event/time-picker-sheet';
import TimezoneSheet from '@/components/create-event/timezone-sheet';
import { EmojiSelector } from '@/components/emoji-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useUpdateEvent } from '@/lib/hooks/use-update-event';
import { apiEventSchema } from '@/lib/schemas/event';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { getContentPreview, isContentEmpty } from '@/lib/utils/content';
import { debugError, debugLog } from '@/lib/utils/debug';
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/utils/event-date';
import { getLocationDisplayName } from '@/lib/utils/location';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Calendar, ChevronRight, Edit3, MapPin, Users } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditEventDetailsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const updateEventMutation = useUpdateEvent();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();

  // Fetch real event data
  const { data: eventData, isLoading, error } = useEventDetails(eventId);

  // Get state and actions from Zustand store
  const {
    title,
    description,
    coverImage,
    location,
    startDate,
    endDate,
    startTime,
    endTime,
    timezone,
    visibility,
    emoji,
    hasCapacity,
    capacity,
    showCapacityCount,
    setTitle,
    setDescription,
    setCoverImage,
    setLocation,
    setStartDate,
    setEndDate,
    setStartTime,
    setEndTime,
    setTimezone,
    setEmoji,
    setHasCapacity,
    setCapacity,
    setShowCapacityCount,
    populateFromApiEvent,
    getFormData,
    isValid,
    hasChanges,
  } = useEventFormStore();

  // Modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showCapacitySettingSheet, setShowCapacitySettingSheet] = useState(false);
  const [showCapacityConfirmationSheet, setShowCapacityConfirmationSheet] = useState(false);

  // Check if all required fields are filled and there are changes
  const isFormValid = isValid() && hasChanges();

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Event Details',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, pathname, applyRouteConfig, clearRoute]);

  // Populate form when event data is loaded
  useEffect(() => {
    debugLog('EditDetailsPage', 'useEffect triggered', {
      eventId,
      hasEventData: !!eventData,
      isLoading,
      hasError: !!error,
    });

    if (eventData) {
      debugLog('EditDetailsPage', 'Event data received from hook', eventData);

      // Log specific fields to check format
      debugLog('EditDetailsPage', 'Checking date field formats', {
        has_start_date_day: 'start_date_day' in eventData,
        has_start_date_month: 'start_date_month' in eventData,
        has_start_date_year: 'start_date_year' in eventData,
        has_date: 'date' in eventData,
        has_time: 'time' in eventData,
        start_date_day: (eventData as any).start_date_day,
        start_date_month: (eventData as any).start_date_month,
        start_date_year: (eventData as any).start_date_year,
        date: (eventData as any).date,
        time: (eventData as any).time,
      });

      try {
        // Validate and populate the form with API data
        debugLog('EditDetailsPage', 'Attempting to validate event data with apiEventSchema');
        const validatedEvent = apiEventSchema.parse(eventData);
        debugLog('EditDetailsPage', 'Validation successful', validatedEvent);

        debugLog('EditDetailsPage', 'Calling populateFromApiEvent');
        populateFromApiEvent(validatedEvent);
      } catch (error) {
        debugError('EditDetailsPage', 'Schema validation failed', error, {
          eventData,
          zodErrors: (error as any)?.errors || 'No Zod errors available',
        });
      }
    } else {
      debugLog('EditDetailsPage', 'No event data available yet');
    }
  }, [eventData, populateFromApiEvent, eventId, isLoading, error]);

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-md'>
        <div className='space-y-4 p-4'>
          {/* Cover image skeleton */}
          <Skeleton className='aspect-video w-full rounded-2xl' />

          {/* Form sections skeleton */}
          <div className='space-y-4 rounded-2xl bg-gray-50 p-4'>
            {/* Title section */}
            <div className='rounded-2xl bg-white p-4'>
              <Skeleton className='mb-2 h-4 w-20' />
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <Skeleton className='h-6 flex-1' />
              </div>
            </div>

            {/* Date & time section */}
            <div className='space-y-4 rounded-2xl bg-white p-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <Skeleton className='h-4 w-16' />
                <div className='flex flex-1 gap-2'>
                  <Skeleton className='h-10 flex-1 rounded-lg' />
                  <Skeleton className='h-10 w-20 rounded-lg' />
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <Skeleton className='h-4 w-16' />
                <div className='flex flex-1 gap-2'>
                  <Skeleton className='h-10 flex-1 rounded-lg' />
                  <Skeleton className='h-10 w-20 rounded-lg' />
                </div>
              </div>
            </div>

            {/* Other sections */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='rounded-2xl bg-white p-4'>
                <div className='flex items-center gap-4'>
                  <Skeleton className='h-8 w-8 rounded-lg' />
                  <div className='flex-1'>
                    <Skeleton className='mb-2 h-4 w-16' />
                    <Skeleton className='h-5 w-32' />
                  </div>
                  <Skeleton className='h-4 w-4' />
                </div>
              </div>
            ))}
          </div>
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

  const handleImageSelect = (imageUrl: string) => {
    setCoverImage(imageUrl);
  };

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
            toast.success('Event updated successfully!');
            // Navigate back to the manage page on success
            router.push(`/e/${eventId}/manage`);
          },
          onError: () => {
            toast.error('Failed to update event');
          },
        }
      );
    } catch (error) {
      // Error handling is done in the mutation hook
      logger.error('Failed to update event', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-md'>
      {/* Cover Image Selector */}
      <div className='mb-4 px-4'>
        <CoverImageSelector
          selectedImage={coverImage}
          onImageClick={() => setShowImageModal(true)}
        />
      </div>

      {/* Form Content */}
      <div className='flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 pb-32 pt-4'>
        {/* Event Title Module */}
        <div className='rounded-2xl bg-white p-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-500'>Event Title</label>
            <div className='flex items-center gap-3'>
              <EmojiSelector selectedEmoji={emoji} onEmojiSelect={setEmoji} />
              <input
                type='text'
                placeholder='Enter event name'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='flex-1 border-none bg-transparent text-lg font-medium text-gray-900 outline-none'
              />
            </div>
          </div>
        </div>

        {/* Date & Time Module */}
        <div className='space-y-4 rounded-2xl bg-white p-4'>
          <div className='flex items-center gap-4'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
              <Calendar className='h-4 w-4 text-gray-600' />
            </div>
            <span className='w-16 font-medium text-gray-700'>Starts</span>
            <div className='flex flex-1 gap-2'>
              <button
                onClick={() => setShowStartDateModal(true)}
                className='flex-1 whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900'
              >
                {formatDateForDisplay(startDate)}
              </button>
              <button
                onClick={() => setShowStartTimeModal(true)}
                className='whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600'
              >
                {formatTimeForDisplay(startTime)}
              </button>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
              <Calendar className='h-4 w-4 text-gray-600' />
            </div>
            <span className='w-16 font-medium text-gray-700'>Ends</span>
            <div className='flex flex-1 gap-2'>
              <button
                onClick={() => setShowEndDateModal(true)}
                className='flex-1 whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900'
              >
                {formatDateForDisplay(endDate)}
              </button>
              <button
                onClick={() => setShowEndTimeModal(true)}
                className='whitespace-nowrap rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600'
              >
                {formatTimeForDisplay(endTime)}
              </button>
            </div>
          </div>
        </div>

        {/* Address Module */}
        <div className='rounded-2xl bg-white p-4'>
          <button
            onClick={() => setShowLocationModal(true)}
            className='flex w-full items-center gap-4 text-left'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
              <MapPin className='h-4 w-4 text-gray-600' />
            </div>
            <div className='flex-1'>
              <label className='mb-1 block text-sm font-medium text-gray-500'>Address</label>
              <div className='flex items-center justify-between'>
                <span className={`font-medium ${location ? 'text-gray-900' : 'text-gray-400'}`}>
                  {location ? getLocationDisplayName(location) : 'Choose address'}
                </span>
                <ChevronRight className='h-4 w-4 text-gray-400' />
              </div>
            </div>
          </button>
        </div>

        {/* Description Module */}
        <div className='rounded-2xl bg-white p-4'>
          <button
            onClick={() => setShowDescriptionModal(true)}
            className='flex w-full items-start gap-4 text-left'
          >
            <div className='mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
              <Edit3 className='h-4 w-4 text-gray-600' />
            </div>
            <div className='flex-1'>
              <label className='mb-2 block text-sm font-medium text-gray-500'>Description</label>
              <div className='flex items-center justify-between'>
                <span
                  className={`${isContentEmpty(description) ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  {isContentEmpty(description)
                    ? 'Add description about this event...'
                    : getContentPreview(description, 80)}
                </span>
                <ChevronRight className='h-4 w-4 flex-shrink-0 text-gray-400' />
              </div>
            </div>
          </button>
        </div>

        <div className='rounded-2xl bg-white p-4'>
          <div className='space-y-3'>
            <div className='flex items-center gap-4'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
                <Users className='h-4 w-4 text-gray-600' />
              </div>
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <label className='mb-1 text-sm font-medium text-gray-500'>
                      {hasCapacity && capacity ? `Capacity ${capacity}` : 'Set Capacity'}
                    </label>
                    {hasCapacity && capacity && (
                      <span className='text-xs text-gray-400'>Maximum attendees: {capacity}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (hasCapacity) {
                        setShowCapacityConfirmationSheet(true);
                      } else {
                        setShowCapacitySettingSheet(true);
                      }
                    }}
                    className={`h-6 w-12 rounded-full transition-colors ${
                      hasCapacity ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white transition-transform ${
                        hasCapacity ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            {hasCapacity && (
              <div className='flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2'>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Show capacity count</p>
                  <p className='text-xs text-gray-500'>Display spots remaining to guests</p>
                </div>
                <button
                  onClick={() => setShowCapacityCount(!showCapacityCount)}
                  className={`h-6 w-12 rounded-full transition-colors ${
                    showCapacityCount ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      showCapacityCount ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  ></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImageSelectionModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImageSelect={handleImageSelect}
      />

      <DatePickerSheet
        isOpen={showStartDateModal}
        onClose={() => setShowStartDateModal(false)}
        onDateSelect={setStartDate}
        selectedDate={startDate}
        title='Start Date'
      />

      <DatePickerSheet
        isOpen={showEndDateModal}
        onClose={() => setShowEndDateModal(false)}
        onDateSelect={setEndDate}
        selectedDate={endDate}
        title='End Date'
        referenceDate={startDate}
      />

      <TimePickerSheet
        isOpen={showStartTimeModal}
        onClose={() => setShowStartTimeModal(false)}
        onTimeSelect={setStartTime}
        selectedTime={startTime}
        timezone={timezone}
        title='Start Time'
        onTimezoneSelect={function (timezone: string): void {
          setTimezone(timezone);
        }}
      />

      <TimePickerSheet
        isOpen={showEndTimeModal}
        onClose={() => setShowEndTimeModal(false)}
        onTimeSelect={setEndTime}
        selectedTime={endTime}
        timezone={timezone}
        title='End Time'
        onTimezoneSelect={function (timezone: string): void {
          setTimezone(timezone);
        }}
      />

      <TimezoneSheet
        isOpen={showTimezoneModal}
        onClose={() => setShowTimezoneModal(false)}
        onTimezoneSelect={setTimezone}
        selectedTimezone={timezone}
      />

      <LocationSheet
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={setLocation}
        selectedLocation={location || undefined}
      />

      <DescriptionSheet
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        onSave={setDescription}
        initialContent={description}
        event={{
          title,
          location: location?.address,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          timezone,
          visibility,
        }}
      />

      <CapacitySettingSheet
        isOpen={showCapacitySettingSheet}
        onClose={() => setShowCapacitySettingSheet(false)}
        onSave={(nextCapacity) => {
          setCapacity(nextCapacity);
          setHasCapacity(true);
          setShowCapacitySettingSheet(false);
        }}
        initialCapacity={capacity}
      />

      <CapacityConfirmationSheet
        isOpen={showCapacityConfirmationSheet}
        onClose={() => setShowCapacityConfirmationSheet(false)}
        onConfirm={() => {
          setHasCapacity(false);
          setCapacity('');
          setShowCapacityCount(false);
          setShowCapacityConfirmationSheet(false);
        }}
        currentCapacity={capacity}
      />

      {/* Fixed Bottom Button */}
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
