'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BitrefillPaymentStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: 'processing' | 'success' | 'error';
  deliveryStatus?: 'partial_delivery' | 'all_delivered' | 'all_error' | null;
  onClose: () => void;
}

export function BitrefillPaymentStatusSheet({
  open,
  onOpenChange,
  status,
  deliveryStatus,
  onClose,
}: BitrefillPaymentStatusSheetProps) {
  const t = useTranslations('walletFlows');
  const tCommon = useTranslations('common');
  // Determine title and message based on status
  const getContent = () => {
    switch (status) {
      case 'processing':
        return {
          icon: (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className='h-10 w-10 text-blue-500 dark:text-blue-400' />
            </motion.div>
          ),
          iconBg: 'bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900',
          title: t('bitrefillPaymentStatusSheet.processing.title'),
          message: t('bitrefillPaymentStatusSheet.processing.message'),
          showButton: false,
        };
      case 'success':
        return {
          icon: <CheckCircle2 className='h-10 w-10 text-green-500 dark:text-green-400' />,
          iconBg: 'bg-green-100 dark:bg-green-950/60 border border-green-200 dark:border-green-900',
          title: t('bitrefillPaymentStatusSheet.success.title'),
          message: getSuccessMessage(deliveryStatus),
          showButton: true,
        };
      case 'error':
        return {
          icon: <XCircle className='h-10 w-10 text-red-500 dark:text-red-400' />,
          iconBg: 'bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900',
          title: t('bitrefillPaymentStatusSheet.error.title'),
          message: getErrorMessage(deliveryStatus),
          showButton: true,
        };
    }
  };

  const getSuccessMessage = (delivery: typeof deliveryStatus) => {
    switch (delivery) {
      case 'all_delivered':
        return t('bitrefillPaymentStatusSheet.success.allDelivered');
      case 'partial_delivery':
        return t('bitrefillPaymentStatusSheet.success.partialDelivery');
      case 'all_error':
        return t('bitrefillPaymentStatusSheet.success.deliveryIssue');
      default:
        return t('bitrefillPaymentStatusSheet.success.default');
    }
  };

  const getErrorMessage = (delivery: typeof deliveryStatus) => {
    if (delivery === 'all_error') {
      return t('bitrefillPaymentStatusSheet.error.refund');
    }
    return t('bitrefillPaymentStatusSheet.error.generic');
  };

  const content = getContent();

  // Prevent closing while processing
  const handleOpenChange = (newOpen: boolean) => {
    if (status === 'processing' && !newOpen) {
      return; // Prevent closing while processing
    }
    onOpenChange(newOpen);
  };

  return (
    <DetachedSheet.Root presented={open} onPresentedChange={handleOpenChange}>
      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className='p-6'>
              <div className='mb-4 flex justify-center'>
                <DetachedSheet.Handle />
              </div>

              {/* Status Icon */}
              <div className='mb-6 flex justify-center'>
                <motion.div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${content.iconBg}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {content.icon}
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                className='mb-2 text-center text-xl font-semibold text-gray-900 dark:text-neutral-100'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {content.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                className='mb-8 text-center text-sm text-gray-600 dark:text-neutral-400'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {content.message}
              </motion.p>

              {/* Action Button */}
              {content.showButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button onClick={onClose} className='h-12 w-full rounded-full'>
                    {status === 'success' ? tCommon('actions.done') : tCommon('actions.close')}
                  </Button>
                </motion.div>
              )}
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
