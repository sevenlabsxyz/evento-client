'use client';

import CancelEventModal from '@/components/manage-event/cancel-event-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useTopBar } from '@/lib/stores/topbar-store';
import {
  DollarSign,
  FileText,
  HelpCircle,
  // Layers,
  Mail,
  MessageCircle,
  Music,
  UserPlus,
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
      onBackPress: () => router.push(`/e/${eventId}`),
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
      description: 'Setup event time and location',
      icon: <FileText className='h-6 w-6' />,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      route: `/e/${eventId}/manage/details`,
    },
    {
      id: 'guest-list',
      title: 'Guest List',
      description: 'View guests and invites',
      icon: <Users className='h-6 w-6' />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      route: `/e/${eventId}/manage/guests`,
    },
    {
      id: 'cohosts',
      title: 'Cohosts',
      description: 'Invite others to help manage',
      icon: <UserPlus className='h-6 w-6' />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      route: `/e/${eventId}/manage/hosts`,
    },
    {
      id: 'email-blasts',
      title: 'Email Blasts',
      description: 'Send emails to guests',
      icon: <Mail className='h-6 w-6' />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      route: `/e/${eventId}/manage/email-blast`,
    },
    // {
    //   id: 'sub-events',
    //   title: 'Sub Events',
    //   description: 'Create and manage sub events',
    //   icon: <Layers className='h-6 w-6' />,
    //   iconBg: 'bg-teal-100',
    //   iconColor: 'text-teal-600',
    //   route: `/e/${eventId}/manage/sub-events`,
    // },
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
      description: 'Accept event donations',
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

  // const handleOpenEventChat = () => {
  //   // TODO: Open event chat functionality
  //   console.log('Open event chat');
  // };

  const handleCancelEvent = () => {
    setShowCancelModal(true);
  };

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-md'>
        <div className='space-y-6 p-4'>
          {/* Action buttons skeleton */}
          <div className='flex gap-2'>
            <Skeleton className='h-16 flex-1 rounded-xl' />
          </div>
          {/* Management options skeleton */}
          <div className='space-y-1'>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
                <Skeleton className='h-12 w-12 rounded-xl' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-48' />
                </div>
                <Skeleton className='h-5 w-5' />
              </div>
            ))}
          </div>
          {/* Cancel button skeleton */}
          <div className='pt-6'>
            <div className='flex items-center gap-3 rounded-xl p-4'>
              <Skeleton className='h-5 w-5' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>
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
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-md'>
      {/* Content */}
      <div className='p-4'>
        {/* Square Action Buttons */}
        {/*<div className="mb-6 flex gap-2 [&>*]:flex-1">*/}
        {/* Check In Guests Button */}
        {/* <button
            onClick={handleCheckInGuests}
            className='flex h-16 flex-col items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600'
          >
            <UserCheck className='mb-1 h-5 w-5' />
            <span className='text-xs font-medium'>Check In Guests</span>
          </button> */}

        {/* Open Event Chat Button */}
        {/*</div>*/}

        {/* Management Options */}
        <div className='space-y-2'>
          {managementOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.route)}
              className='flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100'
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
            className='flex w-full items-center gap-3 rounded-xl bg-gray-50 p-4 hover:bg-red-50'
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
