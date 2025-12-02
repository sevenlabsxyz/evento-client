'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AmountInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amountSats: number) => void;
  isLoading?: boolean;
}

export function AmountInputSheet({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: AmountInputSheetProps) {
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const { satsToUSD, usdToSats } = useAmountConverter();

  // Reset amount when sheet closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setAmountUSD('');
    }
  }, [open]);

  const handleNumberClick = async (num: string) => {
    const currentValue = inputMode === 'usd' ? amountUSD : amount;
    const newValue = currentValue + num;

    if (inputMode === 'sats') {
      setAmount(newValue);
      if (Number(newValue) > 0) {
        const usd = await satsToUSD(Number(newValue));
        setAmountUSD(usd.toFixed(2));
      }
    } else {
      setAmountUSD(newValue);
      if (Number(newValue) > 0) {
        const sats = await usdToSats(Number(newValue));
        setAmount(sats.toString());
      }
    }
  };

  const handleDelete = async () => {
    const currentValue = inputMode === 'usd' ? amountUSD : amount;
    const newValue = currentValue.slice(0, -1);

    if (inputMode === 'sats') {
      setAmount(newValue);
      if (newValue && Number(newValue) > 0) {
        const usd = await satsToUSD(Number(newValue));
        setAmountUSD(usd.toFixed(2));
      } else {
        setAmountUSD('');
      }
    } else {
      setAmountUSD(newValue);
      if (newValue && Number(newValue) > 0) {
        const sats = await usdToSats(Number(newValue));
        setAmount(sats.toString());
      } else {
        setAmount('');
      }
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'sats' ? 'usd' : 'sats');
  };

  const handleConfirm = () => {
    if (amount && Number(amount) > 0) {
      onConfirm(Number(amount));
      // Don't close the sheet here - parent will close it after async operations complete
    }
  };

  return (
    <MasterScrollableSheet open={open} onOpenChange={onOpenChange} title='Enter Amount'>
      <div className='p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
            <div className='text-4xl font-bold text-gray-900'>
              {inputMode === 'usd' ? `$${amountUSD || '0'}` : `${amount || '0'}`}
            </div>
            <div className='mt-1 text-lg font-medium text-gray-600'>
              {inputMode === 'usd' ? 'USD' : 'sats'}
            </div>
            <button
              onClick={toggleInputMode}
              className='mx-auto mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100'
            >
              <ArrowUpDown className='h-4 w-4' />
              <span>
                {inputMode === 'usd' && amount
                  ? `${Number(amount).toLocaleString()} sats`
                  : inputMode === 'sats' && amountUSD
                    ? `$${amountUSD}`
                    : 'Convert'}
              </span>
            </button>
          </div>

          {/* Number Pad */}
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={true}
          />

          {/* Next Button */}
          <Button
            onClick={handleConfirm}
            disabled={!amount || Number(amount) <= 0 || isLoading}
            className='h-12 w-full rounded-full bg-gray-50 font-medium text-gray-900 hover:bg-gray-100'
            variant='outline'
          >
            {isLoading ? (
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
    </MasterScrollableSheet>
  );
}
