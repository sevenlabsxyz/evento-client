'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, CheckCircle2, Key, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface WalletRestoreProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'input' | 'enter-pin' | 'connecting' | 'create-pin' | 'confirm-pin';
type InputType = 'encrypted' | 'mnemonic' | 'invalid';

function detectInputType(input: string): InputType {
  const trimmed = input.trim();
  if (!trimmed) return 'invalid';

  // Check for mnemonic: 12 or 24 words
  const words = trimmed.split(/\s+/);
  if (words.length === 12 || words.length === 24) {
    return 'mnemonic';
  }

  // Check for encrypted backup: base64-like, 80+ chars, no spaces
  if (trimmed.length > 80 && !trimmed.includes(' ')) {
    return 'encrypted';
  }

  return 'invalid';
}

export function WalletRestore({ onComplete, onCancel }: WalletRestoreProps) {
  const [step, setStep] = useState<Step>('input');
  const [backupInput, setBackupInput] = useState('');
  const [inputType, setInputType] = useState<InputType>('invalid');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { restoreWallet, restoreFromMnemonic } = useWallet();

  // Detect input type as user types
  const handleInputChange = (value: string) => {
    setBackupInput(value);
    setInputType(detectInputType(value));
    setError(null);
  };

  // Handle "Next" from input step
  const handleInputNext = () => {
    if (inputType === 'invalid') {
      setError('Please enter a valid backup string or 12-word seed phrase');
      return;
    }

    if (inputType === 'encrypted') {
      setStep('enter-pin');
    } else {
      // Mnemonic - go to create PIN step
      setStep('create-pin');
    }
  };

  // Handle PIN entry for encrypted backup
  const handleNumberClick = (num: string) => {
    if (step === 'enter-pin' && pin.length < 6) {
      setPin(pin + num);
    } else if (step === 'create-pin' && pin.length < 6) {
      setPin(pin + num);
    } else if (step === 'confirm-pin' && confirmPin.length < 6) {
      setConfirmPin(confirmPin + num);
    }
  };

  const handleDelete = () => {
    if (step === 'enter-pin' || step === 'create-pin') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm-pin') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  // Restore encrypted backup with PIN
  const handleRestoreEncrypted = async () => {
    if (pin.length < 4) {
      toast.error('Please enter your PIN');
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      await restoreWallet(backupInput.trim(), pin);
      toast.success('Wallet restored successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Invalid backup or PIN');
      setPin('');
    } finally {
      setIsRestoring(false);
    }
  };

  // Move to confirm PIN step
  const handleCreatePinNext = () => {
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    setStep('confirm-pin');
  };

  // Finalize mnemonic restore with new PIN
  const handleConfirmPin = async () => {
    if (confirmPin !== pin) {
      toast.error('PINs do not match');
      setConfirmPin('');
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      await restoreFromMnemonic(backupInput.trim(), pin);
      toast.success('Wallet restored successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to restore wallet');
      setStep('create-pin');
      setPin('');
      setConfirmPin('');
    } finally {
      setIsRestoring(false);
    }
  };

  // Render PIN dots
  const renderPinDots = (currentPin: string) => (
    <div className='flex justify-center gap-3'>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div
          key={index}
          className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50'
        >
          {currentPin.length > index && <div className='h-3 w-3 rounded-full bg-gray-900' />}
        </div>
      ))}
    </div>
  );

  // Step 1: Input backup/mnemonic
  if (step === 'input') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <RefreshCw className='h-8 w-8 text-primary' />
          </div>
          <h2 className='text-2xl font-bold'>Restore Your Wallet</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Enter your backup string or 12-word seed phrase
          </p>
        </div>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='backup'>Backup or Seed Phrase</Label>
            <Textarea
              id='backup'
              value={backupInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='Enter your encrypted backup or 12-word seed phrase'
              rows={4}
              className='font-mono text-sm'
            />
          </div>

          {/* Detection badge */}
          {backupInput.trim() && (
            <div className='flex items-center gap-2'>
              {inputType === 'encrypted' && (
                <span className='inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800'>
                  <Key className='h-3.5 w-3.5' />
                  Encrypted backup detected
                </span>
              )}
              {inputType === 'mnemonic' && (
                <span className='inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800'>
                  <CheckCircle2 className='h-3.5 w-3.5' />
                  Seed phrase detected
                </span>
              )}
              {inputType === 'invalid' && (
                <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800'>
                  <AlertCircle className='h-3.5 w-3.5' />
                  Invalid format
                </span>
              )}
            </div>
          )}

          {error && (
            <div className='rounded-lg bg-red-50 p-3'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
                <p className='text-sm text-red-900'>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <Button
            onClick={handleInputNext}
            disabled={inputType === 'invalid' || !backupInput.trim()}
            className='w-full'
            size='lg'
          >
            Next
          </Button>
          <Button onClick={onCancel} variant='outline' className='w-full'>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Step 2a: Enter PIN for encrypted backup
  if (step === 'enter-pin') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50'>
            <Key className='h-8 w-8 text-black' />
          </div>
          <h2 className='text-2xl font-bold'>Enter Your PIN</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Enter the PIN you used to encrypt this backup
          </p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(pin)}

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={false}
            disabled={isRestoring}
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
            onClick={handleRestoreEncrypted}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={pin.length < 4 || isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Restoring...
              </>
            ) : (
              'Restore Wallet'
            )}
          </Button>

          <Button
            onClick={() => {
              setStep('input');
              setPin('');
              setError(null);
            }}
            variant='ghost'
            className='w-full'
            disabled={isRestoring}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Create PIN (mnemonic flow)
  if (step === 'create-pin') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50'>
            <Key className='h-8 w-8 text-black' />
          </div>
          <h2 className='text-2xl font-bold'>Create a PIN</h2>
          <p className='mt-2 text-sm text-muted-foreground'>Create a PIN to protect your wallet</p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(pin)}

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={false}
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
            onClick={handleCreatePinNext}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={pin.length < 4}
          >
            Next
          </Button>

          <Button
            onClick={() => {
              setStep('input');
              setPin('');
              setError(null);
            }}
            variant='ghost'
            className='w-full'
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Confirm PIN (mnemonic flow)
  if (step === 'confirm-pin') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gray-50'>
            <Key className='h-8 w-8 text-black' />
          </div>
          <h2 className='text-2xl font-bold'>Confirm Your PIN</h2>
          <p className='mt-2 text-sm text-muted-foreground'>Enter your PIN again to confirm</p>
        </div>

        <div className='space-y-4'>
          {renderPinDots(confirmPin)}

          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={false}
            disabled={isRestoring}
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
            onClick={handleConfirmPin}
            className='mt-6 w-full rounded-full'
            size='lg'
            disabled={confirmPin.length < 4 || isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Restoring...
              </>
            ) : (
              'Complete'
            )}
          </Button>

          <Button
            onClick={() => {
              setStep('create-pin');
              setConfirmPin('');
              setError(null);
            }}
            variant='ghost'
            className='w-full'
            disabled={isRestoring}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
