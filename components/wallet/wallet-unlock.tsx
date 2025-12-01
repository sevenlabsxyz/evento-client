'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, KeyRound, Lock } from 'lucide-react';
import { useState } from 'react';

interface WalletUnlockProps {
  onUnlock?: () => void;
}

export function WalletUnlock({ onUnlock }: WalletUnlockProps) {
  const [pin, setPin] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const { unlockWallet, isLoading, error } = useWallet();

  const handleNumberClick = (number: string) => {
    if (pin.length < 6) {
      setPin(pin + number);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLongPressDelete = () => {
    setIsPasswordMode(true);
    setPin(''); // Clear PIN when switching modes
  };

  const handleUnlock = async () => {
    const credential = isPasswordMode ? password : pin;

    if (!credential || credential.length < 4) {
      toast.error(isPasswordMode ? 'Please enter your password' : 'Please enter your PIN');
      return;
    }

    try {
      await unlockWallet(credential);
      onUnlock?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock wallet');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50'>
          {isPasswordMode ? (
            <KeyRound className='h-8 w-8 text-black' />
          ) : (
            <Lock className='h-8 w-8 text-black' />
          )}
        </div>
        <h2 className='text-2xl font-bold'>
          {isPasswordMode ? 'Enter Admin Password' : 'Enter Wallet PIN'}
        </h2>
        {isPasswordMode && <p className='mt-2 text-sm text-gray-500'>Admin mode enabled</p>}
      </div>

      <div className='space-y-4'>
        {isPasswordMode ? (
          /* Password Input Mode */
          <div className='px-4'>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter admin password'
              className='h-14 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-lg'
              autoFocus
              disabled={isLoading}
            />
          </div>
        ) : (
          /* PIN Display Mode - show dots for entered digits */
          <>
            <div className='flex justify-center gap-3'>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50'
                >
                  {pin.length > index && <div className='h-3 w-3 rounded-full bg-gray-900' />}
                </div>
              ))}
            </div>

            {/* Number Keypad - only shown in PIN mode */}
            <NumericKeypad
              onNumberClick={handleNumberClick}
              onDelete={handleDelete}
              onLongPressDelete={handleLongPressDelete}
              showDecimal={false}
              disabled={isLoading}
            />
          </>
        )}

        {error && (
          <div className='rounded-lg bg-red-50 p-3'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
              <p className='text-sm text-red-900'>{error}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleUnlock}
          className='font-lg mt-6 w-full rounded-full'
          size='lg'
          disabled={(isPasswordMode ? password.length < 4 : pin.length < 4) || isLoading}
        >
          {isLoading ? 'Unlocking...' : 'Unlock'}
        </Button>
      </div>
    </div>
  );
}
