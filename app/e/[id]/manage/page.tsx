'use client';

import CancelEventModal from '@/components/manage-event/cancel-event-modal';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getManageEventOptions } from '@/lib/constants/manage-event-options';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { usePublishEvent } from '@/lib/hooks/use-publish-event';
import { useTopBar } from '@/lib/stores/topbar-store';
import { toast } from '@/lib/utils/toast';
import { ChevronRight, MessageCircle, X } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const skeletonRows = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];

export default function ManageEventPage() {
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const eventId = params.id as string;
  const { data: eventDetails, isLoading, error } = useEventDetails(eventId);
  const publishEvent = usePublishEvent();

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: 'Manage Event',
      leftMode: 'back',
      onBackPress: () => router.push(`/e/${eventId}?from=manage`),
      showAvatar: false,
      subtitle: undefined,
      centerMode: 'title',
      textButtons: [
        {
          id: 'view-event',
          label: 'View ->',
          variant: 'outline',
          onClick: () => router.push(`/e/${eventId}?from=manage`),
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, applyRouteConfig, clearRoute, pathname, router, eventId]);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishSheet, setShowPublishSheet] = useState(false);
  const managementOptions = getManageEventOptions({
    eventId,
    eventType: eventDetails?.type,
    eventStatus: eventDetails?.status,
  });

  const handleOptionClick = (route: string) => {
    router.push(route);
  };

  // const handleOpenEventChat = () => {
  //   // TODO: Open event chat functionality
  //   logger.info('Open event chat');
  // };

  const handleCancelEvent = () => {
    setShowCancelModal(true);
  };

  const handlePublishEvent = async () => {
    try {
      await publishEvent.mutateAsync(eventId);
      toast.success('Event published successfully');
      setShowPublishSheet(false);
      router.push(`/e/${eventId}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to publish event');
    }
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
            {skeletonRows.map((row) => (
              <div key={row} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
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
        {eventDetails?.status === 'draft' && (
          <div className='mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4'>
            <p className='text-sm font-medium text-amber-900'>Event currently in draft</p>
            <p className='mt-1 text-sm text-amber-800'>
              Publish when you are ready to make it visible in feeds and discovery.
            </p>
            <Button className='mt-3 h-11 w-full' onClick={() => setShowPublishSheet(true)}>
              Publish Event
            </Button>
          </div>
        )}

        <div className='space-y-2'>
          {managementOptions.map((option) => {
            const Icon = option.icon;

            return (
              <button
                type='button'
                key={option.id}
                onClick={() => handleOptionClick(option.route)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 transition-colors ${
                  option.isPriority
                    ? 'mb-6 border-blue-200 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`h-12 w-12 ${option.iconBg} flex items-center justify-center rounded-xl`}
                >
                  <div className={option.iconColor}>
                    <Icon className='h-6 w-6' />
                  </div>
                </div>
                <div className='flex-1 text-left'>
                  <h3 className='font-semibold text-gray-900'>{option.title}</h3>
                  <p className='text-sm text-gray-500'>{option.description}</p>
                </div>
                <div className='text-gray-400'>
                  <ChevronRight className='h-5 w-5' />
                </div>
              </button>
            );
          })}
        </div>

        {/* Cancel Event */}
        <div className='pt-6'>
          <button
            type='button'
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

      <MasterScrollableSheet
        title='Publish Event'
        open={showPublishSheet}
        onOpenChange={setShowPublishSheet}
        footer={
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='h-11 flex-1'
              onClick={() => setShowPublishSheet(false)}
              disabled={publishEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              className='h-11 flex-1'
              onClick={handlePublishEvent}
              disabled={publishEvent.isPending}
            >
              {publishEvent.isPending ? 'Publishing...' : 'Yes, Publish'}
            </Button>
          </div>
        }
      >
        <div className='px-4 pb-4 text-sm text-gray-600'>
          Are you sure you want to publish this event? It will be visible in feeds and discovery.
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
