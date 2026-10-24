'use client';

import ManageCohostsSheet from '@/components/manage-event/manage-cohosts-sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import apiClient from '@/lib/api/client';
import {
  useCancelCohostInvite,
  useEventCohostInvites,
  useEventCohosts,
} from '@/lib/hooks/use-cohost-invites';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useTopBar } from '@/lib/stores/topbar-store';
import { CohostInvite, VerificationStatus } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Clock, Crown, Loader2, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HostsManagementPage() {
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;
  const t = useTranslations('manageLegacy');

  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [removingHostId, setRemovingHostId] = useState<string | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<CohostInvite | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);

  const {
    data: existingEvent,
    isLoading: eventLoading,
    error: eventError,
  } = useEventDetails(eventId);
  const {
    data: hosts = [],
    isLoading: hostsLoading,
    refetch: refetchHosts,
  } = useEventCohosts(eventId);
  const { data: pendingInvites = [] } = useEventCohostInvites(eventId, 'pending');
  const cancelInviteMutation = useCancelCohostInvite(eventId);

  const isLoading = eventLoading || hostsLoading;
  const error = eventError;

  const handleCancelInvite = (invite: CohostInvite) => {
    setInviteToCancel(invite);
  };

  const confirmCancelInvite = () => {
    if (inviteToCancel) {
      setCancellingInviteId(inviteToCancel.id);
      cancelInviteMutation.mutate(inviteToCancel.id, {
        onSettled: () => {
          setCancellingInviteId(null);
        },
      });
      setInviteToCancel(null);
    }
  };

  const handleAddCoHost = () => {
    setIsInviteSheetOpen(true);
  };

  const handleRemoveHost = async (hostId: string) => {
    if (removingHostId) return;

    const confirmed = window.confirm(t('hosts.removeConfirm'));
    if (!confirmed) return;

    setRemovingHostId(hostId);
    try {
      await apiClient.delete(`/v1/events/${eventId}/hosts`, { data: { hostId } });
      toast.success(t('hosts.toasts.removed'));
      refetchHosts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('hosts.toasts.removeFailed'));
    } finally {
      setRemovingHostId(null);
    }
  };

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: t('hosts.title'),
      leftMode: 'back',
      showAvatar: false,
      subtitle: '',
      centerMode: 'title',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, pathname, applyRouteConfig, router, eventId, t]);

  if (isLoading) {
    return (
      <div className='space-y-4 py-4 md:py-6'>
        <div className='max-w-2xl space-y-4'>
          <div className='flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !existingEvent) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
            {t('hosts.notFound.title')}
          </h1>
          <p className='mb-4 text-gray-600 dark:text-neutral-400'>
            {t('hosts.notFound.description')}
          </p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            {t('hosts.notFound.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const creatorId = existingEvent.creator_user_id;

  return (
    <>
      <div className='space-y-4 py-4 md:py-6'>
        <div className='max-w-2xl space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
                {t('hosts.heading')}
              </h2>
              <p className='text-sm text-gray-500 dark:text-neutral-400'>
                {t('hosts.description')}
              </p>
            </div>
            <Button onClick={handleAddCoHost} variant='secondary' className='gap-2 rounded-xl'>
              <UserPlus className='h-4 w-4' />
              {t('hosts.inviteCohost')}
            </Button>
          </div>

          <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
            <h3 className='mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
              {t('hosts.hostsTitle')}
            </h3>
            {hosts.length > 0 ? (
              <div className='space-y-3'>
                {hosts.map((host) => {
                  const isCreator = host.id === creatorId;
                  const isIdentityLoading = !host.name && !host.username;
                  const hostDisplayName = host.name || (host.username ? `@${host.username}` : '');
                  const hostHandle = host.username ? `@${host.username}` : '';

                  return (
                    <div
                      key={host.id}
                      className={`flex items-center gap-4 rounded-2xl p-4 ${
                        isCreator
                          ? 'border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
                          : 'bg-gray-50 dark:bg-neutral-800'
                      }`}
                    >
                      <UserAvatar
                        user={{
                          name: host.name ?? undefined,
                          username: host.username,
                          image: host.image,
                          verification_status: host.verification_status as VerificationStatus,
                        }}
                        size='md'
                      />
                      <div className='min-w-0 flex-1'>
                        {isIdentityLoading ? (
                          <div className='space-y-2 py-1'>
                            <Skeleton className='h-5 w-32' />
                            <Skeleton className='h-4 w-24' />
                          </div>
                        ) : (
                          <>
                            <div className='flex items-center gap-2'>
                              <h3 className='truncate font-semibold text-gray-900 dark:text-neutral-100'>
                                {hostDisplayName}
                              </h3>
                              {isCreator && (
                                <span className='flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'>
                                  <Crown className='h-3 w-3' />
                                  {t('hosts.creator')}
                                </span>
                              )}
                            </div>
                            <p className='text-sm text-gray-500 dark:text-neutral-400'>
                              {hostHandle}
                            </p>
                          </>
                        )}
                      </div>
                      {!isCreator && !isIdentityLoading && (
                        <button
                          onClick={() => handleRemoveHost(host.id)}
                          disabled={removingHostId === host.id}
                          className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-red-400'
                          aria-label={t('hosts.removeAria', {
                            name: host.name || host.username || '',
                          })}
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      )}
                      {!isCreator && isIdentityLoading && (
                        <Skeleton className='h-8 w-8 rounded-full' />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='py-12 text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
                  <Plus className='h-8 w-8 text-gray-400 dark:text-neutral-400' />
                </div>
                <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
                  {t('hosts.empty.title')}
                </h3>
                <p className='mb-6 text-sm text-gray-500 dark:text-neutral-400'>
                  {t('hosts.empty.description')}
                </p>
                <button
                  onClick={handleAddCoHost}
                  className='rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  {t('hosts.empty.addCohost')}
                </button>
              </div>
            )}
          </div>

          {pendingInvites.length > 0 && (
            <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
              <h3 className='mb-3 text-sm font-semibold text-gray-900 dark:text-neutral-100'>
                {t('hosts.pendingInvites.title')}
              </h3>
              <div className='space-y-2'>
                {pendingInvites.map((invite) => {
                  const isCancelling = cancellingInviteId === invite.id;
                  return (
                    <div
                      key={invite.id}
                      className={`flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 transition-opacity dark:border-amber-900 dark:bg-amber-950/40 ${
                        isCancelling ? 'opacity-50' : ''
                      }`}
                    >
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60'>
                        {isCancelling ? (
                          <Loader2 className='h-4 w-4 animate-spin text-amber-600 dark:text-amber-400' />
                        ) : (
                          <Clock className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-gray-900 dark:text-neutral-100'>
                          {invite.invitee?.username
                            ? `@${invite.invitee.username}`
                            : invite.invitee_email}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-neutral-400'>
                          {isCancelling
                            ? t('hosts.pendingInvites.cancelling')
                            : t('hosts.pendingInvites.pending')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(invite)}
                        disabled={isCancelling || cancelInviteMutation.isPending}
                        className='flex h-8 w-8 items-center justify-center rounded-full hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-amber-900/60'
                      >
                        <X className='h-4 w-4 text-gray-500 dark:text-neutral-400' />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <ManageCohostsSheet
        eventId={eventId}
        isOpen={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
      />

      <AlertDialog open={!!inviteToCancel} onOpenChange={() => setInviteToCancel(null)}>
        <AlertDialogContent className='max-w-sm rounded-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hosts.cancelDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich('hosts.cancelDialog.description', {
                invitee: inviteToCancel?.invitee?.username
                  ? `@${inviteToCancel.invitee.username}`
                  : (inviteToCancel?.invitee_email ?? ''),
                strong: (chunks) => (
                  <span className='font-medium text-gray-900 dark:text-neutral-100'>{chunks}</span>
                ),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('hosts.cancelDialog.keep')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvite}
              className='bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            >
              {t('hosts.cancelDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
