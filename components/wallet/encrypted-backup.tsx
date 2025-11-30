'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Check, Copy, Eye, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';

interface EncryptedBackupProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export function EncryptedBackup({ onComplete, onCancel }: EncryptedBackupProps) {
  const [step, setStep] = useState<'password' | 'backup'>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [encryptedSeed, setEncryptedSeed] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { getEncryptedBackup, isLoading, markAsBackedUp } = useWallet();

  const handleGetBackup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      const backup = await getEncryptedBackup(password);
      setEncryptedSeed(backup);
      setStep('backup');
    } catch (error: any) {
      toast.error(error.message || 'Invalid password');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(encryptedSeed);
      setCopied(true);
      toast.success('Backup copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleComplete = () => {
    if (!confirmed) {
      toast.error('Please confirm you have saved your backup');
      return;
    }
    markAsBackedUp();
    toast.success('Wallet backed up successfully!');
    onComplete();
  };

  if (step === 'password') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
            <Shield className='h-8 w-8 text-orange-600' />
          </div>
          <h2 className='text-2xl font-bold'>Backup Your Wallet</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Confirm your password to export encrypted backup
          </p>
        </div>

        <form onSubmit={handleGetBackup} className='space-y-4'>
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

          <div className='flex gap-3'>
            <Button type='submit' className='flex-1' size='lg' disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Continue'}
            </Button>
            {onCancel && (
              <Button
                type='button'
                onClick={onCancel}
                variant='outline'
                size='lg'
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50'>
          <Shield className='h-8 w-8 text-green-600' />
        </div>
        <h2 className='text-2xl font-bold'>Encrypted Backup</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Save this encrypted backup to a secure location
        </p>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='backup'>Encrypted Wallet Backup</Label>
          <Textarea
            id='backup'
            value={encryptedSeed}
            readOnly
            rows={4}
            className='break-all font-mono text-xs'
          />
        </div>

        <Button onClick={handleCopy} variant='outline' className='w-full' size='lg'>
          {copied ? (
            <>
              <Check className='mr-2 h-4 w-4' />
              Copied!
            </>
          ) : (
            <>
              <Copy className='mr-2 h-4 w-4' />
              Copy to Clipboard
            </>
          )}
        </Button>

        <div className='rounded-lg bg-amber-50 p-4'>
          <div className='flex items-start gap-2'>
            <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <div className='text-sm text-amber-900'>
              <p className='font-medium'>Important: Save This Backup</p>
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>Save to Google Drive, iCloud, or another secure cloud storage</li>
                <li>This backup is encrypted with your password</li>
                <li>You'll need both the backup AND your password to restore</li>
                <li>Without this backup, you could lose access to your funds</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='rounded-lg bg-blue-50 p-4'>
          <div className='flex items-start gap-2'>
            <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
            <div className='text-sm text-blue-900'>
              <p className='font-medium'>Why Backup?</p>
              <p className='mt-1'>
                If you lose your device, forget your password, or need to restore your wallet on a
                new device, this encrypted backup is your only way to recover your funds. Keep it
                safe!
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-start gap-3 rounded-lg bg-gray-50 p-4'>
          <input
            type='checkbox'
            id='confirm-backup'
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className='mt-1 h-4 w-4 rounded border-gray-300'
          />
          <label htmlFor='confirm-backup' className='text-sm'>
            I have saved my encrypted backup to a secure location. I understand that I will need
            both this backup AND my password to restore my wallet.
          </label>
        </div>

        <div className='flex gap-3'>
          <Button onClick={handleComplete} disabled={!confirmed} className='flex-1' size='lg'>
            I've Saved My Backup
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant='outline' size='lg'>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
