'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, AlertTriangle, Check, Copy, Download, Eye, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';

interface MnemonicBackupFlowProps {
  /**
   * The mnemonic phrase to display (12 or 24 words).
   * IMPORTANT: This should only be passed during wallet creation,
   * never stored in component state or localStorage.
   */
  mnemonic: string;
  /**
   * Called when the user has confirmed they've backed up their mnemonic.
   */
  onComplete: () => void;
  /**
   * Called when the user wants to go back or cancel.
   */
  onCancel?: () => void;
  /**
   * Whether this is for a passkey-based wallet (shows passkey-specific warnings).
   * @default true
   */
  isPasskeyWallet?: boolean;
}

type Step = 'warning' | 'backup' | 'confirm';

export function MnemonicBackupFlow({
  mnemonic,
  onComplete,
  onCancel,
  isPasskeyWallet = true,
}: MnemonicBackupFlowProps) {
  const [step, setStep] = useState<Step>('warning');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = mnemonic.split(' ');
  const wordCount = words.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      toast.success('Recovery phrase copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy recovery phrase');
    }
  };

  const handleSave = async () => {
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

  const handleConfirmBackup = () => {
    if (!confirmed) {
      toast.error('Please confirm you have saved your recovery phrase');
      return;
    }
    toast.success('Backup confirmed!');
    onComplete();
  };

  // Step 1: Warning screen
  if (step === 'warning') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50'>
            <AlertTriangle className='h-8 w-8 text-red-600' />
          </div>
          <h2 className='text-2xl font-bold'>Critical: Backup Required</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Your wallet recovery phrase will be shown next
          </p>
        </div>

        {isPasskeyWallet && (
          <div className='rounded-2xl bg-red-50 p-4'>
            <div className='flex gap-3'>
              <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-600' />
              <div className='text-sm text-red-900'>
                <p className='font-medium'>Passkey Loss = Wallet Loss</p>
                <p className='mt-1'>
                  If you lose your passkey (device loss, browser data cleared, etc.) and
                  don&apos;t have this recovery phrase, <strong>your funds will be permanently lost</strong>.
                  There is no way to recover your wallet without this phrase.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='rounded-2xl bg-amber-50 p-4'>
          <div className='flex gap-3'>
            <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <div className='text-sm text-amber-900'>
              <p className='font-medium'>Before You Continue</p>
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>Have pen and paper ready to write down the words</li>
                <li>Be in a private space where others can&apos;t see your screen</li>
                <li>Never share your recovery phrase with anyone</li>
                <li>Never store it digitally (photos, cloud, email)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <Button
            onClick={() => setStep('backup')}
            className='w-full rounded-full'
            size='lg'
          >
            I Understand, Show My Recovery Phrase
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant='ghost' className='w-full rounded-full'>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Show mnemonic
  if (step === 'backup') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>Your Recovery Phrase</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Write down these {wordCount} words in order and store them safely
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
            <Button variant='ghost' size='sm' onClick={() => setShowMnemonic(!showMnemonic)}>
              {showMnemonic ? (
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

          <div className={`rounded-2xl border-2 border-dashed p-4 ${showMnemonic ? '' : 'blur-sm select-none'}`}>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {words.map((word, index) => (
                <div key={index} className='flex items-center gap-2 rounded-xl bg-gray-50 p-2'>
                  <span className='w-6 flex-shrink-0 text-xs text-muted-foreground'>{index + 1}.</span>
                  <span className='font-mono text-sm'>{word}</span>
                </div>
              ))}
            </div>
          </div>

          {showMnemonic && (
            <div className='flex gap-3'>
              <Button
                variant='ghost'
                onClick={handleCopy}
                className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
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
                variant='ghost'
                onClick={handleSave}
                className='flex-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100'
              >
                <Download className='mr-2 h-4 w-4' />
                Save
              </Button>
            </div>
          )}

          <div className='flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
            <Checkbox
              id='confirm-backup'
              checked={confirmed}
              onCheckedChange={(checked: boolean) => setConfirmed(checked)}
            />
            <Label htmlFor='confirm-backup' className='text-sm font-normal leading-relaxed'>
              I have written down my recovery phrase and stored it in a safe place.
              I understand that losing this phrase means losing access to my wallet.
            </Label>
          </div>
        </div>

        <div className='space-y-3'>
          <Button
            onClick={() => {
              if (!confirmed) {
                toast.error('Please confirm you have saved your recovery phrase');
                return;
              }
              setStep('confirm');
            }}
            disabled={!confirmed}
            className='w-full rounded-full'
            size='lg'
          >
            I&apos;ve Saved My Recovery Phrase
          </Button>
          <Button
            onClick={() => setStep('warning')}
            variant='ghost'
            className='w-full rounded-full'
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Final confirmation
  if (step === 'confirm') {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50'>
            <Shield className='h-8 w-8 text-green-600' />
          </div>
          <h2 className='text-2xl font-bold'>One Last Check</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Please verify your backup is complete
          </p>
        </div>

        <div className='rounded-2xl bg-blue-50 p-4'>
          <div className='flex gap-3'>
            <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
            <div className='text-sm text-blue-900'>
              <p className='font-medium'>Backup Checklist</p>
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>I wrote down all {wordCount} words in the correct order</li>
                <li>I stored the paper in a secure location</li>
                <li>I did not take a photo or save it digitally</li>
                <li>I did not share it with anyone</li>
              </ul>
            </div>
          </div>
        </div>

        {isPasskeyWallet && (
          <div className='rounded-2xl border border-orange-200 bg-orange-50 p-4'>
            <div className='flex gap-3'>
              <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600' />
              <div className='text-sm text-orange-900'>
                <p className='font-medium'>Remember</p>
                <p className='mt-1'>
                  Your passkey alone is not enough to recover your wallet on a new device.
                  This recovery phrase is your only backup.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-3'>
          <Button onClick={handleConfirmBackup} className='w-full rounded-full' size='lg'>
            Complete Setup
          </Button>
          <Button
            onClick={() => setStep('backup')}
            variant='outline'
            className='w-full rounded-full'
          >
            View Recovery Phrase Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}