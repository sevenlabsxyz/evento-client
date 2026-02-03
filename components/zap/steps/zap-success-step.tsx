'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ZapSuccessStepProps {
  selectedAmount: number;
  recipientName: string;
  onClose: () => void;
}

export function ZapSuccessStep({ selectedAmount, recipientName, onClose }: ZapSuccessStepProps) {
  return (
    <div className='flex flex-col'>
      {/* Content */}
      <div className='flex flex-1 flex-col items-center justify-center p-12'>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className='flex h-24 w-24 items-center justify-center rounded-full bg-green-100'
        >
          <Check className='h-12 w-12 text-green-600' />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mt-6 text-2xl font-bold text-gray-900'
        >
          Zap Sent!
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='mt-2 text-lg text-gray-600'
        >
          {selectedAmount.toLocaleString()} sats to {recipientName}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='mt-8 w-full max-w-xs'
        >
          <Button
            onClick={onClose}
            className='h-12 w-full rounded-full bg-gray-900 font-semibold text-white hover:bg-gray-800'
          >
            Done
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
