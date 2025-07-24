'use client';

import CancelEventModal from '@/components/manage-event/cancel-event-modal';
import { useEventDetails } from '@/lib/hooks/useEventDetails';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  DollarSign,
  FileText,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  Music,
  Share2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ManageEventPage() {
  const { setTopBar } = useTopBar();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: eventDetails, isLoading, error } = useEventDetails(eventId);

  // Set TopBar content
  useEffect(() => {
    setTopBar({
      title: 'Manage Event',
      leftMode: 'back',
      showAvatar: false,
      subtitle: undefined,
      centerMode: 'title',
    });

    // Cleanup function to reset topbar state when leaving this page
    return () => {
      setTopBar({
        title: '',
        leftMode: 'menu',
        showAvatar: true,
        subtitle: '',
        centerMode: 'title',
      });
    };
  }, [setTopBar]);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const managementOptions = [
    {
      id: 'event-details',
      title: 'Event Details',
      description: 'Name, description, time and location',
      icon: <FileText className='h-6 w-6' />,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      route: `/e/${eventId}/manage/details`,
    },
    {
      id: 'guest-list',
      title: 'Guest List',
      description: 'View, manage, and check in guests',
      icon: <Users className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: `/e/${eventId}/manage/guests`,
    },
    {
      id: 'email-blast',
      title: 'Email Blast',
      description: 'Send emails to guests',
      icon: <Mail className='h-6 w-6' />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: `/e/${eventId}/manage/email-blast`,
    },
    {
      id: 'hosts',
      title: 'Hosts',
      description: 'Co-hosts & check-in managers',
      icon: <Share2 className='h-6 w-6' />,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      route: `/e/${eventId}/manage/hosts`,
    },
    {
      id: 'music',
      title: 'Music',
      description: 'Add Spotify and Wavlake tracks',
      icon: <Music className='h-6 w-6' />,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      route: `/e/${eventId}/manage/music`,
    },
    {
      id: 'contributions',
      title: 'Contributions',
      description: 'Set up payment methods and suggested amounts',
      icon: <DollarSign className='h-6 w-6' />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      route: `/e/${eventId}/manage/contributions`,
    },
    {
      id: 'registration-questions',
      title: 'Registration Questions',
      description: 'Collect information from guests',
      icon: <HelpCircle className='h-6 w-6' />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      route: `/e/${eventId}/manage/registration`,
    },
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

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-red-500' />
          <p className='text-gray-600'>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <MessageCircle className='mx-auto mb-4 h-8 w-8 text-red-500' />
          <p className='text-gray-600'>Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Content */}
      <div className='p-4'>
        {/* Square Action Buttons */}
        <div className='mb-6 grid grid-cols-2 gap-2'>
          {/* Check In Guests Button */}
          <button
            onClick={handleCheckInGuests}
            className='flex h-16 flex-col items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600'
          >
            <UserCheck className='mb-1 h-5 w-5' />
            <span className='text-xs font-medium'>Check In Guests</span>
          </button>

          {/* Open Event Chat Button */}
          <button
            onClick={handleOpenEventChat}
            className='flex h-16 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200'
          >
            <MessageCircle className='mb-1 h-5 w-5' />
            <span className='text-xs font-medium'>Open Event Chat</span>
          </button>
        </div>

        {/* Management Options */}
        <div className='space-y-1'>
          {managementOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.route)}
              className='flex w-full items-center gap-4 rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100'
            >
              <div
                className={`h-12 w-12 ${option.iconBg} flex items-center justify-center rounded-xl`}
              >
                <div className={option.iconColor}>{option.icon}</div>
              </div>
              <div className='flex-1 text-left'>
                <h3 className='font-semibold text-gray-900'>{option.title}</h3>
                <p className='text-sm text-gray-500'>{option.description}</p>
              </div>
              <div className='text-gray-400'>
                <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='m9 18 6-6-6-6'
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel Event */}
        <div className='pt-6'>
          <button
            onClick={handleCancelEvent}
            className='flex w-full items-center gap-3 rounded-xl p-4 hover:bg-red-50'
          >
            <div className='text-red-600'>
              <X className='h-5 w-5' />
            </div>
            <span className='font-medium text-red-600'>Cancel Event</span>
          </button>
        </div>
      </div>

      {/* Cancel Event Modal */}
      <CancelEventModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        eventId={eventId}
        eventTitle={eventDetails?.title}
      />
    </div>
  );
}
