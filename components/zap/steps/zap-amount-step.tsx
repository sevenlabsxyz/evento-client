'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, X, Zap } from 'lucide-react';
import Image from 'next/image';
import type { LnurlPayRequestDetails, RecipientInfo } from '../zap-types';

interface ZapAmountStepProps {
  recipient: RecipientInfo;
  quickAmounts: number[];
  selectedAmount: number | null;
  amountUSD: string;
  comment: string;
  payRequest: LnurlPayRequestDetails | null;
  isPreparing: boolean;
  onSelectAmount: (amount: number) => void;
  onCustomClick: () => void;
  onCommentChange: (comment: string) => void;
  onNext: () => void;
  onClose: () => void;
}

export function ZapAmountStep({
  recipient,
  quickAmounts,
  selectedAmount,
  amountUSD,
  comment,
  payRequest,
  isPreparing,
  onSelectAmount,
  onCustomClick,
  onCommentChange,
  onNext,
  onClose,
}: ZapAmountStepProps) {
  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 pt-0'>
        <h2 className='text-xl font-semibold'>Send Zap</h2>
        <button onClick={onClose} className='rounded-full p-2 transition-colors hover:bg-gray-100'>
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-4 pb-4 pt-0'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Recipient Card */}
          <div className='flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
            {recipient.avatar ? (
              <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full'>
                <Image src={recipient.avatar} alt={recipient.name} fill className='object-cover' />
              </div>
            ) : (
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
                <Zap className='h-6 w-6 text-red-600' />
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate font-semibold text-gray-900'>{recipient.name}</p>
              {recipient.username && (
                <p className='truncate text-sm text-gray-500'>@{recipient.username}</p>
              )}
              <p className='truncate font-mono text-xs text-gray-400'>
                {recipient.lightningAddress}
              </p>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className='space-y-3'>
            <p className='text-sm font-medium text-gray-600'>Select amount</p>
            <div className='grid grid-cols-3 gap-3'>
              {quickAmounts.map((amount) => (
                <motion.button
                  key={amount}
                  onClick={() => onSelectAmount(amount)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`flex h-14 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 font-semibold transition-all ${
                    selectedAmount === amount
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'hover:border-gray-100'
                  }`}
                >
                  {amount.toLocaleString()}
                </motion.button>
              ))}
              <motion.button
                onClick={onCustomClick}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className='flex h-14 items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 font-semibold transition-all hover:border-gray-100'
              >
                Custom
              </motion.button>
            </div>
          </div>

          {/* Selected Amount Display */}
          {selectedAmount && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 text-center'>
              <p className='text-3xl font-bold text-gray-900'>
                {selectedAmount.toLocaleString()} sats
              </p>
              {amountUSD && <p className='mt-1 text-sm text-gray-500'>≈ ${amountUSD} USD</p>}
            </div>
          )}

          {/* Comment Field (shown when recipient allows comments) */}
          {payRequest && payRequest.commentAllowed > 0 && (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-600'>Add a message (optional)</label>
              <textarea
                value={comment}
                onChange={(e) =>
                  onCommentChange(e.target.value.slice(0, payRequest.commentAllowed))
                }
                placeholder='Say something nice...'
                maxLength={payRequest.commentAllowed}
                rows={2}
                className='w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm transition-colors focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-300'
              />
              <p className='text-right text-xs text-gray-400'>
                {comment.length}/{payRequest.commentAllowed}
              </p>
            </div>
          )}

          {/* Next Button */}
          <Button
            onClick={onNext}
            disabled={!selectedAmount || isPreparing}
            className='h-12 w-full rounded-full font-semibold'
          >
            {isPreparing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Preparing...
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
