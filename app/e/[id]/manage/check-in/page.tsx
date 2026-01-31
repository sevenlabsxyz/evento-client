'use client';

import { CheckInResultSheet } from '@/components/ticketing/check-in-result-sheet';
import { TicketScanner } from '@/components/ticketing/ticket-scanner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCheckIn } from '@/lib/hooks/use-check-in';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventAttendees } from '@/lib/hooks/use-event-sales';
import { useTopBar } from '@/lib/stores/topbar-store';
import { CheckInResponse } from '@/lib/types/api';
import { CheckCircle, List, QrCode, Users } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type ViewMode = 'scanner' | 'list';

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const eventId = params.id as string;

  const { data: event, isLoading: eventLoading, error: eventError } = useEventDetails(eventId);
  const { data: attendeesData, isLoading: attendeesLoading } = useEventAttendees(eventId);
  const checkInMutation = useCheckIn();

  const [viewMode, setViewMode] = useState<ViewMode>('scanner');
  const [resultSheetOpen, setResultSheetOpen] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const attendees = attendeesData?.attendees || [];
  const checkedInCount = attendees.filter((a) => a.checked_in_at).length;

  // Configure TopBar
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Check-In',
      leftMode: 'back',
      centerMode: 'title',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [applyRouteConfig, clearRoute, pathname, setTopBarForRoute]);

  const handleScan = useCallback(
    async (token: string) => {
      setLastError(null);
      setLastResult(null);

      try {
        const result = await checkInMutation.mutateAsync({ eventId, token });
        setLastResult(result);
        setResultSheetOpen(true);
      } catch (error: any) {
        setLastError(error.message || 'Invalid ticket');
        setResultSheetOpen(true);
      }
    },
    [eventId, checkInMutation]
  );

  const handleScanAgain = () => {
    setResultSheetOpen(false);
    setLastResult(null);
    setLastError(null);
  };

  const isLoading = eventLoading;

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          <Skeleton className='h-64 w-full rounded-xl' />
          <Skeleton className='h-20 w-full rounded-xl' />
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>
            The event you&apos;re trying to manage doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      <div className='space-y-4 p-4'>
        {/* Stats */}
        <div className='flex items-center justify-between rounded-xl bg-green-50 p-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
              <Users className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <p className='text-sm text-green-700'>Checked In</p>
              <p className='text-2xl font-bold text-green-900'>
                {checkedInCount} / {attendees.length}
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className='flex gap-2'>
          <Button
            variant={viewMode === 'scanner' ? 'default' : 'outline'}
            className='flex-1 rounded-full'
            onClick={() => setViewMode('scanner')}
          >
            <QrCode className='mr-2 h-4 w-4' />
            Scanner
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            className='flex-1 rounded-full'
            onClick={() => setViewMode('list')}
          >
            <List className='mr-2 h-4 w-4' />
            Attendees
          </Button>
        </div>

        {/* Content */}
        {viewMode === 'scanner' ? (
          <TicketScanner onScan={handleScan} isProcessing={checkInMutation.isPending} />
        ) : (
          <AttendeeList attendees={attendees} isLoading={attendeesLoading} />
        )}
      </div>

      {/* Check-In Result Sheet */}
      <CheckInResultSheet
        result={lastResult}
        error={lastError}
        open={resultSheetOpen}
        onOpenChange={setResultSheetOpen}
        onScanAgain={handleScanAgain}
      />
    </div>
  );
}

interface AttendeeListProps {
  attendees: Array<{
    id: string;
    user_id?: string;
    email?: string;
    name?: string;
    ticket_type_name: string;
    checked_in_at?: string;
  }>;
  isLoading: boolean;
}

function AttendeeList({ attendees, isLoading }: AttendeeListProps) {
  if (isLoading) {
    return (
      <div className='space-y-2'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-16 w-full rounded-lg' />
        ))}
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className='rounded-xl bg-gray-50 p-8 text-center'>
        <Users className='mx-auto h-10 w-10 text-gray-300' />
        <p className='mt-2 text-gray-500'>No tickets sold yet</p>
      </div>
    );
  }

  // Sort: checked-in first, then by name
  const sortedAttendees = [...attendees].sort((a, b) => {
    if (a.checked_in_at && !b.checked_in_at) return -1;
    if (!a.checked_in_at && b.checked_in_at) return 1;
    return (a.name || a.email || '').localeCompare(b.name || b.email || '');
  });

  return (
    <div className='space-y-2'>
      {sortedAttendees.map((attendee) => {
        const isCheckedIn = !!attendee.checked_in_at;
        return (
          <div
            key={attendee.id}
            className={`flex items-center justify-between rounded-lg border p-3 ${
              isCheckedIn ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium text-gray-900'>
                {attendee.name || attendee.email || 'Unknown'}
              </p>
              <p className='text-sm text-gray-500'>{attendee.ticket_type_name}</p>
            </div>
            {isCheckedIn && (
              <div className='flex items-center gap-1 text-green-600'>
                <CheckCircle className='h-5 w-5' />
                <span className='text-xs'>
                  {new Date(attendee.checked_in_at!).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
