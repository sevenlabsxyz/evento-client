"use client";

import { useState } from "react";
import { X, Calendar, Edit3, Music, MapPin, Globe, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";
import CoverImageSelector from "@/components/create-event/cover-image-selector";
import ImageSelectionModal from "@/components/create-event/image-selection-modal";
import DatePickerModal from "@/components/create-event/date-picker-modal";
import TimePickerModal from "@/components/create-event/time-picker-modal";
import TimezoneModal from "@/components/create-event/timezone-modal";
import LocationModal, { LocationData } from "@/components/create-event/location-modal";
import DescriptionModal from "@/components/create-event/description-modal";
import DropdownMenu from "@/components/ui/dropdown-menu";
import AttachmentModal from "@/components/create-event/attachment-modal";
import SpotifyModal from "@/components/create-event/spotify-modal";
import WavlakeModal from "@/components/create-event/wavlake-modal";
import LinkModal from "@/components/create-event/link-modal";
import EventCreatedModal from "@/components/create-event/event-created-modal";
import { getLocationDisplayName, locationDataToEventLocation } from "@/lib/utils/location";
import { getContentPreview, isContentEmpty } from "@/lib/utils/content";

export default function CreatePage() {
  const router = useRouter();
  const [selectedCoverImage, setSelectedCoverImage] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [eventVisibility, setEventVisibility] = useState("public");
  const [hasCapacity, setHasCapacity] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventLocation, setEventLocation] = useState<LocationData | null>(null);
  const [eventDescription, setEventDescription] = useState("<p></p>");

  // Date and Time States
  const [startDate, setStartDate] = useState<Date>(new Date(2025, 8, 9)); // Sep 09
  const [endDate, setEndDate] = useState<Date>(new Date(2025, 8, 11)); // Sep 11
  const [startTime, setStartTime] = useState({
    hour: 9,
    minute: 0,
    period: "AM" as "AM" | "PM",
  });
  const [endTime, setEndTime] = useState({
    hour: 5,
    minute: 0,
    period: "PM" as "AM" | "PM",
  });
  const [timezone, setTimezone] = useState("America/Los_Angeles");

  // Modal States
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  // Attachment Modal States
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [showWavlakeModal, setShowWavlakeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{ type: string; url?: string; data?: any }>
  >([]);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [createdEventData, setCreatedEventData] = useState<any>(null);

  const handleImageSelect = (imageUrl: string) => {
    setSelectedCoverImage(imageUrl);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
    });
  };

  const formatTime = (time: {
    hour: number;
    minute: number;
    period: "AM" | "PM";
  }) => {
    return `${time.hour.toString().padStart(2, "0")}:${time.minute
      .toString()
      .padStart(2, "0")} ${time.period}`;
  };

  const handleAttachmentType = (
    type: "spotify" | "wavlake" | "photo" | "file" | "link"
  ) => {
    switch (type) {
      case "spotify":
        setShowSpotifyModal(true);
        break;
      case "wavlake":
        setShowWavlakeModal(true);
        break;
      case "link":
        setShowLinkModal(true);
        break;
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
    setAttachments((prev) => [...prev, { type, url }]);
  };

  const handleCreateEvent = () => {
    console.log('Create event button clicked');
    console.log('Form valid:', isFormValid);
    console.log('Event title:', eventTitle);
    console.log('Event location:', eventLocation);
    
    if (!isFormValid) {
      console.log('Form validation failed, returning early');
      return;
    }

    // Generate a unique event ID (in a real app, this would come from the backend)
    const eventId = 'evt_' + Math.random().toString(36).substr(2, 9);
    
    const newEvent = {
      id: eventId,
      title: eventTitle,
      description: eventDescription,
      startDate,
      endDate,
      startTime,
      endTime,
      timezone,
      location: eventLocation ? locationDataToEventLocation(eventLocation) : null,
      visibility: eventVisibility,
      capacity: hasCapacity ? parseInt(capacity) : null,
      attachments,
      coverImage: selectedCoverImage,
      createdAt: new Date(),
      owner: 'current-user-id' // In a real app, this would be the actual user ID
    };

    // In a real app, you would save this to your backend
    console.log('Creating event:', newEvent);
    
    // Store for the success modal
    setCreatedEventData({
      id: eventId,
      title: eventTitle,
      date: startDate,
      time: startTime
    });
    
    // Show success modal
    setShowCreatedModal(true);
  };

  // Check if all required fields are filled
  const isFormValid = eventTitle.trim() !== "" && eventLocation !== null;

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen flex flex-col relative">
      {/* Header */}
      <PageHeader
        title="Create Event"
        subtitle="Add a new event to your itinerary"
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-100"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        }
      />

      {/* Cover Image Selector */}
      <div className="px-4 mb-4">
        <CoverImageSelector
          selectedImage={selectedCoverImage}
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
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
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
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 font-medium flex-1"
              >
                {formatDate(startDate)}
              </button>
              <button
                onClick={() => setShowStartTimeModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 text-sm"
              >
                {startTime.hour && startTime.minute !== undefined
                  ? formatTime(startTime)
                  : "Time"}
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
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-900 font-medium flex-1"
              >
                {formatDate(endDate)}
              </button>
              <button
                onClick={() => setShowEndTimeModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 text-sm"
              >
                {endTime.hour && endTime.minute !== undefined
                  ? formatTime(endTime)
                  : "Time"}
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
                <span className={`font-medium ${eventLocation ? 'text-gray-900' : 'text-gray-400'}`}>
                  {eventLocation ? getLocationDisplayName(eventLocation) : 'Choose address'}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>

        {/* Event Visibility */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Globe className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-1">
                Event Visibility
              </label>
              <DropdownMenu
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                ]}
                value={eventVisibility}
                onChange={setEventVisibility}
              />
            </div>
          </div>
        </div>

        {/* Capacity Options */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-500 text-sm font-medium">
                  Set Capacity
                </label>
                <button
                  onClick={() => setHasCapacity(!hasCapacity)}
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
              {hasCapacity && (
                <input
                  type="number"
                  placeholder="Maximum attendees"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full text-gray-900 font-medium bg-transparent border-none outline-none"
                />
              )}
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
                <span className={`${isContentEmpty(eventDescription) ? 'text-gray-400' : 'text-gray-900'}`}>
                  {isContentEmpty(eventDescription) 
                    ? 'Add description about this event...' 
                    : getContentPreview(eventDescription, 80)
                  }
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
            disabled={!isFormValid}
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* Image Selection Modal */}
      <ImageSelectionModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImageSelect={handleImageSelect}
      />

      {/* Date Picker Modals */}
      <DatePickerModal
        isOpen={showStartDateModal}
        onClose={() => setShowStartDateModal(false)}
        onDateSelect={setStartDate}
        selectedDate={startDate}
        title="Start Date"
      />

      <DatePickerModal
        isOpen={showEndDateModal}
        onClose={() => setShowEndDateModal(false)}
        onDateSelect={setEndDate}
        selectedDate={endDate}
        title="End Date"
      />

      {/* Time Picker Modals */}
      <TimePickerModal
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

      <TimePickerModal
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

      {/* Timezone Modal */}
      <TimezoneModal
        isOpen={showTimezoneModal}
        onClose={() => setShowTimezoneModal(false)}
        onTimezoneSelect={setTimezone}
        selectedTimezone={timezone}
      />

      {/* Attachment Modals */}
      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onSelectType={handleAttachmentType}
      />

      <SpotifyModal
        isOpen={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
        onSave={(url) => handleSaveAttachment("spotify", url)}
      />

      <WavlakeModal
        isOpen={showWavlakeModal}
        onClose={() => setShowWavlakeModal(false)}
        onSave={(url) => handleSaveAttachment("wavlake", url)}
      />

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSave={(url) => handleSaveAttachment("link", url)}
      />
      
      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={setEventLocation}
        selectedLocation={eventLocation || undefined}
      />
      
      {/* Description Modal */}
      <DescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        onSave={setEventDescription}
        initialContent={eventDescription}
      />
      
      {/* Event Created Modal */}
      {createdEventData && (
        <EventCreatedModal
          isOpen={showCreatedModal}
          onClose={() => setShowCreatedModal(false)}
          eventData={createdEventData}
        />
      )}
    </div>
  );
}
