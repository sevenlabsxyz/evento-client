'use client';

import { Button } from '@/components/ui/button';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { WalletBalanceDisplay } from '@/components/wallet/wallet-balance-display';
import { ArrowLeft, ArrowUpDown, Loader2, X } from 'lucide-react';

interface ZapCustomStepProps {
  customAmount: string;
  customAmountUSD: string;
  inputMode: 'sats' | 'usd';
  isPreparing: boolean;
  onNumberClick: (num: string) => void;
  onDelete: () => void;
  onToggleMode: () => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function ZapCustomStep({
  customAmount,
  customAmountUSD,
  inputMode,
  isPreparing,
  onNumberClick,
  onDelete,
  onToggleMode,
  onConfirm,
  onBack,
  onClose,
}: ZapCustomStepProps) {
  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 pt-0'>
        <button onClick={onBack} className='rounded-full p-2 transition-colors hover:bg-gray-100'>
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Custom Amount</h2>
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
      <div className='p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
            <div className='text-4xl font-bold text-gray-900'>
              {inputMode === 'usd' ? `$${customAmountUSD || '0'}` : `${customAmount || '0'}`}
            </div>
            <div className='mt-1 text-lg font-medium text-gray-600'>
              {inputMode === 'usd' ? 'USD' : 'sats'}
            </div>
            <button
              onClick={onToggleMode}
              className='mx-auto mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100'
            >
              <ArrowUpDown className='h-4 w-4' />
              <span>
                {inputMode === 'usd' && customAmount
                  ? `${Number(customAmount).toLocaleString()} sats`
                  : inputMode === 'sats' && customAmountUSD
                    ? `$${customAmountUSD}`
                    : 'Convert'}
              </span>
            </button>
          </div>

          {/* Number Pad */}
          <NumericKeypad onNumberClick={onNumberClick} onDelete={onDelete} showDecimal={true} />

          {/* Confirm Button */}
          <Button
            onClick={onConfirm}
            disabled={!customAmount || Number(customAmount) <= 0 || isPreparing}
            className='h-12 w-full rounded-full bg-red-500 font-semibold text-white hover:bg-red-600'
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
