'use client';

import { Button } from '@/components/ui/button';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { ArrowLeft, X, Zap } from 'lucide-react';
import Image from 'next/image';
import type { RecipientInfo } from '../zap-types';

interface ZapConfirmStepProps {
  recipient: RecipientInfo;
  selectedAmount: number;
  amountUSD: string;
  comment: string;
  feeSats?: number;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function ZapConfirmStep({
  recipient,
  selectedAmount,
  amountUSD,
  comment,
  feeSats,
  onConfirm,
  onBack,
  onClose,
}: ZapConfirmStepProps) {
  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 pt-0'>
        <button onClick={onBack} className='rounded-full p-2 transition-colors hover:bg-gray-100'>
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Confirm Zap</h2>
        <div className='flex items-center gap-3'>
          <WalletBalanceDisplay />
          <button
            onClick={onClose}
            className='rounded-full p-2 transition-colors hover:bg-gray-100'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-red-200 bg-red-50 p-8 text-center'>
            <Zap className='mx-auto h-12 w-12 text-red-500' />
            <p className='mt-4 text-4xl font-bold text-gray-900'>
              {selectedAmount.toLocaleString()} sats
            </p>
            {amountUSD && <p className='mt-1 text-lg text-gray-600'>≈ ${amountUSD} USD</p>}
          </div>

          {/* Recipient */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
            <p className='mb-1 text-xs text-gray-500'>Sending to</p>
            <div className='flex items-center gap-3'>
              {recipient.avatar ? (
                <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
                  <Image
                    src={recipient.avatar}
                    alt={recipient.name}
                    fill
                    className='object-cover'
                  />
                </div>
              ) : (
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
                  <Zap className='h-5 w-5 text-red-600' />
                </div>
              )}
              <div>
                <p className='font-semibold text-gray-900'>{recipient.name}</p>
                <p className='font-mono text-xs text-gray-500'>{recipient.lightningAddress}</p>
              </div>
            </div>
          </div>

          {/* Fee */}
          {feeSats !== undefined && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-500'>Network Fee</span>
                <span className='text-sm font-medium'>{feeSats} sats</span>
              </div>
            </div>
          )}

          {/* Comment (if provided) */}
          {comment && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <p className='mb-1 text-xs text-gray-500'>Message</p>
              <p className='text-sm text-gray-700'>{comment}</p>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={onConfirm}
            className='h-12 w-full rounded-full bg-red-500 font-semibold text-white hover:bg-red-600'
          >
            Confirm & Send
          </Button>
        </div>
      </div>
    </div>
  );
}
