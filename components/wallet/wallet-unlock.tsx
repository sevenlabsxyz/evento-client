'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

interface WalletUnlockProps {
  onUnlock?: () => void;
}

export function WalletUnlock({ onUnlock }: WalletUnlockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { unlockWallet, isLoading, error } = useWallet();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      await unlockWallet(password);
      toast.success('Wallet unlocked');
      onUnlock?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock wallet');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
          <Lock className='h-8 w-8 text-orange-600' />
        </div>
        <h2 className='text-2xl font-bold'>Unlock Wallet</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Enter your password to access your wallet
        </p>
      </div>

      <form onSubmit={handleUnlock} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              disabled={isLoading}
              className='pr-10'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
            >
              {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
          </div>
        </div>

        {error && (
          <div className='rounded-lg bg-red-50 p-3'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
              <p className='text-sm text-red-900'>{error}</p>
            </div>
          </div>
        )}

        <Button type='submit' className='w-full' size='lg' disabled={isLoading}>
          {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
        </Button>
      </form>

      <div className='rounded-lg bg-blue-50 p-4'>
        <div className='flex items-start gap-2'>
          <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
          <div className='text-sm text-blue-900'>
            <p className='font-medium'>Session Timeout</p>
            <p className='mt-1'>
              For security, your wallet automatically locks after 30 minutes of inactivity. You'll
              need to re-enter your password to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
