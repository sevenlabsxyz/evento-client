'use client';

import { EventCompactItem } from '@/components/event-compact-item';
import DeleteConfirmationSheet from '@/components/event-detail/delete-confirmation-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EventWithUser } from '@/lib/types/api';
import { Plus, Trash2 } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubEventsManagementPage() {
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const eventId = params.id as string;
  const router = useRouter();

  const { data: subEvents = [], isLoading, error } = useSubEvents(eventId);

  // const deleteSubEvent = useDeleteSubEvent();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EventWithUser | null>(null);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Sub Events',
      leftMode: 'back',
      showAvatar: false,
      centerMode: 'title',
      buttons: [
        {
          id: 'add-sub-event',
          icon: Plus,
          onClick: () => router.push(`/e/create?parent_event_id=${eventId}`),
          label: 'Add Sub Event',
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [eventId, pathname, router, setTopBarForRoute, applyRouteConfig, clearRoute]);

  const handleDelete = async (subEvent: EventWithUser) => {
    // await deleteSubEvent.mutateAsync({
    //   parentEventId: eventId,
    //   subEventId: subEvent.id,
    // });
  };

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      <div className='p-4'>
        {/* List / states */}
        {isLoading ? (
          <div className='space-y-2'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='flex items-center justify-between rounded-xl border border-gray-100 p-3'
              >
                <div className='flex flex-1 items-center gap-3'>
                  <Skeleton className='h-12 w-12 rounded-lg' />
                  <div className='flex-1'>
                    <Skeleton className='mb-2 h-4 w-2/3' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                </div>
                <Skeleton className='h-9 w-9 rounded-full' />
              </div>
            ))}
          </div>
        ) : subEvents.length > 0 ? (
          <div className='space-y-2'>
            {subEvents.map((se) => (
              <div
                key={se.id}
                className='flex items-center justify-between rounded-xl border border-gray-100'
              >
                <div className='flex-1'>
                  <EventCompactItem event={se} />
                </div>
                <button
                  className='mr-2 rounded-full p-2 text-red-600 hover:bg-red-50'
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(se);
                    setConfirmOpen(true);
                  }}
                  aria-label={`Delete ${se.title}`}
                >
                  <Trash2 className='h-5 w-5' />
                </button>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className='rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center'>
            <p className='text-sm text-gray-500'>Failed to load sub events.</p>
          </div>
        ) : (
          <div className='py-12 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <Plus className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>No Sub Events</h3>
            <p className='mb-6 text-sm text-gray-500'>Add sub events to your event</p>
            <button
              onClick={() => router.push(`/e/create?parent_event_id=${eventId}`)}
              className='rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600'
            >
              Add Sub Event
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation sheet */}
      <DeleteConfirmationSheet
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await handleDelete(pendingDelete);
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
        itemType='sub event'
        // isLoading={deleteSubEvent.isPending}
      />
    </div>
  );
}
