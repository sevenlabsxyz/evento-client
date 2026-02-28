'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useWallet } from '@/lib/hooks/use-wallet';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { useWalletSeedStore } from '@/lib/stores/wallet-seed-store';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, AlertTriangle, KeyRound, Lock } from 'lucide-react';
import { useState } from 'react';

interface WalletUnlockProps {
  onUnlock?: () => void;
}

export function WalletUnlock({ onUnlock }: WalletUnlockProps) {
  const [pin, setPin] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [showRemoveSheet, setShowRemoveSheet] = useState(false);
  const [confirmStep, setConfirmStep] = useState<'info' | 'confirm'>('info');
  const { unlockWallet, isLoading, error } = useWallet();
  const clearSeed = useWalletSeedStore((state) => state.clearSeed);

  const handleNumberClick = (number: string) => {
    if (pin.length < 6) {
      const newPin = pin + number;
      setPin(newPin);
      // Auto-submit when 4 digits entered (covers most users)
      // Users with legacy 5-6 digit PINs can continue typing and use the button
      if (newPin.length === 4) {
        setTimeout(() => handleUnlock(newPin), 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLongPressDelete = () => {
    setIsPasswordMode(true);
    setPin(''); // Clear PIN when switching modes
  };

  const handleRemoveWallet = () => {
    // Clear all wallet data from localStorage
    WalletStorageService.clearWalletData();
    // Clear in-memory seed
    clearSeed();
    // Close sheet
    setShowRemoveSheet(false);
    // Force page reload to reset all state
    window.location.reload();
  };

  const handleOpenRemoveSheet = () => {
    setConfirmStep('info');
    setShowRemoveSheet(true);
  };

  const handleUnlock = async (pinOverride?: string) => {
    const credential = isPasswordMode ? password : (pinOverride ?? pin);

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
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className='flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50'
                >
                  {pin.length > index && <div className='h-3.5 w-3.5 rounded-full bg-gray-900' />}
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

        <Button variant='ghost' onClick={handleOpenRemoveSheet} className='w-full text-gray-500'>
          Use different wallet
        </Button>
      </div>

      {/* Remove Wallet Confirmation Sheet */}
      <MasterScrollableSheet
        title='Start Fresh?'
        open={showRemoveSheet}
        onOpenChange={setShowRemoveSheet}
      >
        <div className='px-4 pb-8'>
          {confirmStep === 'info' ? (
            <div className='space-y-6'>
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Before you continue...</h3>
                <p className='text-gray-600'>
                  This will remove your wallet from this device. Make sure you have your backup
                  phrase saved somewhere safe before continuing.
                </p>
                <p className='text-gray-600'>
                  Without your backup phrase, there&apos;s no way to recover your funds. Evento
                  doesn&apos;t store your wallet information — only you have access to it.
                </p>
              </div>

              <div className='space-y-3'>
                <Button onClick={() => setConfirmStep('confirm')} className='w-full rounded-full'>
                  I understand, continue
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setShowRemoveSheet(false)}
                  className='w-full rounded-full'
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='flex flex-col items-center space-y-4 text-center'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
                  <AlertTriangle className='h-8 w-8 text-red-600' />
                </div>
                <h3 className='text-lg font-semibold'>Are you sure?</h3>
                <p className='text-gray-600'>
                  This cannot be undone. Once removed, you&apos;ll need your backup phrase to access
                  this wallet again.
                </p>
              </div>

              <div className='space-y-3'>
                <Button
                  variant='destructive'
                  onClick={handleRemoveWallet}
                  className='w-full rounded-full'
                >
                  Remove Wallet
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setConfirmStep('info')}
                  className='w-full rounded-full'
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </MasterScrollableSheet>
    </div>
  );
}
