'use client';

import { X, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EventCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: {
    id: string;
    title: string;
    date: Date;
    time: { hour: number; minute: number; period: 'AM' | 'PM' };
  };
}

export default function EventCreatedModal({ isOpen, onClose, eventData }: EventCreatedModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (time: { hour: number; minute: number; period: 'AM' | 'PM' }) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')} ${time.period}`;
  };

  const handleViewEvent = () => {
    onClose();
    router.push(`/e/event/${eventData.id}`);
  };

  const handleInviteGuests = () => {
    onClose();
    router.push(`/e/event/${eventData.id}/invite`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Close Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-8">
          <Check className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-medium text-gray-400 mb-4">Event Created!</h1>

        {/* Event Name */}
        <h2 className="text-4xl font-bold text-gray-900 mb-8">{eventData.title}</h2>

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-gray-500 mb-16">
          <Clock className="w-5 h-5" />
          <span className="text-lg">
            {formatDate(eventData.date)} at {formatTime(eventData.time)} PDT
          </span>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleViewEvent}
            className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg"
          >
            View Event Page
          </button>
          
          <button
            onClick={handleInviteGuests}
            className="w-full py-4 text-gray-500 font-medium text-lg"
          >
            Invite Guests
          </button>
        </div>
      </div>
    </div>
  );
}