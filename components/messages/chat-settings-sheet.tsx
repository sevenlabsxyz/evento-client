'use client';

import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { toast } from '@/lib/utils/toast';
import { AlertTriangle, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getSecretKeyNsec: () => string | null;
}

export function ChatSettingsSheet({
  open,
  onOpenChange,
  getSecretKeyNsec,
}: ChatSettingsSheetProps) {
  const [secretKey, setSecretKey] = useState('');
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setSecretKey('');
      setIsSecretVisible(false);
      setCopied(false);
    }
  }, [open]);

  const handleReveal = () => {
    const nextSecret = getSecretKeyNsec();

    if (!nextSecret) {
      toast.error('Unable to load secret key. Reopen this chat screen and try again.');
      return;
    }

    setSecretKey(nextSecret);
    setIsSecretVisible(true);
  };

  const handleHide = () => {
    setIsSecretVisible(false);
    setSecretKey('');
  };

  const handleCopySecret = async () => {
    if (!secretKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      toast.success('Secret key copied to clipboard');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy secret key');
    }
  };

  return (
    <MasterScrollableSheet
      open={open}
      onOpenChange={onOpenChange}
      title='Chat Settings'
      headerLeft={<div className='text-sm font-semibold text-gray-600'>Chat Settings</div>}
    >
      <div className='space-y-4 px-4 pb-6'>
        <section className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
          <div className='mb-3 flex items-center gap-2 text-gray-900'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100'>
              <ShieldCheck className='h-4 w-4 text-blue-600' />
            </div>
            <h3 className='font-semibold'>Secure identity info</h3>
          </div>
          <div className='space-y-2 text-sm text-gray-600'>
            <p>
              Your private chat key is used only on this device to decrypt your messages and sign
              outgoing key material.
            </p>
            <p>
              It is stored locally and <strong>not sent to the Evento server</strong>. We only sync
              your public key.
            </p>
          </div>
        </section>

        <section className='rounded-xl border border-gray-200 bg-white p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Lock className='h-4 w-4 text-gray-500' />
              <h3 className='text-sm font-semibold text-gray-900'>Nostr secret key (nsec)</h3>
            </div>
            {isSecretVisible ? (
              <button
                type='button'
                onClick={handleHide}
                className='flex items-center gap-1 text-xs text-gray-500'
              >
                <EyeOff className='h-3.5 w-3.5' />
                Hide
              </button>
            ) : null}
          </div>

          {isSecretVisible ? (
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-3'>
              <p className='break-all font-mono text-xs leading-6 text-gray-700'>{secretKey}</p>
            </div>
          ) : (
            <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3'>
              <div className='mb-1 flex items-center gap-1.5 text-xs text-gray-500'>
                <AlertTriangle className='h-3.5 w-3.5' />
                <span>Hidden until you choose to reveal it.</span>
              </div>
              <p className='break-all font-mono text-xs text-gray-400'>
                •••••••••••••••••••••••••••
              </p>
            </div>
          )}

          <div className='mt-3 flex gap-2'>
            {isSecretVisible ? (
              <Button onClick={handleCopySecret} size='sm' className='h-10 flex-1'>
                <KeyRound className='mr-1.5 h-4 w-4' />
                {copied ? 'Copied!' : 'Copy secret key'}
              </Button>
            ) : (
              <Button onClick={handleReveal} size='sm' className='h-10 flex-1'>
                <Eye className='mr-1.5 h-4 w-4' />
                Reveal secret key
              </Button>
            )}
          </div>
        </section>

        <Button
          onClick={() => onOpenChange(false)}
          size='sm'
          variant='outline'
          className='h-11 w-full'
        >
          Close
        </Button>
      </div>
    </MasterScrollableSheet>
  );
}
