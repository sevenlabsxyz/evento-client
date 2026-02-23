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
  onConfirm: (amountSats: number, sendAll?: boolean) => void;
  isLoading?: boolean;
  /** When set, shows a "Max" button that fills in the full available balance */
  maxAmount?: number;
}

export function AmountInputSheet({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  maxAmount,
}: AmountInputSheetProps) {
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [isSendAll, setIsSendAll] = useState(false);
  const { satsToUSD, usdToSats } = useAmountConverter();

  // Reset amount when sheet closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setAmountUSD('');
      setIsSendAll(false);
    }
  }, [open]);

  const handleSendAll = async () => {
    if (!maxAmount || maxAmount <= 0) return;
    setIsSendAll(true);
    setAmount(maxAmount.toString());

    try {
      const usd = await satsToUSD(maxAmount);
      // Check if component is still mounted before updating state
      if (open) {
        setAmountUSD(usd.toFixed(2));
      }
    } catch (error) {
      // Silently ignore conversion errors to prevent state updates after unmount
      console.warn('Currency conversion failed:', error);
    }
  };

  const handleNumberClick = async (num: string) => {
    setIsSendAll(false);
    const currentValue = inputMode === 'usd' ? amountUSD : amount;
    const newValue = currentValue + num;

    try {
      if (inputMode === 'sats') {
        setAmount(newValue);
        if (Number(newValue) > 0) {
          const usd = await satsToUSD(Number(newValue));
          if (open) {
            setAmountUSD(usd.toFixed(2));
          }
        }
      } else {
        setAmountUSD(newValue);
        if (Number(newValue) > 0) {
          const sats = await usdToSats(Number(newValue));
          if (open) {
            setAmount(sats.toString());
          }
        }
      }
    } catch (error) {
      console.warn('Currency conversion failed:', error);
    }
  };

  const handleDelete = async () => {
    setIsSendAll(false);
    const currentValue = inputMode === 'usd' ? amountUSD : amount;
    const newValue = currentValue.slice(0, -1);

    try {
      if (inputMode === 'sats') {
        setAmount(newValue);
        if (newValue && Number(newValue) > 0) {
          const usd = await satsToUSD(Number(newValue));
          if (open) {
            setAmountUSD(usd.toFixed(2));
          }
        } else {
          setAmountUSD('');
        }
      } else {
        setAmountUSD(newValue);
        if (newValue && Number(newValue) > 0) {
          const sats = await usdToSats(Number(newValue));
          if (open) {
            setAmount(sats.toString());
          }
        } else {
          setAmount('');
        }
      }
    } catch (error) {
      console.warn('Currency conversion failed:', error);
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'sats' ? 'usd' : 'sats');
  };

  const handleConfirm = () => {
    if (amount && Number(amount) > 0) {
      onConfirm(Number(amount), isSendAll);
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

          {/* Send All / Max Button */}
          {maxAmount != null && maxAmount > 0 && (
            <button
              onClick={handleSendAll}
              className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-medium transition-colors ${
                isSendAll
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Send All ({maxAmount.toLocaleString()} sats)
            </button>
          )}

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
