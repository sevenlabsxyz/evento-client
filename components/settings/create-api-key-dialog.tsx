'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateApiKey } from '@/lib/hooks/use-api-keys';
import { toast } from '@/lib/utils/toast';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const MotionButton = motion(Button);
  const [name, setName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setGeneratedKey(null);
      setCopied(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('createApiKey.nameRequired'));
      return;
    }

    try {
      const result = await createApiKey.mutateAsync({ name: name.trim() });
      setGeneratedKey(result.key);
      toast.success(t('createApiKey.success'));
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('createApiKey.failed'));
      }
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success(t('createApiKey.copied'));

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('createApiKey.copyFailed'));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        {!generatedKey ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('createApiKey.title')}</DialogTitle>
              <DialogDescription>{t('createApiKey.description')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t('createApiKey.nameLabel')}</Label>
                  <Input
                    id='name'
                    placeholder={t('createApiKey.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    disabled={createApiKey.isPending}
                    autoFocus
                    className='dark:focus-visible:ring-offset-neutral-900'
                  />
                  <p className='text-xs text-gray-500 dark:text-neutral-400'>
                    {t('createApiKey.nameHint', { max: 50 })}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  disabled={createApiKey.isPending}
                >
                  {tCommon('actions.cancel')}
                </Button>
                <Button
                  type='submit'
                  disabled={!name.trim() || createApiKey.isPending}
                  className='bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  {createApiKey.isPending ? t('createApiKey.creating') : t('createApiKey.submit')}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('createApiKey.createdTitle')}</DialogTitle>
              <DialogDescription className='space-y-2'>
                <span className='block'>{t('createApiKey.createdDescription')}</span>
                <span className='block font-semibold text-red-600 dark:text-red-400'>
                  {t('createApiKey.copyNow')}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='api-key'>{t('createApiKey.keyLabel')}</Label>
                <div className='relative'>
                  <Input
                    id='api-key'
                    value={generatedKey}
                    readOnly
                    className='h-10 pr-12 font-mono text-sm dark:focus-visible:ring-offset-neutral-900'
                  />
                  <MotionButton
                    type='button'
                    size='icon'
                    variant='ghost'
                    onClick={handleCopy}
                    whileTap={{ scale: 1 }}
                    aria-label={t('createApiKey.copyKey')}
                    className='absolute right-0 top-0 h-full w-10 origin-center rounded-l-none rounded-r-md'
                  >
                    {copied ? (
                      <Check className='h-4 w-4 text-green-600 dark:text-green-400' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </MotionButton>
                </div>
              </div>

              <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40'>
                <p className='text-sm text-red-800 dark:text-red-400'>
                  {t.rich('createApiKey.storeSecurely', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className='bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                {t('createApiKey.savedKey')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
