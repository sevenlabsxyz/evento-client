import { logger, task } from '@trigger.dev/sdk';
import { Resend } from 'resend';

import WalletInviteRecipientEmail from '@/emails/wallet-invite-recipient';
import WalletInviteSenderEmail from '@/emails/wallet-invite-sender';

interface SendWalletInvitePayload {
  recipientUsername: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderUsername: string;
  senderEmail: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'Evento <noreply@evento.cash>';

export const sendWalletInviteTask = task({
  id: 'send-wallet-invite-email',
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: SendWalletInvitePayload) => {
    const {
      recipientUsername,
      recipientEmail,
      recipientName,
      senderName,
      senderUsername,
      senderEmail,
    } = payload;

    logger.info('Starting wallet invite email task', {
      recipientUsername,
      senderUsername,
    });

    const recipientResult = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: `${senderName} wants to send you sats on Evento`,
      react: WalletInviteRecipientEmail({
        recipientName,
        senderName,
        senderUsername,
      }),
    });

    if (recipientResult.error) {
      logger.error('Failed to send recipient invite email', {
        error: recipientResult.error,
        recipientUsername,
      });
      throw new Error(`Recipient email failed: ${recipientResult.error.message}`);
    }

    logger.info('Recipient invite email sent', {
      emailId: recipientResult.data?.id,
      recipientUsername,
    });

    const senderResult = await resend.emails.send({
      from: fromAddress,
      to: senderEmail,
      subject: `We've notified ${recipientName} about Evento Wallet`,
      react: WalletInviteSenderEmail({
        senderName,
        recipientName,
        recipientUsername,
      }),
    });

    if (senderResult.error) {
      logger.error('Failed to send sender confirmation email', {
        error: senderResult.error,
        senderUsername,
      });
      throw new Error(`Sender email failed: ${senderResult.error.message}`);
    }

    logger.info('Sender confirmation email sent', {
      emailId: senderResult.data?.id,
      senderUsername,
    });

    return {
      recipientEmailId: recipientResult.data?.id,
      senderEmailId: senderResult.data?.id,
    };
  },
});
