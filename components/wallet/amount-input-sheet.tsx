'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowUpDown, Delete, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AmountInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amountSats: number) => void;
}

export function AmountInputSheet({ open, onOpenChange, onConfirm }: AmountInputSheetProps) {
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [activeDetent, setActiveDetent] = useState(2); // Full screen
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
      onOpenChange(false);
    }
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <SheetWithDetent.Root
      presented={open}
      onPresentedChange={onOpenChange}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className='min-h-max'>
            <div className='my-4 flex items-center'>
              <SheetWithDetent.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
            </div>
            <VisuallyHidden.Root asChild>
              <SheetWithDetent.Title>Enter Amount</SheetWithDetent.Title>
            </VisuallyHidden.Root>

            <div className='flex flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between border-b p-4'>
                <h2 className='text-xl font-semibold'>Enter Amount</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className='rounded-full p-2 transition-colors hover:bg-gray-100'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* Content */}
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
                  <div className='grid grid-cols-3 gap-3'>
                    {numbers.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        className='flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl font-semibold text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100'
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={handleDelete}
                      className='flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100'
                    >
                      <Delete className='h-6 w-6' />
                    </button>
                  </div>

                  {/* Next Button */}
                  <Button
                    onClick={handleConfirm}
                    disabled={!amount || Number(amount) <= 0}
                    className='h-12 w-full rounded-full bg-gray-50 font-medium text-gray-900 hover:bg-gray-100'
                    variant='outline'
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
