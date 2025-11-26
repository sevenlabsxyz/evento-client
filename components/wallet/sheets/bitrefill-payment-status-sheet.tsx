'use client';

import { Button } from '@/components/ui/button';
import { DetachedSheet } from '@/components/ui/detached-sheet';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

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
              <Loader2 className='h-10 w-10 text-blue-500' />
            </motion.div>
          ),
          iconBg: 'bg-blue-100',
          title: 'Processing Payment',
          message: 'Your payment is being processed. This usually takes just a few seconds.',
          showButton: false,
        };
      case 'success':
        return {
          icon: <CheckCircle2 className='h-10 w-10 text-green-500' />,
          iconBg: 'bg-green-100',
          title: 'Purchase Complete!',
          message: getSuccessMessage(deliveryStatus),
          showButton: true,
        };
      case 'error':
        return {
          icon: <XCircle className='h-10 w-10 text-red-500' />,
          iconBg: 'bg-red-100',
          title: 'Payment Failed',
          message: getErrorMessage(deliveryStatus),
          showButton: true,
        };
    }
  };

  const getSuccessMessage = (delivery: typeof deliveryStatus) => {
    switch (delivery) {
      case 'all_delivered':
        return 'Your gift card has been delivered successfully. Check your email for the details.';
      case 'partial_delivery':
        return 'Some items were delivered. Please check Bitrefill for more details about remaining items.';
      case 'all_error':
        return 'There was an issue with delivery. A refund will be processed automatically.';
      default:
        return 'Your payment was successful. Your purchase will be delivered shortly.';
    }
  };

  const getErrorMessage = (delivery: typeof deliveryStatus) => {
    if (delivery === 'all_error') {
      return "We couldn't complete your purchase. Don't worry - a refund will be processed automatically to your wallet.";
    }
    return 'Something went wrong with your payment. Please try again or contact support if the issue persists.';
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
                className='mb-2 text-center text-xl font-semibold text-gray-900'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {content.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                className='mb-8 text-center text-sm text-gray-600'
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
                    {status === 'success' ? 'Continue Shopping' : 'Close'}
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
