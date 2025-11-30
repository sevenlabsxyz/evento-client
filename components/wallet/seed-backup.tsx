'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface SeedBackupProps {
  mnemonic: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function SeedBackup({ mnemonic, onComplete, onSkip }: SeedBackupProps) {
  const [showSeed, setShowSeed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { markAsBackedUp } = useWallet();

  const words = mnemonic.split(' ');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      toast.success('Seed phrase copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy seed phrase');
    }
  };

  const handleComplete = () => {
    if (!confirmed) {
      toast.error('Please confirm you have saved your seed phrase');
      return;
    }
    markAsBackedUp();
    toast.success('Wallet backed up successfully!');
    onComplete();
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold'>Backup Your Seed Phrase</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          Write down these 12 words in order and store them safely
        </p>
      </div>

      <div className='rounded-lg bg-red-50 p-4'>
        <div className='flex gap-3'>
          <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600' />
          <div className='text-sm text-red-900'>
            <p className='font-medium'>Never share your seed phrase</p>
            <p className='mt-1'>
              Anyone with your seed phrase can access your funds. Store it securely offline.
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Your Seed Phrase</span>
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

        <div className={`rounded-lg border-2 border-dashed p-4 ${showSeed ? '' : 'blur-sm'}`}>
          <div className='grid grid-cols-2 gap-3'>
            {words.map((word, index) => (
              <div key={index} className='flex items-center gap-2 rounded-md bg-gray-50 p-2'>
                <span className='w-6 text-xs text-muted-foreground'>{index + 1}.</span>
                <span className='font-mono text-sm'>{word}</span>
              </div>
            ))}
          </div>
        </div>

        {showSeed && (
          <Button variant='outline' onClick={handleCopy} className='w-full'>
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
        )}

        <div className='flex items-start gap-3 rounded-lg bg-gray-50 p-4'>
          <input
            type='checkbox'
            id='confirm'
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className='mt-1 h-4 w-4 rounded border-gray-300'
          />
          <label htmlFor='confirm' className='text-sm'>
            I have written down my seed phrase and stored it in a safe place. I understand that I
            will need it to recover my wallet.
          </label>
        </div>
      </div>

      <div className='space-y-3'>
        <Button onClick={handleComplete} disabled={!confirmed} className='w-full' size='lg'>
          I've Saved My Seed Phrase
        </Button>
        <Button onClick={onSkip} variant='ghost' className='w-full'>
          I'll Do This Later
        </Button>
      </div>
    </div>
  );
}
