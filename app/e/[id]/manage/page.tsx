'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Users, Share2, Music, DollarSign, HelpCircle, UserCheck, MessageCircle, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import CancelEventModal from '@/components/manage-event/cancel-event-modal';
import { getEventById } from '@/lib/data/sample-events';

export default function ManageEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Get existing event data
  const existingEvent = getEventById(eventId);

  const managementOptions = [
    {
      id: 'event-details',
      title: 'Event Details',
      description: 'Name, description, time and location',
      icon: <FileText className="w-6 h-6" />,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      route: `/e/${eventId}/manage/details`
    },
    {
      id: 'guest-list',
      title: 'Guest List',
      description: 'View, manage, and check in guests',
      icon: <Users className="w-6 h-6" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: `/e/${eventId}/manage/guests`
    },
    {
      id: 'hosts',
      title: 'Hosts',
      description: 'Co-hosts & check-in managers',
      icon: <Share2 className="w-6 h-6" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: `/e/${eventId}/manage/hosts`
    },
    {
      id: 'music',
      title: 'Music',
      description: 'Add Spotify and Wavlake tracks',
      icon: <Music className="w-6 h-6" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: `/e/${eventId}/manage/music`
    },
    {
      id: 'contributions',
      title: 'Contributions',
      description: 'Set up payment methods and suggested amounts',
      icon: <DollarSign className="w-6 h-6" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      route: `/e/${eventId}/manage/contributions`
    },
    {
      id: 'registration-questions',
      title: 'Registration Questions',
      description: 'Collect information from guests',
      icon: <HelpCircle className="w-6 h-6" />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      route: `/e/${eventId}/manage/registration`
    }
  ];

  const handleOptionClick = (route: string) => {
    router.push(route);
  };

  const handleCheckInGuests = () => {
    // TODO: Navigate to check-in functionality
    console.log('Check in guests');
  };

  const handleOpenEventChat = () => {
    // TODO: Open event chat functionality
    console.log('Open event chat');
  };

  const handleCancelEvent = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = (sendEmail: boolean) => {
    console.log('Cancelling event, send email:', sendEmail);
    // TODO: Implement actual cancel event functionality
    // In a real app, you would:
    // 1. Cancel the event in the backend
    // 2. Send email notifications if sendEmail is true
    // 3. Navigate back to events list or show success message
    setShowCancelModal(false);
    router.push('/'); // Navigate back to home or events list
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Manage Event</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Square Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {/* Check In Guests Button */}
          <button
            onClick={handleCheckInGuests}
            className="flex flex-col items-center justify-center h-16 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            <UserCheck className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Check In Guests</span>
          </button>

          {/* Open Event Chat Button */}
          <button
            onClick={handleOpenEventChat}
            className="flex flex-col items-center justify-center h-16 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Open Event Chat</span>
          </button>
        </div>

        {/* Management Options */}
        <div className="space-y-1">
        {managementOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.route)}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <div className={`w-12 h-12 ${option.iconBg} rounded-xl flex items-center justify-center`}>
              <div className={option.iconColor}>
                {option.icon}
              </div>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">{option.title}</h3>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </button>
        ))}
        </div>

        {/* Cancel Event */}
        <div className="pt-6">
          <button
            onClick={handleCancelEvent}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 rounded-xl"
          >
            <div className="text-red-600">
              <X className="w-5 h-5" />
            </div>
            <span className="font-medium text-red-600">Cancel Event</span>
          </button>
        </div>
      </div>

      {/* Cancel Event Modal */}
      <CancelEventModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        eventTitle={existingEvent?.title}
      />
    </div>
  );
}