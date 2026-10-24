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
import { useTranslations } from 'next-intl';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EmailBlastPage() {
  const t = useTranslations('manageLegacy');
  const tCommon = useTranslations('common');
  const { setTopBarForRoute, clearRoute, applyRouteConfig } = useTopBar();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
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
      title: t('emailBlast.page.topBarTitle'),
      buttons: [],
      leftMode: 'back',
      onBackPress: () => router.push(`/e/${eventId}/manage`),
      showAvatar: false,
    });

    return () => {
      clearRoute(pathname);
    };
  }, [setTopBarForRoute, clearRoute, pathname, applyRouteConfig, router, eventId, t]);

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
      toast.success(t('emailBlast.page.cancelSuccess'));
      setShowCancelConfirmation(false);
      setBlastToCancel(null);
      setSelectedBlastId(null);
      await refetch();
    } catch (mutationError) {
      const errorMessage =
        mutationError && typeof mutationError === 'object' && 'message' in mutationError
          ? String((mutationError as { message?: unknown }).message || '')
          : t('emailBlast.page.cancelFailed');
      toast.error(errorMessage || t('emailBlast.page.cancelFailed'));

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
    <div className='space-y-4 py-4 md:py-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
            {t('emailBlast.page.heading')}
          </h2>
          <p className='text-sm text-gray-500 dark:text-neutral-400'>
            {t('emailBlast.page.subtitle')}
          </p>
        </div>
        <button
          type='button'
          onClick={handleCreateBlast}
          className='flex shrink-0 items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
        >
          <Plus className='h-4 w-4' />
          {t('emailBlast.page.newBlast')}
        </button>
      </div>

      {/* Email Blast History */}
      <div>
        <div className='space-y-3'>
          {isLoading ? (
            <div className='py-12 text-center'>
              <Loader2 className='mx-auto mb-4 h-8 w-8 animate-spin text-red-500 dark:text-red-400' />
              <p className='text-gray-600 dark:text-neutral-400'>{t('emailBlast.page.loading')}</p>
            </div>
          ) : error ? (
            <div className='py-12 text-center'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60'>
                <Mail className='h-8 w-8 text-red-400' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
                {t('emailBlast.page.loadErrorTitle')}
              </h3>
              <p className='mb-6 text-gray-500 dark:text-neutral-400'>
                {t('emailBlast.page.loadErrorDescription')}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='rounded-lg bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                {tCommon('actions.retry')}
              </button>
            </div>
          ) : transformedBlasts.length === 0 ? (
            <div className='rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800'>
                <Mail className='h-8 w-8 text-gray-400 dark:text-neutral-500' />
              </div>
              <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100'>
                {t('emailBlast.page.emptyTitle')}
              </h3>
              <p className='mb-6 text-gray-500 dark:text-neutral-400'>
                {t('emailBlast.page.emptyDescription')}
              </p>
              <button
                onClick={handleCreateBlast}
                className='mx-auto flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <Plus className='h-5 w-5' />
                {t('emailBlast.page.createBlast')}
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
