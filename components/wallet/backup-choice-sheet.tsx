'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Textarea } from '@/components/ui/textarea';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useWallet } from '@/lib/hooks/use-wallet';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { toast } from '@/lib/utils/toast';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Key,
  KeyRound,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

type Step = 'choice' | 'password' | 'backup' | 'seed-pin' | 'seed-view';

interface BackupChoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSeedPhrase?: () => void;
  onEncryptedBackupComplete: () => void;
}

export function BackupChoiceSheet({
  open,
  onOpenChange,
  onEncryptedBackupComplete,
}: BackupChoiceSheetProps) {
  const [step, setStep] = useState<Step>('choice');
  const [pin, setPin] = useState('');
  const [encryptedSeed, setEncryptedSeed] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { getEncryptedBackup, isLoading, markAsBackedUp } = useWallet();

  // Seed phrase backup state
  const [seedPin, setSeedPin] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showSeed, setShowSeed] = useState(false);
  const [seedConfirmed, setSeedConfirmed] = useState(false);
  const [seedCopied, setSeedCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Admin password mode state
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const [isSeedPasswordMode, setIsSeedPasswordMode] = useState(false);
  const [seedPassword, setSeedPassword] = useState('');

  const resetState = () => {
    setStep('choice');
    setPin('');
    setEncryptedSeed('');
    setCopied(false);
    setConfirmed(false);
    // Reset seed phrase state
    setSeedPin('');
    setMnemonic('');
    setShowSeed(false);
    setSeedConfirmed(false);
    setSeedCopied(false);
    // Reset password mode state
    setIsPasswordMode(false);
    setPassword('');
    setIsSeedPasswordMode(false);
    setSeedPassword('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  // Long-press delete handlers for admin password mode
  const handleLongPressDelete = () => {
    setIsPasswordMode(true);
    setPin('');
  };

  const handleSeedLongPressDelete = () => {
    setIsSeedPasswordMode(true);
    setSeedPin('');
  };

  const handleGetBackup = async () => {
    const credential = isPasswordMode ? password : pin;

    if (!credential || credential.length < 4) {
      toast.error(isPasswordMode ? 'Please enter your password' : 'Please enter your PIN');
      return;
    }

    try {
      const backup = await getEncryptedBackup(credential);
      setEncryptedSeed(backup);
      setStep('backup');
    } catch (error: any) {
      toast.error(error.message || (isPasswordMode ? 'Invalid password' : 'Invalid PIN'));
      if (isPasswordMode) {
        setPassword('');
      } else {
        setPin('');
      }
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

  const handleSave = async () => {
    const blob = new Blob([encryptedSeed], { type: 'text/plain' });
    const file = new File([blob], 'evento-wallet-encrypted-backup.txt', {
      type: 'text/plain',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      // Use native share on mobile
      try {
        await navigator.share({
          files: [file],
          title: 'Wallet Backup',
        });
        toast.success('Backup shared successfully');
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share backup');
        }
      }
    } else {
      // Fallback: trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evento-wallet-encrypted-backup.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    }
  };

  const handleComplete = () => {
    if (!confirmed) {
      toast.error('Please confirm you have saved your backup');
      return;
    }
    markAsBackedUp();
    toast.success('Wallet backed up successfully!');
    handleOpenChange(false);
    onEncryptedBackupComplete();
  };

  // Seed phrase handlers
  const handleSeedPinVerify = async () => {
    const credential = isSeedPasswordMode ? seedPassword : seedPin;

    if (!credential || credential.length < 4) {
      toast.error(isSeedPasswordMode ? 'Please enter your password' : 'Please enter your PIN');
      return;
    }

    setIsVerifying(true);
    try {
      const encryptedSeedData = WalletStorageService.getEncryptedSeed();
      if (!encryptedSeedData) {
        toast.error('No wallet found');
        return;
      }

      const decrypted = await WalletStorageService.decryptSeed(encryptedSeedData, credential);
      setMnemonic(decrypted);
      setStep('seed-view');
    } catch (error: any) {
      toast.error(isSeedPasswordMode ? 'Invalid password' : 'Invalid PIN');
      if (isSeedPasswordMode) {
        setSeedPassword('');
      } else {
        setSeedPin('');
      }
      setSeedPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSeedCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setSeedCopied(true);
      toast.success('Recovery phrase copied to clipboard');
      setTimeout(() => setSeedCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSeedSave = async () => {
    const blob = new Blob([mnemonic], { type: 'text/plain' });
    const file = new File([blob], 'evento-wallet-recovery-phrase.txt', {
      type: 'text/plain',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Recovery Phrase',
        });
        toast.success('Recovery phrase shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share recovery phrase');
        }
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evento-wallet-recovery-phrase.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Recovery phrase downloaded');
    }
  };

  const handleSeedComplete = () => {
    if (!seedConfirmed) {
      toast.error('Please confirm you have saved your recovery phrase');
      return;
    }
    markAsBackedUp();
    toast.success('Wallet backed up successfully!');
    handleOpenChange(false);
    onEncryptedBackupComplete();
  };

  const words = mnemonic ? mnemonic.split(' ') : [];

  // Dynamic title based on current step
  const stepTitles: Record<Step, string> = {
    choice: 'Choose Backup Method',
    password: 'Backup Your Wallet',
    backup: 'Encrypted Backup',
    'seed-pin': 'View Recovery Phrase',
    'seed-view': 'Your Recovery Phrase',
  };

  return (
    <MasterScrollableSheet open={open} onOpenChange={handleOpenChange} title={stepTitles[step]}>
      {/* Choice Step */}
      {step === 'choice' && (
        <div className='px-4 pb-8'>
          <div className='space-y-3'>
            {/* Encrypted Backup Option - Recommended */}
            <button
              onClick={() => setStep('password')}
              className='flex w-full items-center gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100'
            >
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-green-300 bg-green-100'>
                <Shield className='h-6 w-6 text-green-600' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold text-gray-900'>Encrypted Backup</p>
                  <span className='rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'>
                    Recommended
                  </span>
                </div>
                <p className='mt-0.5 text-sm text-gray-500'>
                  PIN-protected backup that you can save to cloud storage.
                </p>
              </div>
              <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
            </button>

            {/* Recovery Phrase Option */}
            <button
              onClick={() => setStep('seed-pin')}
              className='flex w-full items-center gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100'
            >
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-orange-300 bg-orange-100'>
                <Key className='h-6 w-6 text-orange-600' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <p className='font-semibold text-gray-900'>Recovery Phrase</p>
                  <span className='rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700'>
                    Advanced
                  </span>
                </div>
                <p className='mt-0.5 text-sm text-gray-500'>
                  Write down your 12-word recovery phrase (also known as seed phrase)
                </p>
              </div>
              <ChevronRight className='h-5 w-5 flex-shrink-0 text-gray-400' />
            </button>
          </div>

          <p className='mx-auto mt-6 max-w-sm text-center text-xs text-gray-400'>
            Your backup is the only way to recover your funds if you lose access to this device.
            <br />
            <br />
            If you choose the recovery phrase option and lose it, you will lose access to your
            funds.
          </p>
        </div>
      )}

      {/* PIN Step for Encrypted Backup */}
      {step === 'password' && (
        <div className='space-y-6 px-4 pb-8'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
              {isPasswordMode ? (
                <KeyRound className='h-8 w-8 text-orange-600' />
              ) : (
                <Shield className='h-8 w-8 text-orange-600' />
              )}
            </div>
            <p className='text-sm text-muted-foreground'>
              {isPasswordMode
                ? 'Enter your admin password to export encrypted backup'
                : 'Enter your PIN to export encrypted backup'}
            </p>
            {isPasswordMode && (
              <p className='mt-1 text-xs text-muted-foreground'>Admin mode enabled</p>
            )}
          </div>

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
            /* PIN Display Mode */
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

              <NumericKeypad
                onNumberClick={(num) => {
                  if (pin.length < 6) {
                    setPin(pin + num);
                  }
                }}
                onDelete={() => setPin(pin.slice(0, -1))}
                onLongPressDelete={handleLongPressDelete}
                showDecimal={false}
                disabled={isLoading}
              />
            </>
          )}

          {/* Buttons */}
          <div className='flex flex-col gap-3'>
            <Button
              onClick={handleGetBackup}
              className='w-full rounded-full'
              size='lg'
              disabled={(isPasswordMode ? password.length < 4 : pin.length < 4) || isLoading}
            >
              {isLoading ? 'Verifying...' : 'Continue'}
              {!isLoading && <ArrowRight className='ml-2 h-4 w-4' />}
            </Button>
            <Button
              onClick={() => setStep('choice')}
              variant='outline'
              className='w-full rounded-full'
              size='lg'
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Backup Step for Encrypted Backup */}
      {step === 'backup' && (
        <div className='space-y-6 px-4 pb-8'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50'>
              <Shield className='h-8 w-8 text-green-600' />
            </div>
            <p className='text-sm text-muted-foreground'>
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
                className='break-all rounded-2xl font-mono text-xs'
              />
            </div>

            <div className='flex gap-3'>
              <Button
                onClick={handleCopy}
                variant='ghost'
                className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
                size='lg'
              >
                {copied ? (
                  <>
                    <Check className='mr-2 h-4 w-4' />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className='mr-2 h-4 w-4' />
                    Copy
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                variant='ghost'
                className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
                size='lg'
              >
                <Download className='mr-2 h-4 w-4' />
                Save
              </Button>
            </div>

            <div className='rounded-2xl border border-blue-300 bg-blue-50 p-4'>
              <div className='flex items-start gap-2'>
                <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
                <div className='text-sm text-blue-900'>
                  <p className='font-medium'>Why Backup?</p>
                  <p className='mt-1'>
                    If you lose your device, forget your PIN, or need to restore your wallet on a
                    new device, this encrypted backup is your only way to recover your funds. Keep
                    it safe!
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
              <Checkbox
                id='confirm-backup'
                checked={confirmed}
                onCheckedChange={(checked: boolean) => setConfirmed(checked)}
              />
              <Label htmlFor='confirm-backup' className='text-sm font-normal leading-relaxed'>
                I have saved my encrypted backup to a secure location. I understand that I will need
                both this backup AND my PIN to restore my wallet.
              </Label>
            </div>

            <div className='flex flex-col gap-3'>
              <Button
                onClick={handleComplete}
                disabled={!confirmed}
                className='w-full rounded-full'
                size='lg'
              >
                I&apos;ve Saved My Backup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Step for Recovery Phrase */}
      {step === 'seed-pin' && (
        <div className='space-y-6 px-4 pb-8'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50'>
              {isSeedPasswordMode ? (
                <KeyRound className='h-8 w-8 text-orange-600' />
              ) : (
                <Key className='h-8 w-8 text-orange-600' />
              )}
            </div>
            <p className='text-sm text-muted-foreground'>
              {isSeedPasswordMode
                ? 'Enter your admin password to view your recovery phrase'
                : 'Enter your PIN to view your recovery phrase'}
            </p>
            {isSeedPasswordMode && (
              <p className='mt-1 text-xs text-muted-foreground'>Admin mode enabled</p>
            )}
          </div>

          {isSeedPasswordMode ? (
            /* Password Input Mode */
            <div className='px-4'>
              <Input
                type='password'
                value={seedPassword}
                onChange={(e) => setSeedPassword(e.target.value)}
                placeholder='Enter admin password'
                className='h-14 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-lg'
                autoFocus
                disabled={isVerifying}
              />
            </div>
          ) : (
            /* PIN Display Mode */
            <>
              <div className='flex justify-center gap-3'>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50'
                  >
                    {seedPin.length > index && <div className='h-3 w-3 rounded-full bg-gray-900' />}
                  </div>
                ))}
              </div>

              <NumericKeypad
                onNumberClick={(num) => {
                  if (seedPin.length < 6) {
                    setSeedPin(seedPin + num);
                  }
                }}
                onDelete={() => setSeedPin(seedPin.slice(0, -1))}
                onLongPressDelete={handleSeedLongPressDelete}
                showDecimal={false}
                disabled={isVerifying}
              />
            </>
          )}

          {/* Buttons */}
          <div className='flex flex-col gap-3'>
            <Button
              onClick={handleSeedPinVerify}
              className='w-full rounded-full'
              size='lg'
              disabled={
                (isSeedPasswordMode ? seedPassword.length < 4 : seedPin.length < 4) || isVerifying
              }
            >
              {isVerifying ? 'Verifying...' : 'Continue'}
              {!isVerifying && <ArrowRight className='ml-2 h-4 w-4' />}
            </Button>
            <Button
              onClick={() => {
                setSeedPin('');
                setSeedPassword('');
                setIsSeedPasswordMode(false);
                setStep('choice');
              }}
              variant='outline'
              className='w-full rounded-full'
              size='lg'
              disabled={isVerifying}
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Recovery Phrase View Step */}
      {step === 'seed-view' && (
        <div className='space-y-6 px-4 pb-8'>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>
              Write down these 12 words in order and store them safely
            </p>
          </div>

          <div className='rounded-2xl bg-red-50 p-4'>
            <div className='flex gap-3'>
              <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600' />
              <div className='text-sm text-red-900'>
                <p className='font-medium'>Keep this private</p>
                <p className='mt-1'>
                  Anyone with these words can access your wallet. Store them securely offline.
                </p>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Your Recovery Phrase</span>
              <Button variant='ghost' size='sm' onClick={() => setShowSeed(!showSeed)}>
                {showSeed ? (
                  <>
                    <EyeOff className='mr-2 h-4 w-4' />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className='mr-2 h-4 w-4' />
                    Show
                  </>
                )}
              </Button>
            </div>

            <div className={`rounded-2xl border-2 border-dashed p-4 ${showSeed ? '' : 'blur-sm'}`}>
              <div className='grid grid-cols-2 gap-3'>
                {words.map((word, index) => (
                  <div key={index} className='flex items-center gap-2 rounded-xl bg-gray-50 p-2'>
                    <span className='w-6 text-xs text-muted-foreground'>{index + 1}.</span>
                    <span className='font-mono text-sm'>{word}</span>
                  </div>
                ))}
              </div>
            </div>

            {showSeed && (
              <div className='flex gap-3'>
                <Button
                  variant='ghost'
                  onClick={handleSeedCopy}
                  className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
                >
                  {seedCopied ? (
                    <>
                      <Check className='mr-2 h-4 w-4' />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className='mr-2 h-4 w-4' />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant='ghost'
                  onClick={handleSeedSave}
                  className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
                >
                  <Download className='mr-2 h-4 w-4' />
                  Save
                </Button>
              </div>
            )}

            <div className='flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
              <Checkbox
                id='confirm-seed'
                checked={seedConfirmed}
                onCheckedChange={(checked: boolean) => setSeedConfirmed(checked)}
              />
              <Label htmlFor='confirm-seed' className='text-sm font-normal'>
                I&apos;ve saved my recovery phrase in a safe place
              </Label>
            </div>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={handleSeedComplete}
              disabled={!seedConfirmed}
              className='w-full rounded-full'
              size='lg'
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </MasterScrollableSheet>
  );
}
