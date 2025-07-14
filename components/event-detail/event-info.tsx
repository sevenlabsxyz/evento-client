'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Mail, Share, MoreHorizontal, Star, CalendarPlus, ExternalLink, Flag } from 'lucide-react';
import { Event } from '@/lib/types/event';
import OwnerEventButtons from './owner-event-buttons';

interface EventInfoProps {
  event: Event;
  currentUserId?: string;
}

export default function EventInfo({ event, currentUserId = 'current-user-id' }: EventInfoProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const handleRegister = () => {
    if (event.registrationUrl) {
      window.open(event.registrationUrl, '_blank');
    }
  };

  const handleContact = () => {
    setShowContactModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSendMessage = () => {
    console.log('Sending message:', contactMessage);
    setShowContactModal(false);
    setContactMessage('');
  };

  const handleAddToCalendar = () => {
    // Generate .ics file content
    const formatICSDate = (dateStr: string) => {
      // Convert ISO date to ICS format: YYYYMMDDTHHMMSSZ
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeICS = (text: string) => {
      return text.replace(/[\n\r]/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    };

    const location = `${event.location.name}, ${event.location.address || ''}, ${event.location.city}, ${event.location.state || ''} ${event.location.zipCode || ''}`.replace(/,\s*,/g, ',').trim();
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Evento//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@evento.so`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(event.computedStartDate)}`,
      `DTEND:${formatICSDate(event.computedEndDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description.replace(/<[^>]*>/g, ''))}`,
      `LOCATION:${escapeICS(location)}`,
      event.registrationUrl ? `URL:${event.registrationUrl}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    // Create and download .ics file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowMoreModal(false);
  };

  const handleOpenInSafari = () => {
    if (event.registrationUrl) {
      window.open(event.registrationUrl, '_blank');
    }
    setShowMoreModal(false);
  };

  const handleReportEvent = () => {
    console.log('Event reported:', event.id);
    setShowMoreModal(false);
    // Could show a toast notification here
  };

  // Check if current user is the event owner
  const isOwner = event.owner?.id === currentUserId;

  return (
    <>
      <div className="py-6 space-y-6">
        {/* Date and Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{event.date}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>
              {event.startTime} - {event.endTime}
              {event.timezone && ` ${event.timezone}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span>{event.location.name}</span>
          </div>
        </div>

        {/* Action Buttons - Different for owners vs guests */}
        {isOwner ? (
          <OwnerEventButtons eventId={event.id} />
        ) : (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleRegister}
            className="flex flex-col items-center justify-center h-16 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            <Star className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Register</span>
          </button>
          
          <button
            onClick={handleContact}
            className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Mail className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Contact</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Share className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Share</span>
          </button>
          
          <button 
            onClick={() => setShowMoreModal(true)}
            className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
        )}
      </div>

      {/* Contact Host Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Contact Host</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                ×
              </button>
            </div>
            
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Please enter your question for the host..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
                disabled={!contactMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Options Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">More Options</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleAddToCalendar}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CalendarPlus className="w-5 h-5 text-gray-600" />
                <span>Add to Calendar</span>
              </button>
              
              <button
                onClick={handleOpenInSafari}
                className="w-full flex items-center gap-3 p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-gray-600" />
                <span>Open in Safari</span>
              </button>

              <button
                onClick={handleReportEvent}
                className="w-full flex items-center gap-3 p-3 text-left border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Flag className="w-5 h-5" />
                <span>Report Event</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowMoreModal(false)}
              className="w-full mt-4 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}