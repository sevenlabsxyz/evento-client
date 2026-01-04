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
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import apiClient from '@/lib/api/client';
import { useCancelCohostInvite, useEventCohostInvites } from '@/lib/hooks/use-cohost-invites';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useTopBar } from '@/lib/stores/topbar-store';
import { CohostInvite } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Clock, Crown, Plus, Trash2, X } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HostsManagementPage() {
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const eventId = params.id as string;

  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [removingHostId, setRemovingHostId] = useState<string | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<CohostInvite | null>(null);

  const { data: existingEvent, isLoading, error, refetch } = useEventDetails(eventId);
  const { data: pendingInvites = [] } = useEventCohostInvites(eventId, 'pending');
  const cancelInviteMutation = useCancelCohostInvite(eventId);

  const handleCancelInvite = (invite: CohostInvite) => {
    setInviteToCancel(invite);
  };

  const confirmCancelInvite = () => {
    if (inviteToCancel) {
      cancelInviteMutation.mutate(inviteToCancel.id);
      setInviteToCancel(null);
    }
  };

  const handleAddCoHost = () => {
    setIsInviteSheetOpen(true);
  };

  const handleRemoveHost = async (hostId: string) => {
    if (removingHostId) return;

    const confirmed = window.confirm('Are you sure you want to remove this cohost?');
    if (!confirmed) return;

    setRemovingHostId(hostId);
    try {
      await apiClient.delete(`/v1/events/${eventId}/hosts`, { data: { hostId } });
      toast.success('Cohost removed');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove cohost');
    } finally {
      setRemovingHostId(null);
    }
  };

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Hosts',
      leftMode: 'back',
      showAvatar: false,
      subtitle: '',
      centerMode: 'title',
      buttons: [
        {
          id: 'add-cohost',
          icon: Plus,
          onClick: handleAddCoHost,
          label: 'Add Co-host',
        },
      ],
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, pathname, applyRouteConfig]);

  if (isLoading) {
    return (
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          <div className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
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
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to manage doesn't exist.</p>
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

  const hosts = existingEvent.hosts || [];
  const creatorId = existingEvent.creator_user_id;

  return (
    <>
      <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
        <div className='space-y-4 p-4'>
          {hosts.length > 0 ? (
            <div className='space-y-3'>
              {hosts.map((host) => {
                const isCreator = host.id === creatorId;
                return (
                  <div
                    key={host.id}
                    className={`flex items-center gap-4 rounded-2xl p-4 ${
                      isCreator ? 'border border-amber-200 bg-amber-50' : 'bg-gray-50'
                    }`}
                  >
                    <UserAvatar
                      user={{
                        name: host.name,
                        username: host.username,
                        image: host.avatar || host.image,
                        verification_status: host.verification_status,
                      }}
                      size='md'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='truncate font-semibold text-gray-900'>
                          {host.name || `@${host.username}`}
                        </h3>
                        {isCreator && (
                          <span className='flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700'>
                            <Crown className='h-3 w-3' />
                            Creator
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-500'>@{host.username}</p>
                    </div>
                    {!isCreator && (
                      <button
                        onClick={() => handleRemoveHost(host.id)}
                        disabled={removingHostId === host.id}
                        className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 disabled:opacity-50'
                        aria-label={`Remove ${host.name || host.username}`}
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <Plus className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>No Hosts</h3>
              <p className='mb-6 text-sm text-gray-500'>
                Add cohosts to help you manage this event
              </p>
              <button
                onClick={handleAddCoHost}
                className='rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600'
              >
                Add Cohost
              </button>
            </div>
          )}

          {pendingInvites.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-3 text-sm font-medium text-gray-500'>Pending Invites</h3>
              <div className='space-y-2'>
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className='flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3'
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100'>
                      <Clock className='h-4 w-4 text-amber-600' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-gray-900'>
                        {invite.invitee?.username
                          ? `@${invite.invitee.username}`
                          : invite.invitee_email}
                      </p>
                      <p className='text-xs text-gray-500'>Pending cohost invite</p>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite)}
                      disabled={cancelInviteMutation.isPending}
                      className='flex h-8 w-8 items-center justify-center rounded-full hover:bg-amber-200'
                    >
                      <X className='h-4 w-4 text-gray-500' />
                    </button>
                  </div>
                ))}
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
            <AlertDialogTitle>Cancel Invite?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the cohost invitation to{' '}
              <span className='font-medium text-gray-900'>
                {inviteToCancel?.invitee?.username
                  ? `@${inviteToCancel.invitee.username}`
                  : inviteToCancel?.invitee_email}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelInvite}
              className='bg-red-500 hover:bg-red-600'
            >
              Cancel Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
