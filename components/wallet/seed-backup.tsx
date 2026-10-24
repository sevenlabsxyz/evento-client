'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/hooks/use-wallet';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SeedBackupProps {
  mnemonic: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function SeedBackup({ mnemonic, onComplete, onCancel }: SeedBackupProps) {
  const t = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const [showSeed, setShowSeed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { markAsBackedUp } = useWallet();

  const words = mnemonic.split(' ');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      toast.success(t('seedBackup.copied'));
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error(t('seedBackup.copyFailed'));
    }
  };

  const handleComplete = () => {
    if (!confirmed) {
      toast.error(t('seedBackup.confirmRequired'));
      return;
    }
    markAsBackedUp();
    toast.success(t('seedBackup.success'));
    onComplete();
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold'>{t('seedBackup.title')}</h2>
        <p className='mt-2 text-sm text-muted-foreground'>{t('seedBackup.description')}</p>
      </div>

      <div className='rounded-2xl bg-red-50 p-4 dark:border dark:border-red-900 dark:bg-red-950/40'>
        <div className='flex gap-3'>
          <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400' />
          <div className='text-sm text-red-900 dark:text-red-400'>
            <p className='font-medium'>{t('seedBackup.keepPrivate')}</p>
            <p className='mt-1'>{t('seedBackup.keepPrivateDescription')}</p>
          </div>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>{t('seedBackup.title')}</span>
          <Button variant='ghost' size='sm' onClick={() => setShowSeed(!showSeed)}>
            {showSeed ? (
              <>
                <EyeOff className='mr-2 h-4 w-4' />
                {t('seedBackup.hide')}
              </>
            ) : (
              <>
                <Eye className='mr-2 h-4 w-4' />
                {t('seedBackup.show')}
              </>
            )}
          </Button>
        </div>

        <div
          className={`rounded-2xl border-2 border-dashed p-4 dark:border-neutral-700 ${showSeed ? '' : 'blur-sm'}`}
        >
          <div className='grid grid-cols-2 gap-3'>
            {words.map((word, index) => (
              <div
                key={index}
                className='flex items-center gap-2 rounded-xl bg-gray-50 p-2 dark:bg-neutral-950'
              >
                <span className='w-6 text-xs text-muted-foreground'>{index + 1}.</span>
                <span className='font-mono text-sm dark:text-neutral-100'>{word}</span>
              </div>
            ))}
          </div>
        </div>

        {showSeed && (
          <Button variant='outline' onClick={handleCopy} className='w-full rounded-full'>
            {copied ? (
              <>
                <Check className='mr-2 h-4 w-4' />
                {t('seedBackup.copiedButton')}
              </>
            ) : (
              <>
                <Copy className='mr-2 h-4 w-4' />
                {t('seedBackup.copyToClipboard')}
              </>
            )}
          </Button>
        )}

        <div className='flex items-start gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-neutral-950'>
          <input
            type='checkbox'
            id='confirm'
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className='mt-1 h-4 w-4 rounded border-gray-300 dark:border-neutral-700'
          />
          <label htmlFor='confirm' className='text-sm'>
            {t('seedBackup.savedConfirm')}
          </label>
        </div>
      </div>

      <div className='space-y-3'>
        <Button
          onClick={handleComplete}
          disabled={!confirmed}
          className='w-full rounded-full'
          size='lg'
        >
          {tCommon('actions.done')}
        </Button>
        <Button onClick={onCancel} variant='ghost' className='w-full rounded-full'>
          {tCommon('actions.cancel')}
        </Button>
      </div>
    </div>
  );
}
