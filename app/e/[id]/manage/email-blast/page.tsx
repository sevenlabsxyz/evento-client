'use client';

import EmailBlastCancelConfirmation from '@/components/manage-event/email-blast-cancel-confirmation';
import EmailBlastCard from '@/components/manage-event/email-blast-card';
import EmailBlastDetailModal from '@/components/manage-event/email-blast-detail-modal';
import EmailBlastSheet from '@/components/manage-event/email-blast-sheet';
import {
  isEmailBlastScheduledMutationRaceError,
  transformEmailBlastForUI,
  useCancelEmailBlast,
  useEmailBlasts,
} from '@/lib/hooks/use-email-blasts';
import { useTopBar } from '@/lib/stores/topbar-store';
import { EmailBlast } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { Loader2, Mail, Plus } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmailBlastPage() {
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const eventId = params.id as string;
  const [showEmailBlastSheet, setShowEmailBlastSheet] = useState(false);
  const [selectedBlastId, setSelectedBlastId] = useState<string | null>(null);
  const [blastToEdit, setBlastToEdit] = useState<EmailBlast | null>(null);
  const [blastToCancel, setBlastToCancel] = useState<EmailBlast | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  // Fetch email blasts data
  const { data: emailBlasts = [], isLoading, error, refetch } = useEmailBlasts(eventId);
  const cancelEmailBlastMutation = useCancelEmailBlast(eventId, blastToCancel?.id ?? '');
  // Transform API data for UI
  const transformedBlasts = (emailBlasts || []).map(transformEmailBlastForUI);
  const selectedBlast = transformedBlasts.find((blast) => blast.id === selectedBlastId) || null;

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Email Blasts',
      buttons: [
        {
          icon: Plus,
          onClick: handleCreateBlast,
          label: 'Create Blast',
          id: 'create-blast',
        },
      ],
      leftMode: 'back',
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, pathname, applyRouteConfig]);

  const handleCreateBlast = () => {
    setBlastToEdit(null);
    setShowEmailBlastSheet(true);
  };

  const handleBlastClick = (blast: EmailBlast) => {
    setSelectedBlastId(blast.id);
  };

  const handleEditRequested = (blast: EmailBlast) => {
    if (blast.status !== 'scheduled') {
      return;
    }

    setBlastToEdit(blast);
    setShowEmailBlastSheet(true);
  };

  const handleCancelRequested = (blast: EmailBlast) => {
    if (blast.status !== 'scheduled') {
      return;
    }

    setBlastToCancel(blast);
    setShowCancelConfirmation(true);
  };

  const handleCancelBlast = async () => {
    if (!blastToCancel) {
      return;
    }

    try {
      await cancelEmailBlastMutation.mutateAsync();
      toast.success('Email blast cancelled successfully');
      setShowCancelConfirmation(false);
      setBlastToCancel(null);
      setSelectedBlastId(null);
      await refetch();
    } catch (mutationError) {
      const errorMessage =
        mutationError && typeof mutationError === 'object' && 'message' in mutationError
          ? String((mutationError as { message?: unknown }).message || '')
          : 'Failed to cancel email blast';
      toast.error(errorMessage || 'Failed to cancel email blast');

      if (isEmailBlastScheduledMutationRaceError(mutationError)) {
        await refetch();
      }
    }
  };

  const handleStaleScheduledMutationAttempt = async () => {
    await refetch();
    setShowEmailBlastSheet(false);
    setBlastToEdit(null);
  };

  return (
    <div className='mx-auto mt-2 min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Content */}
      <div className='p-4'>
        {/* Email Blast History */}
        <div className='space-y-3'>
          {isLoading ? (
            <div className='py-12 text-center'>
              <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-red-500' />
              <p className='text-gray-600'>Loading email blasts...</p>
            </div>
          ) : error ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                <Mail className='h-8 w-8 text-red-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>
                Failed to load email blasts
              </h3>
              <p className='mb-6 text-gray-500'>
                There was an error loading your email blasts. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className='rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600'
              >
                Retry
              </button>
            </div>
          ) : transformedBlasts.length === 0 ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
                <Mail className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900'>No email blasts yet</h3>
              <p className='mb-6 text-gray-500'>
                Send your first email blast to keep your guests informed
              </p>
              <button
                onClick={handleCreateBlast}
                className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-500 text-white transition-colors hover:bg-red-600'
              >
                <Plus className='h-5 w-5' />
                Create Email Blast
              </button>
            </div>
          ) : (
            transformedBlasts.map((blast) => (
              <EmailBlastCard key={blast.id} blast={blast} onClick={handleBlastClick} />
            ))
          )}
        </div>
      </div>

      {/* Email Blast Sheet */}
      <EmailBlastSheet
        isOpen={showEmailBlastSheet}
        onClose={() => {
          setShowEmailBlastSheet(false);
          setBlastToEdit(null);
        }}
        eventId={eventId}
        blastToEdit={blastToEdit}
        onStaleScheduledMutationAttempt={handleStaleScheduledMutationAttempt}
      />

      {selectedBlast && (
        <EmailBlastDetailModal
          blast={selectedBlast}
          isOpen={!!selectedBlast}
          onClose={() => setSelectedBlastId(null)}
          onEditRequested={handleEditRequested}
          onCancelRequested={handleCancelRequested}
          isCancelling={cancelEmailBlastMutation.isPending}
        />
      )}

      <EmailBlastCancelConfirmation
        open={showCancelConfirmation}
        onOpenChange={setShowCancelConfirmation}
        onConfirm={handleCancelBlast}
        isCancelling={cancelEmailBlastMutation.isPending}
      />
    </div>
  );
}
