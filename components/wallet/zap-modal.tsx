'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAmountConverter, useZap } from '@/lib/hooks/use-wallet-payments';
import { toast } from '@/lib/utils/toast';
import { X, Zap as ZapIcon } from 'lucide-react';
import { useState } from 'react';

interface ZapModalProps {
  recipientId: string;
  recipientUsername: string;
  recipientName: string;
  recipientImage?: string;
  recipientLightningAddress?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ZapModal({
  recipientId,
  recipientUsername,
  recipientName,
  recipientImage,
  recipientLightningAddress,
  onClose,
  onSuccess,
}: ZapModalProps) {
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [message, setMessage] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('sats');

  const { sendZap, isLoading } = useZap();
  const { satsToUSD, usdToSats } = useAmountConverter();

  const quickAmounts = [1000, 5000, 10000, 21000];

  const handleAmountChange = async (value: string, mode: 'sats' | 'usd') => {
    if (mode === 'sats') {
      setAmount(value);
      if (value) {
        const usd = await satsToUSD(Number(value));
        setAmountUSD(usd.toFixed(2));
      } else {
        setAmountUSD('');
      }
    } else {
      setAmountUSD(value);
      if (value) {
        const sats = await usdToSats(Number(value));
        setAmount(sats.toString());
      } else {
        setAmount('');
      }
    }
  };

  const handleQuickAmount = async (sats: number) => {
    setAmount(sats.toString());
    const usd = await satsToUSD(sats);
    setAmountUSD(usd.toFixed(2));
  };

  const handleSendZap = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!recipientLightningAddress) {
      toast.error('Recipient has not set up their Lightning wallet');
      return;
    }

    try {
      await sendZap(recipientLightningAddress, Number(amount), message);
      toast.success(`Zapped ${recipientName}!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send zap');
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4'>
      <div className='w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl'>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Send a Zap</h3>
            <button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Recipient Info */}
          <div className='flex items-center gap-3 rounded-lg bg-gray-50 p-4'>
            <UserAvatar
              user={{
                name: recipientName,
                username: recipientUsername,
                image: recipientImage,
              }}
              size='md'
            />
            <div>
              <div className='font-medium'>{recipientName}</div>
              <div className='text-sm text-muted-foreground'>@{recipientUsername}</div>
            </div>
          </div>

          <div className='space-y-4'>
            {/* Quick Amount Buttons */}
            <div>
              <Label className='mb-2 block'>Quick Amount</Label>
              <div className='grid grid-cols-4 gap-2'>
                {quickAmounts.map((sats) => (
                  <button
                    key={sats}
                    onClick={() => handleQuickAmount(sats)}
                    className={`rounded-lg border-2 p-2 text-sm font-medium transition-colors ${
                      Number(amount) === sats
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {sats.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className='space-y-2'>
              <Label htmlFor='amount'>Custom Amount</Label>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Input
                    id='amount'
                    type='number'
                    value={inputMode === 'sats' ? amount : amountUSD}
                    onChange={(e) => handleAmountChange(e.target.value, inputMode)}
                    placeholder={inputMode === 'sats' ? 'Enter sats' : 'Enter USD'}
                    disabled={isLoading}
                  />
                  <span className='absolute right-3 top-3 text-sm text-muted-foreground'>
                    {inputMode === 'sats' ? 'sats' : 'USD'}
                  </span>
                </div>
                <Button
                  variant='outline'
                  onClick={() => setInputMode(inputMode === 'sats' ? 'usd' : 'sats')}
                  disabled={isLoading}
                >
                  {inputMode === 'sats' ? '$ USD' : '⚡ Sats'}
                </Button>
              </div>
              {amount && amountUSD && (
                <p className='text-xs text-muted-foreground'>
                  {inputMode === 'sats'
                    ? `≈ $${amountUSD} USD`
                    : `≈ ${Number(amount).toLocaleString()} sats`}
                </p>
              )}
            </div>

            {/* Message */}
            <div className='space-y-2'>
              <Label htmlFor='message'>Message (Optional)</Label>
              <Textarea
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='Add a message with your zap...'
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={handleSendZap}
            disabled={isLoading || !amount || Number(amount) <= 0}
            className='w-full'
            size='lg'
          >
            {isLoading ? (
              'Sending Zap...'
            ) : (
              <>
                <ZapIcon className='mr-2 h-5 w-5 fill-current' />
                Send Zap
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
