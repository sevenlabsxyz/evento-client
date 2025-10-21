'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { Eye, EyeOff, Lock, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface WalletRestoreProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function WalletRestore({ onComplete, onCancel }: WalletRestoreProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { restoreWallet } = useWallet();

  const handleRestore = async () => {
    const trimmedInput = mnemonic.trim();

    // Check if it's encrypted backup (base64 string, typically 100+ chars with no spaces)
    const isEncryptedBackup = trimmedInput.length > 80 && !trimmedInput.includes(' ');

    if (!isEncryptedBackup) {
      toast.error('Invalid backup string');
      return;
    }

    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    try {
      setIsRestoring(true);
      await restoreWallet(trimmedInput, password);
      toast.success('Wallet restored successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore wallet');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
          <RefreshCw className='h-8 w-8 text-primary' />
        </div>
        <h2 className='text-2xl font-bold'>Restore Your Wallet</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Enter your backup string to restore your wallet
        </p>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='mnemonic'>Backup String</Label>
          <Textarea
            id='mnemonic'
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            placeholder='Enter your backup string'
            rows={4}
            disabled={isRestoring}
            className='font-mono text-sm'
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <div className='relative'>
            <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter password'
              className='pl-10 pr-10'
              disabled={isRestoring}
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
      </div>

      <div className='space-y-3'>
        <Button
          onClick={handleRestore}
          disabled={isRestoring || !mnemonic || !password}
          className='w-full'
          size='lg'
        >
          {isRestoring ? 'Restoring Wallet...' : 'Restore Wallet'}
        </Button>
        <Button onClick={onCancel} variant='outline' className='w-full' disabled={isRestoring}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
