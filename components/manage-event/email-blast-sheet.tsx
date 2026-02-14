'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { EmailBlast } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import EmailBlastCompose from './email-blast-compose';
import './email-blast-sheet.css';

interface EmailBlastSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  blastToEdit?: EmailBlast | null;
  onStaleScheduledMutationAttempt?: () => void;
}

export default function EmailBlastSheet({
  isOpen,
  onClose,
  eventId,
  blastToEdit,
  onStaleScheduledMutationAttempt,
}: EmailBlastSheetProps) {
  const handleClose = () => {
    onClose();
  };

  const handleSendBlast = (data: { recipients: string; subject: string; message: string }) => {
    logger.info('Email blast sent successfully', { data });
    handleClose();
  };

  return (
    <MasterScrollableSheet
      title={blastToEdit ? 'Edit Scheduled Blast' : 'New Email Blast'}
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      contentClassName='p-4'
    >
      <EmailBlastCompose
        isOpen={isOpen}
        eventId={eventId}
        blastToEdit={blastToEdit}
        onSend={handleSendBlast}
        onStaleScheduledMutationAttempt={onStaleScheduledMutationAttempt}
        onCancel={handleClose}
      />
    </MasterScrollableSheet>
  );
}
