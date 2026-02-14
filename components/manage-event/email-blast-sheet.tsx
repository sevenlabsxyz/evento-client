'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { logger } from '@/lib/utils/logger';
import EmailBlastCompose from './email-blast-compose';
import './email-blast-sheet.css';

interface EmailBlastSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export default function EmailBlastSheet({ isOpen, onClose, eventId }: EmailBlastSheetProps) {
  const handleClose = () => {
    onClose();
  };

  const handleSendBlast = (data: { recipients: string; subject: string; message: string }) => {
    logger.info('Email blast sent successfully', { data });
    handleClose();
  };

  return (
    <MasterScrollableSheet
      title='New Email Blast'
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      contentClassName='p-4'
    >
      <EmailBlastCompose
        isOpen={isOpen}
        eventId={eventId}
        onSend={handleSendBlast}
        onCancel={handleClose}
      />
    </MasterScrollableSheet>
  );
}
