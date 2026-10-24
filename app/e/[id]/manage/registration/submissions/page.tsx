'use client';

import { RegistrationDetailSheet } from '@/components/manage-event/registration-detail-sheet';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
import { useDenyRegistration } from '@/lib/hooks/use-deny-registration';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useRegistrationSubmissions } from '@/lib/hooks/use-registration-submissions';
import { queryKeys } from '@/lib/query-client';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { RegistrationStatus, RegistrationSubmission } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { format, type Locale } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { CheckCircle, ChevronRight, ClipboardList, Clock, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TabStatus = RegistrationStatus;

function getDateFnsLocale(locale: string): Locale {
  if (locale === 'pt-BR') return ptBR;
  if (locale === 'es') return es;
  return enUS;
}

export default function RegistrationSubmissionsPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { setTopBarForRoute, applyRouteConfig, clearRoute } = useTopBar();
  const eventId = params.id as string;
  const t = useTranslations('manageLegacy');
  const submissionsTitle = t('registrationSubmissions.topBarTitle');

  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: submissionsTitle,
      leftMode: 'back',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
      buttons: [],
      textButtons: [],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [
    eventId,
    router,
    pathname,
    setTopBarForRoute,
    applyRouteConfig,
    clearRoute,
    submissionsTitle,
  ]);

  // Get existing event data from API
  const { data: existingEvent, isLoading: isLoadingEvent, error } = useEventDetails(eventId);

  // Get registration submissions
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useRegistrationSubmissions(
    eventId,
    { status: activeTab }
  );

  // Mutations
  const approveRegistration = useApproveRegistration();
  const denyRegistration = useDenyRegistration();
  const queryClient = useQueryClient();

  const isLoadingInitialPage = isLoadingEvent;

  const registrations = submissionsData?.registrations ?? [];
  const filteredRegistrations = registrations.filter(
    (registration) => registration.approval_status === activeTab
  );
  const counts = submissionsData?.counts ?? { pending: 0, approved: 0, denied: 0 };
  const totalCount = counts.pending + counts.approved + counts.denied;

  const tabs: { key: TabStatus; label: string; count: number }[] = [
    { key: 'pending', label: t('registrationSubmissions.status.pending'), count: counts.pending },
    {
      key: 'approved',
      label: t('registrationSubmissions.status.approved'),
      count: counts.approved,
    },
    { key: 'denied', label: t('registrationSubmissions.status.denied'), count: counts.denied },
  ];

  const handleApprove = async (registrationId: string) => {
    try {
      await approveRegistration.mutateAsync({ eventId, registrationId });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
      toast.success(t('registrationSubmissions.toasts.approved'));
    } catch {
      toast.error(t('registrationSubmissions.toasts.approveFailed'));
    }
  };

  const handleDeny = async (registrationId: string, reason?: string) => {
    try {
      await denyRegistration.mutateAsync({
        eventId,
        registrationId,
        reason,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDashboard(eventId) });
      toast.success(t('registrationSubmissions.toasts.denied'));
    } catch {
      toast.error(t('registrationSubmissions.toasts.denyFailed'));
    }
  };

  const handleOpenDetail = (registrationId: string) => {
    setSelectedRegistrationId(registrationId);
  };

  const handleCloseDetail = () => {
    setSelectedRegistrationId(null);
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    const styles: Record<RegistrationStatus, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-400',
      approved: 'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-400',
      denied: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400',
    };

    const labels: Record<RegistrationStatus, string> = {
      pending: t('registrationSubmissions.status.pending'),
      approved: t('registrationSubmissions.status.approved'),
      denied: t('registrationSubmissions.status.denied'),
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const listSkeleton = (
    <div className='space-y-3'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className='flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'
        >
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
          </div>
          <Skeleton className='h-6 w-16 rounded-full' />
        </div>
      ))}
    </div>
  );

  const pageIntro = (
    <div className='space-y-1'>
      <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
        {t('registrationSubmissions.title')}
      </h2>
      <p className='text-sm text-gray-500 dark:text-neutral-400'>
        {t('registrationSubmissions.subtitle')}
      </p>
    </div>
  );

  if (isLoadingInitialPage) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        {pageIntro}
        <div className='flex space-x-1'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-10 w-20 rounded-lg' />
          ))}
        </div>
        {listSkeleton}
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('registrationSubmissions.eventNotFound.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('registrationSubmissions.eventNotFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('registration.invalidType.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const isReviewing = approveRegistration.isPending || denyRegistration.isPending;

  return (
    <div className='space-y-4 py-4 md:py-6'>
      {pageIntro}

      {/* Tabs */}
      <div className='max-w-md'>
        <AnimatedTabs
          tabs={tabs.map((tab) => ({
            title:
              tab.count > 0
                ? t('registrationSubmissions.tabWithCount', { label: tab.label, count: tab.count })
                : tab.label,
            icon: tab.key === 'pending' ? Clock : tab.key === 'approved' ? CheckCircle : XCircle,
            onClick: () => setActiveTab(tab.key),
          }))}
          selected={tabs.findIndex((tab) => tab.key === activeTab)}
        />
      </div>

      {/* Content */}
      {isLoadingSubmissions ? (
        listSkeleton
      ) : filteredRegistrations.length > 0 ? (
        <>
          {/* Mobile cards */}
          <div className='space-y-3 md:hidden'>
            {filteredRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                onClick={() => handleOpenDetail(registration.id)}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className='hidden overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:block'>
            <table className='w-full text-left text-sm'>
              <thead className='border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'>
                <tr>
                  <th className='px-4 py-3'>{t('registrationSubmissions.table.guest')}</th>
                  <th className='px-4 py-3'>{t('registrationSubmissions.table.submitted')}</th>
                  <th className='px-4 py-3'>{t('registrationSubmissions.table.status')}</th>
                  <th className='px-4 py-3 text-right'>
                    {t('registrationSubmissions.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 dark:divide-neutral-800'>
                {filteredRegistrations.map((registration) => (
                  <RegistrationTableRow
                    key={registration.id}
                    registration={registration}
                    onView={() => handleOpenDetail(registration.id)}
                    onApprove={() => handleApprove(registration.id)}
                    onDeny={() => handleDeny(registration.id)}
                    isReviewing={isReviewing}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className='rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-neutral-800 dark:bg-neutral-900'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
            <ClipboardList className='h-8 w-8 text-gray-400 dark:text-neutral-500' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
            {t('registrationSubmissions.empty.title')}
          </h3>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {activeTab === 'pending' && t('registrationSubmissions.empty.pending')}
            {activeTab === 'approved' && t('registrationSubmissions.empty.approved')}
            {activeTab === 'denied' && t('registrationSubmissions.empty.denied')}
          </p>
        </div>
      )}

      {/* Registration Detail Sheet */}
      <RegistrationDetailSheet
        eventId={eventId}
        registrationId={selectedRegistrationId}
        isOpen={!!selectedRegistrationId}
        onClose={handleCloseDetail}
        onApprove={handleApprove}
        onDeny={handleDeny}
        isApproving={approveRegistration.isPending}
        isDenying={denyRegistration.isPending}
      />

      {/* Summary */}
      <div className='flex items-center justify-between text-sm text-gray-600 dark:text-neutral-400'>
        {isLoadingSubmissions ? (
          <>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-24' />
          </>
        ) : (
          <>
            <span>{t('registrationSubmissions.summary.total', { count: totalCount })}</span>
            <span>
              {t('registrationSubmissions.summary.showing', {
                status: activeTab,
                count: filteredRegistrations.length,
              })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function getRegistrationName(registration: RegistrationSubmission) {
  return registration.user_details?.name || registration.name;
}

interface RegistrationTableRowProps {
  registration: RegistrationSubmission;
  onView: () => void;
  onApprove: () => void;
  onDeny: () => void;
  isReviewing: boolean;
  getStatusBadge: (status: RegistrationStatus) => React.ReactNode;
}

function RegistrationTableRow({
  registration,
  onView,
  onApprove,
  onDeny,
  isReviewing,
  getStatusBadge,
}: RegistrationTableRowProps) {
  const t = useTranslations('manageLegacy');
  const dateLocale = getDateFnsLocale(useLocale());
  return (
    <tr className='transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800'>
      <td className='px-4 py-3'>
        <button onClick={onView} className='flex min-w-0 items-center gap-3 text-left'>
          <UserAvatar
            user={{
              name: getRegistrationName(registration),
              username: registration.user_details?.username,
              image: registration.user_details?.image,
              verification_status: registration.user_details?.verification_status,
            }}
            height={36}
            width={36}
          />
          <div className='min-w-0'>
            <p className='truncate font-medium text-gray-900 dark:text-neutral-100'>
              {getRegistrationName(registration)}
            </p>
            <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
              {registration.email}
            </p>
          </div>
        </button>
      </td>
      <td className='whitespace-nowrap px-4 py-3 text-gray-500 dark:text-neutral-400'>
        {format(new Date(registration.created_at), 'MMM d, yyyy', { locale: dateLocale })}
      </td>
      <td className='px-4 py-3'>{getStatusBadge(registration.approval_status)}</td>
      <td className='px-4 py-3'>
        <div className='flex items-center justify-end gap-2'>
          {registration.approval_status === 'pending' && (
            <>
              <button
                onClick={onDeny}
                disabled={isReviewing}
                className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
              >
                {t('registrationSubmissions.actions.deny')}
              </button>
              <button
                onClick={onApprove}
                disabled={isReviewing}
                className='rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50'
              >
                {t('registrationSubmissions.actions.approve')}
              </button>
            </>
          )}
          <button
            onClick={onView}
            className='rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
          >
            {t('registrationSubmissions.actions.view')}
          </button>
        </div>
      </td>
    </tr>
  );
}

interface RegistrationCardProps {
  registration: RegistrationSubmission;
  onClick: () => void;
  getStatusBadge: (status: RegistrationStatus) => React.ReactNode;
}

function RegistrationCard({ registration, onClick, getStatusBadge }: RegistrationCardProps) {
  const t = useTranslations('manageLegacy');
  const dateLocale = getDateFnsLocale(useLocale());
  return (
    <button
      onClick={onClick}
      className='w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800'
    >
      <div className='flex items-start gap-4'>
        <UserAvatar
          user={{
            name: registration.user_details?.name || registration.name,
            username: registration.user_details?.username,
            image: registration.user_details?.image,
            verification_status: registration.user_details?.verification_status,
          }}
          height={48}
          width={48}
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              <h3 className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                {registration.user_details?.name || registration.name}
              </h3>
              {registration.user_details?.username && (
                <p className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                  @{registration.user_details.username}
                </p>
              )}
            </div>
            <div className='flex flex-shrink-0 items-center gap-2'>
              {getStatusBadge(registration.approval_status)}
              <ChevronRight className='h-5 w-5 text-gray-400 dark:text-neutral-500' />
            </div>
          </div>
          <p className='mt-1 text-xs text-gray-400 dark:text-neutral-500'>
            {t('registrationSubmissions.submittedOn', {
              date: format(new Date(registration.created_at), 'MMM d, yyyy', {
                locale: dateLocale,
              }),
            })}
          </p>
        </div>
      </div>
    </button>
  );
}
