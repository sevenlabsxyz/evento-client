"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Edit3,
  Music,
  MapPin,
  Globe,
  Lock,
  Users,
  ChevronRight,
} from "lucide-react";
import { SheetStack } from "@silk-hq/components";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";
import CoverImageSelector from "@/components/create-event/cover-image-selector";
import ImageSelectionSheet from "@/components/create-event/image-selection-sheet";
import DatePickerSheet from "@/components/create-event/date-picker-sheet";
import TimePickerSheet from "@/components/create-event/time-picker-sheet";
import LocationSheet, {
  LocationData,
} from "@/components/create-event/location-sheet";
import DescriptionSheet from "@/components/create-event/description-sheet";
import AttachmentSheet from "@/components/create-event/attachment-sheet";
import EventVisibilitySheet from "@/components/create-event/event-visibility-sheet";
import EventCreatedModal from "@/components/create-event/event-created-modal";
import TextStylesSheet from "@/components/create-event/text-styles-sheet";
import MoreFormattingSheet from "@/components/create-event/more-formatting-sheet";
import ListsSheet from "@/components/create-event/lists-sheet";
import InsertElementsSheet from "@/components/create-event/insert-elements-sheet";
import { LinkEditSheet } from "@/components/create-event/link-edit-sheet";
import CapacitySettingSheet from "@/components/create-event/capacity-setting-sheet";
import CapacityConfirmationSheet from "@/components/create-event/capacity-confirmation-sheet";
import { getLocationDisplayName } from "@/lib/utils/location";
import { getContentPreview, isContentEmpty } from "@/lib/utils/content";
import { useEventFormStore } from "@/lib/stores/event-form-store";
import { useCreateEventWithCallbacks } from "@/lib/hooks/useCreateEvent";
import {
  formatDateForDisplay,
  formatTimeForDisplay,
} from "@/lib/utils/event-date";
import { toast } from "@/lib/utils/toast";

export default function CreatePage() {
  const router = useRouter();
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
  }>({ url: "", text: "", openInNewTab: false });

  const handleSetLink = ({ url, text, openInNewTab }: { url: string; text: string; openInNewTab: boolean }) => {
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
                target: openInNewTab ? '_blank' : ''
              }
            }
          ]
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

  const handleAttachmentType = (
    type: "spotify" | "wavlake" | "photo" | "file" | "link"
  ) => {
    // This will be handled by the AttachmentSheet internally
    // For now, just handle the file pickers
    switch (type) {
      case "photo":
        // Trigger native photo picker
        const photoInput = document.createElement("input");
        photoInput.type = "file";
        photoInput.accept = "image/*";
        photoInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setAttachments((prev) => [...prev, { type: "photo", data: file }]);
          }
        };
        photoInput.click();
        break;
      case "file":
        // Trigger native file picker
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            setAttachments((prev) => [...prev, { type: "file", data: file }]);
          }
        };
        fileInput.click();
        break;
    }
  };

  const handleSaveAttachment = (type: string, url: string) => {
    if (type === "spotify") {
      setSpotifyUrl(url);
    } else if (type === "wavlake") {
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
      toast.success("Event created successfully!");
    } catch (error: any) {
      // Error handling
      console.error("Failed to create event:", error);
      toast.error(error.message || "Failed to create event");
    }
  };

  // Check if all required fields are filled
  const isFormValid = isValid();

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col relative">
      {/* Header */}
      <PageHeader
        title="Create Event"
        subtitle="Add a new event to your itinerary"
        showMenu={true}
      />

      {/* Cover Image Selector */}
      <div className="px-4 mb-2 mt-2">
        <CoverImageSelector
          selectedImage={coverImage}
          onImageClick={() => setShowImageModal(true)}
        />
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 pb-32 space-y-4 bg-gray-50 overflow-y-auto pt-4">
        {/* Event Title Module - Moved to top */}
        <div className="bg-white rounded-2xl p-4">
          <div className="space-y-2">
            <label className="text-gray-500 text-sm font-medium">
              Event Title
            </label>
            <input
              type="text"
              placeholder="Enter event name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-gray-900 font-medium bg-transparent border-none outline-none text-lg"
            />
          </div>
        </div>

        {/* Date & Time Module */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium w-16">Starts</span>
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setShowStartDateModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 font-medium flex-1 whitespace-nowrap text-sm"
              >
                {formatDateForDisplay(startDate)}
              </button>
              <button
                onClick={() => setShowStartTimeModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 text-sm whitespace-nowrap"
              >
                {formatTimeForDisplay(startTime)}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium w-16">Ends</span>
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setShowEndDateModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 font-medium flex-1 whitespace-nowrap text-sm"
              >
                {formatDateForDisplay(endDate)}
              </button>
              <button
                onClick={() => setShowEndTimeModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 text-sm whitespace-nowrap"
              >
                {formatTimeForDisplay(endTime)}
              </button>
            </div>
          </div>
        </div>

        {/* Address Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-1">
                Address
              </label>
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium ${
                    location ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {location
                    ? getLocationDisplayName(location)
                    : "Choose address"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>

        {/* Event Visibility */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowVisibilitySheet(true)}
            className="flex items-center gap-4 w-full text-left"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              {visibility === "public" ? (
                <Globe className="h-4 w-4 text-gray-600" />
              ) : (
                <Lock className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-1">
                Event Visibility
              </label>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {visibility === "public" ? "Public" : "Private"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>

        {/* Capacity Options */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-gray-500 text-sm font-medium mb-1">
                    {hasCapacity && capacity ? `Capacity ${capacity}` : "Set Capacity"}
                  </label>
                  {hasCapacity && capacity && (
                    <span className="text-gray-400 text-xs">
                      Maximum attendees: {capacity}
                    </span>
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
                  className={`w-12 h-6 rounded-full transition-colors ${
                    hasCapacity ? "bg-purple-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      hasCapacity ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description Module */}
        <div className="bg-white rounded-2xl p-4">
          <button
            onClick={() => setShowDescriptionModal(true)}
            className="flex items-start gap-4 w-full text-left"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
              <Edit3 className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-2">
                Description
              </label>
              <div className="flex items-center justify-between">
                <span
                  className={`${
                    isContentEmpty(description)
                      ? "text-gray-400"
                      : "text-gray-900"
                  }`}
                >
                  {isContentEmpty(description)
                    ? "Add description about this event..."
                    : getContentPreview(description, 80)}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </button>
        </div>

        {/* Attachments Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Music className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <button
                onClick={() => setShowAttachmentModal(true)}
                className="text-gray-500 font-medium text-left"
              >
                Add Music, Photo, File or Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
        <div className="md:max-w-sm max-w-full mx-auto">
          <Button
            onClick={handleCreateEvent}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              isFormValid
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isFormValid || createEventMutation.isPending}
          >
            {createEventMutation.isPending ? "Creating..." : "Create Event"}
          </Button>
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
          title="Start Date"
        />

        <DatePickerSheet
          isOpen={showEndDateModal}
          onClose={() => setShowEndDateModal(false)}
          onDateSelect={setEndDate}
          selectedDate={endDate}
          title="End Date"
        />

        {/* Time Picker Sheets */}
        <TimePickerSheet
          isOpen={showStartTimeModal}
          onClose={() => setShowStartTimeModal(false)}
          onTimeSelect={setStartTime}
          onTimezoneSelect={setTimezone}
          selectedTime={startTime}
          timezone={timezone}
          title="Start Time"
        />

        <TimePickerSheet
          isOpen={showEndTimeModal}
          onClose={() => setShowEndTimeModal(false)}
          onTimeSelect={setEndTime}
          onTimezoneSelect={setTimezone}
          selectedTime={endTime}
          timezone={timezone}
          title="End Time"
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
            setCapacity("");
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
