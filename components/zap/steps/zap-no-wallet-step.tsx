'use client';

import { Button } from '@/components/ui/button';
import { Check, Loader2, Zap } from 'lucide-react';
import type { RecipientInfo } from '../zap-types';

interface ZapNoWalletStepProps {
  onClose: () => void;
  onNotify?: () => void;
  recipient?: RecipientInfo;
  isNotifying?: boolean;
  notifySuccess?: boolean;
  alreadyNotified?: boolean;
}

export function ZapNoWalletStep({
  onClose,
  onNotify,
  recipient,
  isNotifying = false,
  notifySuccess = false,
  alreadyNotified = false,
}: ZapNoWalletStepProps) {
  const heading = recipient?.name
    ? `${recipient.name} hasn\u2019t set up their wallet`
    : 'Wallet Not Set Up';

  const isNotifyDisabled = isNotifying || notifySuccess || alreadyNotified || !onNotify;

  const renderNotifyContent = () => {
    if (isNotifying) {
      return (
        <>
          <Loader2 className='h-4 w-4 animate-spin' />
          Sending...
        </>
      );
    }
    if (notifySuccess) {
      return (
        <>
          <Check className='h-4 w-4' />
          Notified
        </>
      );
    }
    if (alreadyNotified) {
      return 'Already Notified';
    }
    return 'Let them know';
  };

  return (
    <div className='flex flex-col items-center justify-center p-12 text-center'>
      <div className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
        <Zap className='h-8 w-8 text-gray-400' />
      </div>
      <h3 className='mb-2 text-xl font-semibold text-gray-900'>{heading}</h3>
      <p className='mb-8 text-gray-600'>
        This user hasn&apos;t set up their Evento Wallet yet. Let them know so they can start
        receiving Lightning payments!
      </p>
      <div className='flex w-full max-w-xs flex-col gap-3'>
        <Button
          onClick={onNotify}
          disabled={isNotifyDisabled}
          className={`h-12 w-full rounded-full font-semibold text-white ${
            notifySuccess ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {renderNotifyContent()}
        </Button>
        <Button
          variant='ghost'
          onClick={onClose}
          className='h-12 w-full rounded-full font-semibold text-gray-600 hover:text-gray-900'
        >
          Close
        </Button>
      </div>
    </div>
  );
}
