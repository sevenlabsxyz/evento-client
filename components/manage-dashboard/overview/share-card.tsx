'use client';

import { Button } from '@/components/ui/button';
import { EventoQRCode } from '@/components/ui/evento-qr-code';
import type { EventDashboard } from '@/lib/types/manage';
import { getAbsoluteAppUrl } from '@/lib/utils/app-url';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Copy, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ShareCardProps {
  dashboard: EventDashboard;
}

export function ShareCard({ dashboard }: ShareCardProps) {
  const t = useTranslations('manage');
  const tCommon = useTranslations('common');
  const { event } = dashboard;
  const eventUrl = getAbsoluteAppUrl(`/e/${event.id}`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast.success(t('shareCard.linkCopied'));
    } catch (error) {
      logger.error('Failed to copy event link', { eventId: event.id, error });
      toast.error(t('shareCard.copyFailed'));
    }
  };

  const visibilityHint =
    event.status === 'draft'
      ? t('shareCard.draftHint')
      : event.password_protected
        ? t('shareCard.passwordHint')
        : event.visibility === 'private'
          ? t('shareCard.privateHint')
          : null;

  return (
    <section className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'>
      <h2 className='mb-3 text-base font-semibold text-gray-900 dark:text-neutral-100'>
        {t('shareCard.title')}
      </h2>
      <div className='flex items-center gap-4'>
        <EventoQRCode
          value={eventUrl}
          size={112}
          className='shrink-0 p-2 [&_canvas]:!h-28 [&_canvas]:!w-28'
        />
        <div className='min-w-0 flex-1 space-y-2'>
          <p className='truncate rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700 dark:bg-neutral-950 dark:text-neutral-300'>
            {eventUrl.replace(/^https?:\/\//, '')}
          </p>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='outline'
              className='flex-1 gap-1.5 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
              onClick={handleCopy}
            >
              <Copy className='h-3.5 w-3.5' />
              {tCommon('actions.copy')}
            </Button>
            <Button
              asChild
              size='sm'
              variant='outline'
              className='flex-1 gap-1.5 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800'
            >
              <a href={eventUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='h-3.5 w-3.5' />
                {tCommon('actions.open')}
              </a>
            </Button>
          </div>
        </div>
      </div>
      {visibilityHint && (
        <p className='mt-3 text-xs text-gray-500 dark:text-neutral-400'>{visibilityHint}</p>
      )}
    </section>
  );
}
