'use client';

import AttachmentSheet from '@/components/create-event/attachment-sheet';
import CapacityConfirmationSheet from '@/components/create-event/capacity-confirmation-sheet';
import CapacitySettingSheet from '@/components/create-event/capacity-setting-sheet';
import CoverImageSelector from '@/components/create-event/cover-image-selector';
import DatePickerSheet from '@/components/create-event/date-picker-sheet';
import DescriptionSheet from '@/components/create-event/description-sheet';
import EventCreatedModal from '@/components/create-event/event-created-modal';
import EventVisibilitySheet from '@/components/create-event/event-visibility-sheet';
import ImageSelectionSheet from '@/components/create-event/image-selection-sheet';
import InsertElementsSheet from '@/components/create-event/insert-elements-sheet';
import { LinkEditSheet } from '@/components/create-event/link-edit-sheet';
import ListsSheet from '@/components/create-event/lists-sheet';
import LocationSheet from '@/components/create-event/location-sheet';
import MoreFormattingSheet from '@/components/create-event/more-formatting-sheet';
import TextStylesSheet from '@/components/create-event/text-styles-sheet';
import TimePickerSheet from '@/components/create-event/time-picker-sheet';
import { EmojiSelector } from '@/components/emoji-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmitButton } from '@/components/ui/submit-button';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useCreateEventWithCallbacks } from '@/lib/hooks/use-create-event';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { useTopBar } from '@/lib/stores/topbar-store';
import { getContentPreview, isContentEmpty } from '@/lib/utils/content';
import { formatDateForDisplay, formatTimeForDisplay } from '@/lib/utils/event-date';
import { getLocationDisplayName } from '@/lib/utils/location';
import { toast } from '@/lib/utils/toast';
import { SheetStack } from '@silk-hq/components';
import { Calendar, ChevronRight, Edit3, Globe, Lock, MapPin, Music, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Attachment = {
  type: string;
  url?: string;
  data?: any;
};

export default function CreatePage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const pathname = usePathname();

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      leftMode: 'back',
      title: 'Create Event',
      subtitle: undefined,
      showAvatar: true,
      centerMode: 'title',
      buttons: [], // Explicitly clear any buttons
    });

    // Cleanup function to reset topbar state when leaving this page
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, applyRouteConfig, setTopBarForRoute, clearRoute]);

  const createEventMutation = useCreateEventWithCallbacks();

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
    hasCapacity,
    capacity,
    spotifyUrl,
    wavlakeUrl,
    attachments,
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
    setHasCapacity,
    setCapacity,
    setSpotifyUrl,
    setWavlakeUrl,
    setAttachments,
    setEmoji,
    getFormData,
    reset,
    isValid,
  } = useEventFormStore();

  // Reset form on mount
  useEffect(() => {
    reset();
  }, [reset]);

  const [showImageModal, setShowImageModal] = useState(false);

  // Modal States
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showVisibilitySheet, setShowVisibilitySheet] = useState(false);

  // Toolbar Sheet States
  const [showTextStylesSheet, setShowTextStylesSheet] = useState(false);
  const [showMoreFormattingSheet, setShowMoreFormattingSheet] = useState(false);
  const [showListsSheet, setShowListsSheet] = useState(false);
  const [showInsertElementsSheet, setShowInsertElementsSheet] = useState(false);
  const [showLinkEditSheet, setShowLinkEditSheet] = useState(false);
  const [showCapacitySettingSheet, setShowCapacitySettingSheet] = useState(false);
  const [showCapacityConfirmationSheet, setShowCapacityConfirmationSheet] = useState(false);
  const [currentEditor, setCurrentEditor] = useState<any>(null);
  const [linkEditData, setLinkEditData] = useState<{
    url: string;
    text: string;
    openInNewTab: boolean;
  }>({ url: '', text: '', openInNewTab: false });

  const handleSetLink = ({
    url,
    text,
    openInNewTab,
  }: {
    url: string;
    text: string;
    openInNewTab: boolean;
  }) => {
    if (!currentEditor) return;

    const { from, to } = currentEditor.state.selection;
    const selectedText = currentEditor.state.doc.textBetween(from, to);

    if (selectedText) {
      // If there's selected text, apply link to it
      currentEditor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: openInNewTab ? '_blank' : '' })
        .run();
    } else {
      // If no text selected, insert text with link
      currentEditor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: text || url,
          marks: [
            {
              type: 'link',
              attrs: {
                href: url,
                target: openInNewTab ? '_blank' : '',
              },
            },
          ],
        })
        .run();
    }

    setShowLinkEditSheet(false);
  };

  // Attachment Modal States
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdEventData, setCreatedEventData] = useState<any>(null);

  const handleImageSelect = (imageUrl: string) => {
    setCoverImage(imageUrl);
  };

  const handleAttachmentType = (type: 'spotify' | 'wavlake' | 'photo' | 'file' | 'link') => {
    // This will be handled by the AttachmentSheet internally
    // For now, just handle the file pickers
    switch (type) {
      case 'photo':
        // Trigger native photo picker
        const photoInput = document.createElement('input');
        photoInput.type = 'file';
        photoInput.accept = 'image/*';
        photoInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const newAttachments = [...attachments, { type: 'photo', data: file }];
            setAttachments(newAttachments);
          }
        };
        photoInput.click();
        break;
      case 'file':
        // Trigger native file picker
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const newAttachments = [...attachments, { type: 'file', data: file }];
            setAttachments(newAttachments);
          }
        };
        fileInput.click();
        break;
    }
  };

  const handleSaveAttachment = (type: string, url: string) => {
    if (type === 'spotify') {
      setSpotifyUrl(url);
    } else if (type === 'wavlake') {
      setWavlakeUrl(url);
    }
    setAttachments([...attachments, { type, url }]);
  };

  const handleCreateEvent = async () => {
    if (!isValid()) {
      return;
    }

    try {
      const formData = getFormData();
      const result = await createEventMutation.mutateAsync(formData);

      // Prepare data for success modal
      setCreatedEventData({
        id: result.id,
        title: result.title,
        date: startDate,
        time: startTime,
      });

      // Show success modal
      setShowCreatedModal(true);
      toast.success('Event created successfully!');
    } catch (error: any) {
      // Error handling
      console.error('Failed to create event:', error);
      toast.error(error.message || 'Failed to create event');
    }
  };

  // Check if all required fields are filled
  const isFormValid = isValid();

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-3xl'>
        {/* Create Page Loading Skeleton */}
        <div className='flex-1 overflow-y-auto pb-24'>
          <div className='mb-2 mt-2 px-4'>
            {/* Cover image selector area */}
            <Skeleton className='h-40 w-full rounded-2xl' />
          </div>

          <div className='space-y-4 bg-gray-50 px-4 pt-4'>
            {/* Title */}
            <div className='rounded-2xl bg-white p-4'>
              <div className='mb-2 h-4 w-24'>
                <Skeleton className='h-4 w-24' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <Skeleton className='h-6 w-2/3' />
              </div>
            </div>

            {/* Date & Time */}
            <div className='space-y-4 rounded-2xl bg-white p-4'>
              {[0, 1].map((i) => (
                <div key={i} className='flex items-center gap-4'>
                  <Skeleton className='h-8 w-8 rounded-lg' />
                  <Skeleton className='h-4 w-16' />
                  <div className='flex flex-1 gap-2'>
                    <Skeleton className='h-8 w-full rounded-lg' />
                    <Skeleton className='h-8 w-24 rounded-lg' />
                  </div>
                </div>
              ))}
            </div>

            {/* Address */}
            <div className='rounded-2xl bg-white p-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <div className='flex-1'>
                  <div className='mb-2 h-4 w-20'>
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-5 w-40' />
                    <Skeleton className='h-4 w-4 rounded' />
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className='rounded-2xl bg-white p-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <div className='flex-1'>
                  <div className='mb-2 h-4 w-24'>
                    <Skeleton className='h-4 w-24' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-5 w-20' />
                    <Skeleton className='h-4 w-4 rounded' />
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div className='rounded-2xl bg-white p-4'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex flex-1 items-center gap-4'>
                  <Skeleton className='h-8 w-8 rounded-lg' />
                  <div className='flex-1'>
                    <Skeleton className='mb-1 h-4 w-28' />
                    <Skeleton className='h-3 w-40' />
                  </div>
                </div>
                <Skeleton className='h-6 w-12 rounded-full' />
              </div>
            </div>

            {/* Description */}
            <div className='rounded-2xl bg-white p-4'>
              <div className='flex items-start gap-4'>
                <Skeleton className='mt-1 h-8 w-8 rounded-lg' />
                <div className='flex-1'>
                  <Skeleton className='mb-2 h-4 w-24' />
                  <Skeleton className='h-5 w-3/4' />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className='rounded-2xl bg-white p-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-8 w-8 rounded-lg' />
                <Skeleton className='h-5 w-56' />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4'>
          <div className='mx-auto max-w-full md:max-w-sm'>
            <Skeleton className='h-10 w-full rounded-xl' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-3xl md:border-l md:border-r'>
      {/* Header */}

      {/* Cover Image Selector */}
      <div className='mb-2 mt-2 px-4 md:max-w-sm'>
        <CoverImageSelector
          selectedImage={coverImage}
          onImageClick={() => setShowImageModal(true)}
        />
      </div>

      {/* Form Content */}
      <div className='flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 pb-32 pt-4'>
        {/* Event Title Module - Moved to top */}
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
            <div className='flex h-8 w-8 min-w-8 items-center justify-center rounded-lg bg-gray-100'>
              <Calendar className='h-4 w-4 text-gray-600' />
            </div>
            <span className='w-12 min-w-10 font-medium text-gray-700'>Starts</span>
            <div className='flex flex-1 gap-2'>
              <button
                onClick={() => setShowStartDateModal(true)}
                className='flex-1 whitespace-nowrap rounded-lg bg-gray-100 px-2 py-2 text-sm font-medium text-gray-900'
              >
                {formatDateForDisplay(startDate)}
              </button>
              <button
                onClick={() => setShowStartTimeModal(true)}
                className='whitespace-nowrap rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600'
              >
                {formatTimeForDisplay(startTime)}
              </button>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex h-8 w-8 min-w-8 items-center justify-center rounded-lg bg-gray-100'>
              <Calendar className='h-4 w-4 text-gray-600' />
            </div>
            <span className='w-12 min-w-10 font-medium text-gray-700'>Ends</span>
            <div className='flex flex-1 gap-2'>
              <button
                onClick={() => setShowEndDateModal(true)}
                className='flex-1 whitespace-nowrap rounded-lg bg-gray-100 px-2 py-2 text-sm font-medium text-gray-900'
              >
                {formatDateForDisplay(endDate)}
              </button>
              <button
                onClick={() => setShowEndTimeModal(true)}
                className='whitespace-nowrap rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600'
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

        {/* Capacity Options */}
        <div className='rounded-2xl bg-white p-4'>
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
                      // User is trying to turn off capacity
                      setShowCapacityConfirmationSheet(true);
                    } else {
                      // User is trying to turn on capacity
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

        {/* Attachments Module */}
        <div className='rounded-2xl bg-white p-4'>
          <div className='flex items-center gap-4'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
              <Music className='h-4 w-4 text-gray-600' />
            </div>
            <div className='flex-1'>
              <button
                onClick={() => setShowAttachmentModal(true)}
                className='text-left font-medium text-gray-500'
              >
                Add Music, Photo, File or Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 md:mx-auto md:max-w-3xl md:border-l md:border-r md:border-t'>
        <div className='mx-auto max-w-full md:max-w-sm'>
          <SubmitButton
            onClick={handleCreateEvent}
            disabled={!isFormValid || createEventMutation.isPending}
            loading={createEventMutation.isPending}
          >
            Create Event
          </SubmitButton>
        </div>
      </div>

      {/* Modals and Sheets */}
      <SheetStack.Root>
        {/* Date Picker Sheets */}
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

        {/* Time Picker Sheets */}
        <TimePickerSheet
          isOpen={showStartTimeModal}
          onClose={() => setShowStartTimeModal(false)}
          onTimeSelect={setStartTime}
          onTimezoneSelect={setTimezone}
          selectedTime={startTime}
          timezone={timezone}
          title='Start Time'
        />

        <TimePickerSheet
          isOpen={showEndTimeModal}
          onClose={() => setShowEndTimeModal(false)}
          onTimeSelect={setEndTime}
          onTimezoneSelect={setTimezone}
          selectedTime={endTime}
          timezone={timezone}
          title='End Time'
        />

        {/* Attachment Sheet */}
        <AttachmentSheet
          isOpen={showAttachmentModal}
          onClose={() => setShowAttachmentModal(false)}
          onSelectType={handleAttachmentType}
          onSaveAttachment={handleSaveAttachment}
          spotifyUrl={spotifyUrl}
          wavlakeUrl={wavlakeUrl}
        />

        {/* Toolbar Mobile Sheets */}
        {currentEditor && (
          <>
            <TextStylesSheet
              isOpen={showTextStylesSheet}
              onClose={() => setShowTextStylesSheet(false)}
              editor={currentEditor}
            />
            <MoreFormattingSheet
              isOpen={showMoreFormattingSheet}
              onClose={() => setShowMoreFormattingSheet(false)}
              editor={currentEditor}
            />
            <ListsSheet
              isOpen={showListsSheet}
              onClose={() => setShowListsSheet(false)}
              editor={currentEditor}
            />
            <InsertElementsSheet
              isOpen={showInsertElementsSheet}
              onClose={() => setShowInsertElementsSheet(false)}
              editor={currentEditor}
            />
            <LinkEditSheet
              isOpen={showLinkEditSheet}
              onClose={() => setShowLinkEditSheet(false)}
              onSetLink={handleSetLink}
              initialUrl={linkEditData.url}
              initialText={linkEditData.text}
              initialOpenInNewTab={linkEditData.openInNewTab}
            />
          </>
        )}

        {/* Capacity Sheets */}
        <CapacitySettingSheet
          isOpen={showCapacitySettingSheet}
          onClose={() => setShowCapacitySettingSheet(false)}
          onSave={(capacity) => {
            setCapacity(capacity);
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
            setShowCapacityConfirmationSheet(false);
          }}
          currentCapacity={capacity}
        />
      </SheetStack.Root>

      {/* Other Modals */}
      {/* Image Selection Sheet */}
      <ImageSelectionSheet
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImageSelect={handleImageSelect}
      />

      {/* Location Sheet */}
      <LocationSheet
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={setLocation}
        selectedLocation={location || undefined}
      />

      {/* Description Sheet */}
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
        onOpenTextStylesSheet={(editor) => {
          setCurrentEditor(editor);
          setShowTextStylesSheet(true);
        }}
        onOpenMoreFormattingSheet={(editor) => {
          setCurrentEditor(editor);
          setShowMoreFormattingSheet(true);
        }}
        onOpenListsSheet={(editor) => {
          setCurrentEditor(editor);
          setShowListsSheet(true);
        }}
        onOpenInsertElementsSheet={(editor) => {
          setCurrentEditor(editor);
          setShowInsertElementsSheet(true);
        }}
        onOpenLinkEditSheet={(editor, linkData) => {
          setCurrentEditor(editor);
          setLinkEditData(linkData);
          setShowLinkEditSheet(true);
        }}
      />

      {/* Event Visibility Sheet */}
      <EventVisibilitySheet
        isOpen={showVisibilitySheet}
        onClose={() => setShowVisibilitySheet(false)}
        onVisibilitySelect={setVisibility}
        currentVisibility={visibility}
      />

      {/* Event Created Modal */}
      {createdEventData && (
        <EventCreatedModal
          isOpen={showCreatedModal}
          onClose={() => {
            setShowCreatedModal(false);
            reset(); // Reset form after closing modal
          }}
          eventData={createdEventData}
        />
      )}
    </div>
  );
}
