'use client';

import { ManageEventHeader } from '@/components/manage-dashboard/manage-event-header';
import {
  getActiveManageNavItemId,
  getManageBasePath,
  getManageNavSections,
} from '@/components/manage-dashboard/manage-nav';
import { ManageSectionNav } from '@/components/manage-dashboard/manage-section-nav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventDashboard } from '@/lib/hooks/use-event-dashboard';
import { getErrorMessage } from '@/lib/utils/error-message';
import { CircleAlert, SearchX } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo } from 'react';

interface ManageLayoutProps {
  children: ReactNode;
  params: { id: string };
}

const SHELL_CLASS = 'min-h-full bg-white dark:bg-neutral-950';
const CONTAINER_CLASS = 'mx-auto w-full max-w-6xl px-4 md:px-6';

function ManageShellSkeleton() {
  return (
    <div className={SHELL_CLASS} aria-busy='true' aria-label='Loading event dashboard'>
      <div className={CONTAINER_CLASS}>
        <div className='flex items-center gap-3 py-4 md:gap-4 md:py-6'>
          <Skeleton className='h-14 w-14 shrink-0 rounded-xl md:h-16 md:w-16' />
          <div className='min-w-0 flex-1 space-y-2'>
            <Skeleton className='h-6 w-48 md:w-72' />
            <Skeleton className='h-4 w-40 md:w-56' />
            <div className='flex gap-1.5'>
              <Skeleton className='h-5 w-16 rounded-full' />
              <Skeleton className='h-5 w-14 rounded-full' />
              <Skeleton className='h-5 w-12 rounded-full' />
            </div>
          </div>
        </div>
        <div className='flex gap-2 overflow-hidden py-2 md:hidden'>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className='h-8 w-24 shrink-0 rounded-full' />
          ))}
        </div>
        <div className='flex gap-8 pb-8 md:pt-2'>
          <div className='hidden w-60 shrink-0 space-y-2 md:block'>
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className='h-9 w-full rounded-lg' />
            ))}
          </div>
          <div className='min-w-0 flex-1 space-y-4 py-4 md:py-0'>
            <Skeleton className='h-28 w-full rounded-2xl' />
            <Skeleton className='h-64 w-full rounded-2xl' />
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageStateCard({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className={`${SHELL_CLASS} flex items-center justify-center px-4 py-16`}>
      <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
          {icon}
        </div>
        <h2 className='text-base font-semibold text-gray-900 dark:text-neutral-100'>{title}</h2>
        <p className='mt-1 text-sm text-gray-500 dark:text-neutral-400'>{description}</p>
        <div className='mt-5 flex justify-center'>{action}</div>
      </div>
    </div>
  );
}

export default function ManageLayout({ children, params }: ManageLayoutProps) {
  const eventId = params.id;
  const router = useRouter();
  const pathname = usePathname();
  const { data, error, isPending, isRefetching, refetch } = useEventDashboard(eventId);
  const errorStatus = error?.status;

  useEffect(() => {
    if (errorStatus === 403) {
      router.replace(`/e/${eventId}`);
    }
  }, [errorStatus, eventId, router]);

  const event = data?.event;
  const pendingRegistrations = data?.registration?.pending;

  const sections = useMemo(
    () =>
      event
        ? getManageNavSections(
            { id: event.id, type: event.type, status: event.status },
            { pendingRegistrations }
          )
        : [],
    [event, pendingRegistrations]
  );

  const activeItemId = useMemo(
    () => getActiveManageNavItemId(sections, pathname, getManageBasePath(eventId)),
    [sections, pathname, eventId]
  );

  if (errorStatus === 403) {
    return null;
  }

  if (!data) {
    if (isPending) {
      return <ManageShellSkeleton />;
    }

    if (errorStatus === 404) {
      return (
        <ManageStateCard
          icon={<SearchX className='h-6 w-6 text-gray-500 dark:text-neutral-400' />}
          title='Event not found'
          description='This event may have been deleted or the link is incorrect.'
          action={
            <Button asChild variant='outline' size='sm' className='dark:bg-neutral-900'>
              <Link href='/e/hub'>Back to hub</Link>
            </Button>
          }
        />
      );
    }

    return (
      <ManageStateCard
        icon={<CircleAlert className='h-6 w-6 text-red-500 dark:text-red-400' />}
        title='Could not load the dashboard'
        description={error ? getErrorMessage(error) : 'Something went wrong. Please try again.'}
        action={
          <Button size='sm' onClick={() => void refetch()} disabled={isRefetching}>
            {isRefetching ? 'Retrying...' : 'Try again'}
          </Button>
        }
      />
    );
  }

  return (
    <div className={SHELL_CLASS}>
      <div className={CONTAINER_CLASS}>
        <div className='py-4 md:py-6'>
          <ManageEventHeader event={data.event} />
        </div>

        <ManageSectionNav
          sections={sections}
          activeItemId={activeItemId}
          variant='pills'
          className='sticky top-0 z-20 -mx-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-neutral-800 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/80 md:hidden'
        />

        <div className='flex gap-8 pb-8 md:border-t md:border-gray-200 md:pt-6 md:dark:border-neutral-800'>
          <aside className='hidden w-60 shrink-0 md:block'>
            <ManageSectionNav
              sections={sections}
              activeItemId={activeItemId}
              variant='sidebar'
              className='sticky top-6 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pb-4 pr-1 [scrollbar-width:thin]'
            />
          </aside>
          <div className='min-w-0 flex-1'>{children}</div>
        </div>
      </div>
    </div>
  );
}
