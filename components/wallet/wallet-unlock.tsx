'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Delete, Lock } from 'lucide-react';
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
        <div className='grid grid-cols-3 gap-3'>
          {/* Row 1: 7, 8, 9 */}
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('7')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            7
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('8')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            8
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('9')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            9
          </Button>

          {/* Row 2: 4, 5, 6 */}
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('4')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            4
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('5')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            5
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('6')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            6
          </Button>

          {/* Row 3: 1, 2, 3 */}
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('1')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            1
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('2')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            2
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('3')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            3
          </Button>

          {/* Row 4: Empty, 0, Delete */}
          <div />
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={() => handleNumberClick('0')}
            disabled={isLoading || pin.length >= 6}
            className='h-14 rounded-full text-xl font-semibold hover:bg-gray-50'
          >
            0
          </Button>
          <Button
            type='button'
            variant='outline'
            size='lg'
            onClick={handleDelete}
            disabled={isLoading || pin.length === 0}
            className='h-14 rounded-full hover:bg-gray-50'
          >
            <Delete className='h-5 w-5' />
          </Button>
        </div>

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
