'use client';

import CoverImageSelector from '@/components/create-event/cover-image-selector';
import DatePickerSheet from '@/components/create-event/date-picker-sheet';
import DescriptionSheet from '@/components/create-event/description-sheet';
import EventVisibilitySheet from '@/components/create-event/event-visibility-sheet';
import ImageSelectionModal from '@/components/create-event/image-selection-modal';
import LocationModal from '@/components/create-event/location-modal';
import TimePickerSheet from '@/components/create-event/time-picker-sheet';
import TimezoneSheet from '@/components/create-event/timezone-sheet';
import { EmojiSelector } from '@/components/emoji-selector';
import { Button } from '@/components/ui/button';
import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { useUpdateEvent } from '@/lib/hooks/useUpdateEvent';
import { apiEventSchema } from '@/lib/schemas/event';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { getContentPreview, isContentEmpty } from '@/lib/utils/content';
import { debugError, debugLog } from '@/lib/utils/debug';
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/utils/event-date';
import { getLocationDisplayName } from '@/lib/utils/location';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Edit3,
  Globe,
  Loader2,
  Lock,
  MapPin,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const updateEventMutation = useUpdateEvent();

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
    setTitle,
    setDescription,
    setCoverImage,
    setLocation,
    setStartDate,
    setEndDate,
    setStartTime,
    setEndTime,
    setTimezone,
    setVisibility,
    setEmoji,
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
  const [showVisibilitySheet, setShowVisibilitySheet] = useState(false);

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
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='flex items-center gap-2'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading event details...</span>
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
            The event you're trying to edit doesn't exist or you don't have permission.
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
      await updateEventMutation.mutateAsync({
        ...formData,
        id: eventId,
      });

      // Navigate back to the manage page on success
      router.push(`/e/${eventId}/manage`);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to update event:', error);
    }
  };

  // Check if all required fields are filled and there are changes
  const isFormValid = isValid() && hasChanges();

  return (
    <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-100 p-4'>
        <div className='flex items-center gap-4'>
          <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h1 className='text-xl font-semibold'>Event Details</h1>
        </div>
        <Button
          onClick={handleSaveChanges}
          className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          disabled={!isFormValid || updateEventMutation.isPending}
        >
          {updateEventMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

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

        {/* Event Visibility */}
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
        onTimezoneClick={() => {
          setShowStartTimeModal(false);
          setShowTimezoneModal(true);
        }}
        selectedTime={startTime}
        timezone={timezone}
        title='Start Time'
      />

      <TimePickerSheet
        isOpen={showEndTimeModal}
        onClose={() => setShowEndTimeModal(false)}
        onTimeSelect={setEndTime}
        onTimezoneClick={() => {
          setShowEndTimeModal(false);
          setShowTimezoneModal(true);
        }}
        selectedTime={endTime}
        timezone={timezone}
        title='End Time'
      />

      <TimezoneSheet
        isOpen={showTimezoneModal}
        onClose={() => setShowTimezoneModal(false)}
        onTimezoneSelect={setTimezone}
        selectedTimezone={timezone}
      />

      <LocationModal
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

      {/* Event Visibility Sheet */}
      <EventVisibilitySheet
        isOpen={showVisibilitySheet}
        onClose={() => setShowVisibilitySheet(false)}
        onVisibilitySelect={setVisibility}
        currentVisibility={visibility}
      />
    </div>
  );
}
