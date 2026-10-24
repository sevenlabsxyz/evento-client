'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useTranslations } from 'next-intl';

interface DateTimeActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateTimeText: string;
  onAddToCalendar: () => void;
  onCopyDateTime: () => void;
}

export function DateTimeActionsSheet({
  open,
  onOpenChange,
  dateTimeText,
  onAddToCalendar,
  onCopyDateTime,
}: DateTimeActionsSheetProps) {
  const t = useTranslations('event');
  const tCommon = useTranslations('common');
  const handleAddToCalendar = () => {
    onAddToCalendar();
    onOpenChange(false);
  };

  const handleCopyDateTime = () => {
    onCopyDateTime();
    onOpenChange(false);
  };

  return (
    <MasterScrollableSheet title={t('dateTimeSheet.title')} open={open} onOpenChange={onOpenChange}>
      <div className='px-4 pb-6'>
        <p className='mb-5 whitespace-pre-line text-sm text-gray-600 dark:text-neutral-400'>
          {dateTimeText}
        </p>

        <div className='space-y-3'>
          <Button
            type='button'
            variant='outline'
            className='h-14 w-full justify-start text-base font-medium'
            onClick={handleAddToCalendar}
          >
            {t('dateTimeSheet.addToCalendar')}
          </Button>

          <Button
            type='button'
            variant='outline'
            className='h-14 w-full justify-start text-base font-medium'
            onClick={handleCopyDateTime}
          >
            {t('dateTimeSheet.copyDateTime')}
          </Button>

          <Button
            type='button'
            variant='outline'
            className='mt-2 h-14 w-full text-base font-medium text-gray-600 dark:text-neutral-400'
            onClick={() => onOpenChange(false)}
          >
            {tCommon('actions.cancel')}
          </Button>
        </div>
      </div>
    </MasterScrollableSheet>
  );
}
