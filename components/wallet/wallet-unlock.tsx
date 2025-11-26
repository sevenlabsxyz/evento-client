'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Lock } from 'lucide-react';
import { useState } from 'react';

interface WalletUnlockProps {
  onUnlock?: () => void;
}

export function WalletUnlock({ onUnlock }: WalletUnlockProps) {
  const [pin, setPin] = useState('');
  const { unlockWallet, isLoading, error } = useWallet();

  const handleNumberClick = (number: string) => {
    if (pin.length < 6) {
      setPin(pin + number);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin) {
      toast.error('Please enter your PIN');
      return;
    }

    try {
      await unlockWallet(pin);
      onUnlock?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock wallet');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50'>
          <Lock className='h-8 w-8 text-black' />
        </div>
        <h2 className='text-2xl font-bold'>Enter Wallet PIN</h2>
      </div>

      <form onSubmit={handleUnlock} className='space-y-4'>
        <div className='mb-6'>
          <Input
            id='pin'
            type='password'
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder='••••'
            disabled={isLoading}
            className='bg-gray-50 py-6 text-center text-2xl tracking-widest'
          />
        </div>

        {/* Number Keypad */}
        <NumericKeypad
          onNumberClick={handleNumberClick}
          onDelete={handleDelete}
          showDecimal={false}
          disabled={isLoading || pin.length >= 6}
        />

        {error && (
          <div className='rounded-lg bg-red-50 p-3'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
              <p className='text-sm text-red-900'>{error}</p>
            </div>
          </div>
        )}

        <Button
          type='submit'
          className='font-lg mt-6 w-full rounded-full'
          size='lg'
          disabled={isLoading}
        >
          {isLoading ? 'Unlocking...' : 'Next'}
        </Button>
      </form>
    </div>
  );
}
