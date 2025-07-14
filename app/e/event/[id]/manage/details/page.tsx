'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventById } from '@/lib/data/sample-events';
import CoverImageSelector from '@/components/create-event/cover-image-selector';
import ImageSelectionModal from '@/components/create-event/image-selection-modal';
import DatePickerModal from '@/components/create-event/date-picker-modal';
import TimePickerModal from '@/components/create-event/time-picker-modal';
import TimezoneModal from '@/components/create-event/timezone-modal';

export default function EditEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to edit doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Pre-fill state with existing event data
  const [selectedCoverImage, setSelectedCoverImage] = useState<string>(
    existingEvent.coverImages[0] || ""
  );
  const [showImageModal, setShowImageModal] = useState(false);
  const [eventTitle, setEventTitle] = useState(existingEvent.title);
  const [eventAddress, setEventAddress] = useState(
    `${existingEvent.location.name}, ${existingEvent.location.address}, ${existingEvent.location.city}`
  );
  const [eventDescription, setEventDescription] = useState(existingEvent.description);

  // Parse existing dates and times
  const parseExistingDate = (dateString: string) => {
    // Convert "July 15, 2025" to Date object
    return new Date(dateString);
  };

  const parseExistingTime = (timeString: string) => {
    // Convert "9:00 AM" to time object
    const [time, period] = timeString.split(' ');
    const [hour, minute] = time.split(':').map(Number);
    return {
      hour: hour === 12 ? (period === 'AM' ? 0 : 12) : (period === 'PM' && hour !== 12 ? hour + 12 : hour),
      minute: minute || 0,
      period: period as 'AM' | 'PM'
    };
  };

  // Date and Time States with existing data
  const [startDate, setStartDate] = useState<Date>(parseExistingDate(existingEvent.date));
  const [endDate, setEndDate] = useState<Date>(parseExistingDate(existingEvent.date));
  const [startTime, setStartTime] = useState(parseExistingTime(existingEvent.startTime));
  const [endTime, setEndTime] = useState(parseExistingTime(existingEvent.endTime));
  const [timezone, setTimezone] = useState(existingEvent.timezone || "America/Los_Angeles");

  // Modal States
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

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
    const displayHour = time.hour > 12 ? time.hour - 12 : time.hour === 0 ? 12 : time.hour;
    return `${displayHour.toString().padStart(2, "0")}:${time.minute
      .toString()
      .padStart(2, "0")} ${time.period}`;
  };

  const handleSaveChanges = () => {
    console.log('Saving event changes:', {
      id: eventId,
      title: eventTitle,
      description: eventDescription,
      startDate,
      endDate,
      startTime,
      endTime,
      timezone,
      address: eventAddress,
      coverImage: selectedCoverImage,
    });
    
    // In a real app, you would save this to your backend
    // For now, just navigate back
    router.back();
  };

  // Check if all required fields are filled
  const isFormValid = eventTitle.trim() !== "" && eventAddress.trim() !== "";

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
          <h1 className="text-xl font-semibold">Edit Event</h1>
        </div>
        <Button
          onClick={handleSaveChanges}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            isFormValid
              ? "bg-black hover:bg-gray-800 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isFormValid}
        >
          Save
        </Button>
      </div>

      {/* Cover Image Selector */}
      <div className="px-4 mb-4">
        <CoverImageSelector
          selectedImage={selectedCoverImage}
          onImageClick={() => setShowImageModal(true)}
        />
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 pb-8 space-y-4 bg-gray-50 overflow-y-auto pt-4">
        {/* Event Title */}
        <div className="bg-white rounded-2xl p-4">
          <input
            type="text"
            placeholder="Event name"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900"
          />
        </div>

        {/* Date & Time Module */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium w-16">Start</span>
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
                {formatTime(startTime)}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-700 font-medium w-16">End</span>
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setShowEndDateModal(true)}
                className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600 text-sm"
              >
                {formatTime(endTime)}
              </button>
            </div>
          </div>
        </div>

        {/* Location Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
              <MapPin className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-2">
                Choose Location
              </label>
              <input
                type="text"
                placeholder="Enter location"
                value={eventAddress}
                onChange={(e) => setEventAddress(e.target.value)}
                className="w-full text-gray-900 bg-transparent border-none outline-none"
              />
            </div>
          </div>
        </div>

        {/* Description Module */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
              <Edit3 className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="text-gray-500 text-sm font-medium block mb-2">
                Add Description
              </label>
              <textarea
                placeholder="Add description about this event..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="w-full text-gray-900 bg-transparent border-none outline-none resize-none"
                rows={4}
              />
            </div>
          </div>
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
    </div>
  );
}