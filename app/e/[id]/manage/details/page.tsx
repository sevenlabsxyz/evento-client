"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Edit3,
  Globe,
  Lock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverImageSelector from "@/components/create-event/cover-image-selector";
import ImageSelectionModal from "@/components/create-event/image-selection-modal";
import DatePickerSheet from "@/components/create-event/date-picker-sheet";
import TimePickerSheet from "@/components/create-event/time-picker-sheet";
import TimezoneSheet from "@/components/create-event/timezone-sheet";
import LocationModal from "@/components/create-event/location-modal";
import DescriptionSheet from "@/components/create-event/description-sheet";
import EventVisibilitySheet from "@/components/create-event/event-visibility-sheet";
import { getLocationDisplayName } from "@/lib/utils/location";
import { getContentPreview, isContentEmpty } from "@/lib/utils/content";
import { useEventFormStore } from "@/lib/stores/event-form-store";
import { useUpdateEvent } from "@/lib/hooks/useUpdateEvent";
import { useEventDetails } from "@/lib/hooks/useEventDetails";
import {
  formatDateForDisplay,
  formatTimeForDisplay,
} from "@/lib/utils/event-date";
import { apiEventSchema } from "@/lib/schemas/event";
import { debugLog, debugError } from "@/lib/utils/debug";

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
    debugLog("EditDetailsPage", "useEffect triggered", {
      eventId,
      hasEventData: !!eventData,
      isLoading,
      hasError: !!error,
    });

    if (eventData) {
      debugLog("EditDetailsPage", "Event data received from hook", eventData);

      // Log specific fields to check format
      debugLog("EditDetailsPage", "Checking date field formats", {
        has_start_date_day: "start_date_day" in eventData,
        has_start_date_month: "start_date_month" in eventData,
        has_start_date_year: "start_date_year" in eventData,
        has_date: "date" in eventData,
        has_time: "time" in eventData,
        start_date_day: (eventData as any).start_date_day,
        start_date_month: (eventData as any).start_date_month,
        start_date_year: (eventData as any).start_date_year,
        date: (eventData as any).date,
        time: (eventData as any).time,
      });

      try {
        // Validate and populate the form with API data
        debugLog(
          "EditDetailsPage",
          "Attempting to validate event data with apiEventSchema"
        );
        const validatedEvent = apiEventSchema.parse(eventData);
        debugLog("EditDetailsPage", "Validation successful", validatedEvent);

        debugLog("EditDetailsPage", "Calling populateFromApiEvent");
        populateFromApiEvent(validatedEvent);
      } catch (error) {
        debugError("EditDetailsPage", "Schema validation failed", error, {
          eventData,
          zodErrors: (error as any)?.errors || "No Zod errors available",
        });
      }
    } else {
      debugLog("EditDetailsPage", "No event data available yet");
    }
  }, [eventData, populateFromApiEvent, eventId, isLoading, error]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading event details...</span>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The event you're trying to edit doesn't exist or you don't have
            permission.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
      console.error("Failed to update event:", error);
    }
  };

  // Check if all required fields are filled and there are changes
  const isFormValid = isValid() && hasChanges();

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Event Details</h1>
        </div>
        <Button
          onClick={handleSaveChanges}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          disabled={!isFormValid || updateEventMutation.isPending}
        >
          {updateEventMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Cover Image Selector */}
      <div className="px-4 mb-4">
        <CoverImageSelector
          selectedImage={coverImage}
          onImageClick={() => setShowImageModal(true)}
        />
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 pb-32 space-y-4 bg-gray-50 overflow-y-auto pt-4">
        {/* Event Title Module */}
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
        title="Start Date"
      />

      <DatePickerSheet
        isOpen={showEndDateModal}
        onClose={() => setShowEndDateModal(false)}
        onDateSelect={setEndDate}
        selectedDate={endDate}
        title="End Date"
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
        title="Start Time"
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
        title="End Time"
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
