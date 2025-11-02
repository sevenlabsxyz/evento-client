'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Eye, EyeOff, Loader2, Wallet } from 'lucide-react';
import { useState } from 'react';

interface WalletSetupProps {
  onComplete: (mnemonic?: string) => void;
  onCancel?: () => void;
}

export function WalletSetup({ onComplete, onCancel }: WalletSetupProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createWallet } = useWallet();
  const { user } = useAuth();
  const { checkAvailability, registerAddress } = useLightningAddress();

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const mnemonic = await createWallet(password);

      // Automatically register Lightning address
      if (user?.username) {
        try {
          const baseUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
          let username = baseUsername;
          let isAvailable = false;
          let attempts = 0;

          // Try base username, then add numbers if taken
          while (!isAvailable && attempts < 10) {
            isAvailable = await checkAvailability(username);
            if (!isAvailable) {
              attempts++;
              username = `${baseUsername}${attempts}`;
            }
          }

          if (isAvailable) {
            await registerAddress(username, `Pay to ${user.name || user.username}`);
            console.log(`Lightning address registered: ${username}@evento.cash`);
          }
        } catch (error) {
          console.error('Failed to register Lightning address:', error);
          // Don't fail wallet creation if Lightning address registration fails
        }
      }

      toast.success('Wallet created successfully!');
      onComplete(mnemonic);
    } catch (error: any) {
      console.error('Wallet creation error:', error);

      // Provide helpful error messages
      let errorMessage = error.message || 'Failed to create wallet';

      if (error.message?.includes('API key')) {
        errorMessage = 'Breez API key is missing. Please contact support.';
      } else if (error.message?.includes('WASM') || error.message?.includes('defaultConfig')) {
        errorMessage = 'Wallet initialization failed. Please refresh the page and try again.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setIsCreating(false);
    }
  };

  // Show error state
  if (error) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-6 px-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <AlertCircle className='h-8 w-8 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold'>Setup Failed</h2>
          <p className='mt-2 text-sm text-muted-foreground'>{error}</p>
        </div>
        <div className='flex gap-3'>
          <Button onClick={handleCreateWallet} variant='default' size='lg'>
            Try Again
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant='outline' size='lg'>
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
          <Wallet className='h-8 w-8 text-orange-600' />
        </div>
        <h2 className='text-2xl font-bold'>Create Wallet Password</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Set a strong password to protect your wallet
        </p>
      </div>

      <form onSubmit={handleCreateWallet} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password (min 8 characters)'
              disabled={isCreating}
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

        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Re-enter password'
              disabled={isCreating}
              className='pr-10'
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
            >
              {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
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

        <div className='rounded-lg bg-amber-50 p-4'>
          <div className='flex items-start gap-2'>
            <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <div className='text-sm text-amber-900'>
              <p className='font-medium'>Important</p>
              <p className='mt-1'>
                Remember this password! You'll need it to access your wallet. If you forget it, you
                can only recover your wallet using your seed phrase.
              </p>
            </div>
          </div>
        </div>

        <div className='flex gap-3'>
          <Button type='submit' className='flex-1' size='lg' disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              'Create Wallet'
            )}
          </Button>
          {onCancel && (
            <Button
              type='button'
              onClick={onCancel}
              variant='outline'
              size='lg'
              disabled={isCreating}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
