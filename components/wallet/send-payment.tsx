'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useAmountConverter, useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { toast } from '@/lib/utils/toast';
import { AlertCircle, ArrowRight, Scan, ShieldAlert, X, Zap } from 'lucide-react';
import { useState } from 'react';

interface SendPaymentProps {
  onClose: () => void;
  onSuccess?: () => void;
  onBackupRequired?: () => void;
}

export function SendPayment({ onClose, onSuccess, onBackupRequired }: SendPaymentProps) {
  const [invoice, setInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('sats');
  const [step, setStep] = useState<'input' | 'confirm' | 'backup-warning'>('input');
  const { walletState } = useWallet();

  const { prepareSend, sendPayment, feeEstimate, isLoading } = useSendPayment();
  const { satsToUSD, usdToSats } = useAmountConverter();

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

  const handlePrepare = async () => {
    if (!invoice) {
      toast.error('Please enter a Lightning invoice');
      return;
    }

    // Check if wallet is backed up before allowing first transaction
    if (!walletState.hasBackup) {
      setStep('backup-warning');
      return;
    }

    try {
      await prepareSend(invoice, amount ? Number(amount) : undefined);
      setStep('confirm');
    } catch (error: any) {
      toast.error(error.message || 'Invalid invoice');
    }
  };

  const handleSend = async () => {
    try {
      await sendPayment(invoice, amount ? Number(amount) : undefined);
      toast.success('Payment sent successfully!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send payment');
    }
  };

  // Backup warning step
  if (step === 'backup-warning') {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Secure Your Wallet First</h3>
          <button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='space-y-4'>
          <div className='flex justify-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-amber-100'>
              <ShieldAlert className='h-10 w-10 text-amber-600' />
            </div>
          </div>

          <div className='text-center'>
            <h4 className='text-lg font-semibold'>Backup Your Seed Phrase</h4>
            <p className='mt-2 text-sm text-muted-foreground'>
              Before sending your first payment, you need to backup your wallet's seed phrase. This
              ensures you can recover your funds if you lose access to your device.
            </p>
          </div>

          <div className='rounded-lg bg-amber-50 p-4'>
            <div className='flex gap-3'>
              <AlertCircle className='h-5 w-5 flex-shrink-0 text-amber-600' />
              <div className='text-sm text-amber-900'>
                <p className='font-medium'>Why is this important?</p>
                <p className='mt-1'>
                  Your seed phrase is the only way to recover your wallet. Without it, you could
                  lose access to your Bitcoin permanently.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <Button
            onClick={() => {
              onBackupRequired?.();
              onClose();
            }}
            className='w-full'
            size='lg'
          >
            Backup Seed Phrase Now
          </Button>
          <Button onClick={() => setStep('input')} variant='ghost' className='w-full' size='lg'>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const totalAmount = Number(amount) + (feeEstimate?.lightning || 0);

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Confirm Payment</h3>
          <button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='space-y-4'>
          <div className='rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white'>
            <div className='mb-2 text-sm opacity-90'>You're sending</div>
            <div className='flex items-baseline gap-2'>
              <Zap className='h-6 w-6 fill-current' />
              <span className='text-4xl font-bold'>{Number(amount).toLocaleString()}</span>
              <span className='text-lg opacity-90'>sats</span>
            </div>
            <div className='mt-2 text-lg opacity-90'>≈ ${amountUSD} USD</div>
          </div>

          <div className='space-y-3 rounded-lg bg-gray-50 p-4'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Amount</span>
              <span className='font-medium'>{Number(amount).toLocaleString()} sats</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Network Fee</span>
              <span className='font-medium'>{feeEstimate?.lightning || 0} sats</span>
            </div>
            <div className='border-t pt-3'>
              <div className='flex justify-between font-semibold'>
                <span>Total</span>
                <span>{totalAmount.toLocaleString()} sats</span>
              </div>
            </div>
          </div>

          <div className='rounded-lg bg-amber-50 p-4'>
            <div className='flex gap-3'>
              <AlertCircle className='h-5 w-5 flex-shrink-0 text-amber-600' />
              <div className='text-sm text-amber-900'>
                <p className='font-medium'>Double check before sending</p>
                <p className='mt-1'>Lightning payments are instant and cannot be reversed.</p>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          <Button onClick={handleSend} disabled={isLoading} className='w-full' size='lg'>
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <ArrowRight className='mr-2 h-5 w-5' />
                Confirm & Send
              </>
            )}
          </Button>
          <Button
            onClick={() => setStep('input')}
            variant='outline'
            className='w-full'
            disabled={isLoading}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Send Payment</h3>
        <button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
          <X className='h-5 w-5' />
        </button>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='invoice'>Lightning Invoice or Address</Label>
          <div className='relative'>
            <Textarea
              id='invoice'
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder='lnbc... or user@lightning.address'
              rows={3}
              disabled={isLoading}
              className='pr-10 font-mono text-sm'
            />
            <button
              className='absolute right-2 top-2 rounded-md p-2 hover:bg-gray-100'
              aria-label='Scan QR code'
            >
              <Scan className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='amount'>Amount (Optional)</Label>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Input
                id='amount'
                type='number'
                value={inputMode === 'sats' ? amount : amountUSD}
                onChange={(e) => handleAmountChange(e.target.value, inputMode)}
                placeholder={inputMode === 'sats' ? 'Amount in sats' : 'Amount in USD'}
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
          <p className='text-xs text-muted-foreground'>
            Leave empty if the invoice has a fixed amount
          </p>
        </div>

        <Accordion type='single' collapsible>
          <AccordionItem value='advanced' className='border-none'>
            <AccordionTrigger className='text-sm text-muted-foreground hover:text-foreground'>
              Advanced Options
            </AccordionTrigger>
            <AccordionContent className='space-y-3 pt-3'>
              <div className='rounded-lg bg-gray-50 p-3 text-sm text-muted-foreground'>
                Advanced payment options will be available here (custom fees, routing preferences,
                etc.)
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Button onClick={handlePrepare} disabled={isLoading || !invoice} className='w-full' size='lg'>
        {isLoading ? 'Preparing...' : 'Continue'}
      </Button>
    </div>
  );
}
