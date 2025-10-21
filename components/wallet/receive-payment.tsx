'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAmountConverter, useReceivePayment } from '@/lib/hooks/use-wallet-payments';
import { toast } from '@/lib/utils/toast';
import { Check, Copy, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useState } from 'react';

interface ReceivePaymentProps {
  onClose: () => void;
}

export function ReceivePayment({ onClose }: ReceivePaymentProps) {
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [description, setDescription] = useState('');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('sats');

  const { createInvoice, isLoading } = useReceivePayment();
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

  const handleCreateInvoice = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const invoiceData = await createInvoice(Number(amount), description || 'Payment request');
      setInvoice(invoiceData.paymentRequest);

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(invoiceData.paymentRequest, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrUrl);

      toast.success('Invoice created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const handleCopy = async () => {
    if (!invoice) return;

    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast.success('Invoice copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy invoice');
    }
  };

  if (invoice && qrCodeUrl) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>Receive Payment</h3>
          <button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='space-y-4'>
          <div className='flex flex-col items-center gap-4'>
            <div className='rounded-xl bg-white p-4 shadow-sm'>
              <img src={qrCodeUrl} alt='Payment QR Code' className='h-64 w-64' />
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold'>{Number(amount).toLocaleString()} sats</div>
              <div className='text-sm text-muted-foreground'>≈ ${amountUSD} USD</div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Lightning Invoice</Label>
            <div className='relative'>
              <Textarea value={invoice} readOnly rows={3} className='pr-10 font-mono text-xs' />
              <button
                onClick={handleCopy}
                className='absolute right-2 top-2 rounded-md p-2 hover:bg-gray-100'
              >
                {copied ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </button>
            </div>
          </div>

          <div className='rounded-lg bg-blue-50 p-4 text-sm text-blue-900'>
            Share this invoice or QR code with the sender. The invoice will expire in 1 hour.
          </div>
        </div>

        <Button onClick={onClose} className='w-full' size='lg'>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Receive Payment</h3>
        <button onClick={onClose} className='rounded-full p-1 hover:bg-gray-100'>
          <X className='h-5 w-5' />
        </button>
      </div>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='amount'>Amount</Label>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Input
                id='amount'
                type='number'
                value={inputMode === 'sats' ? amount : amountUSD}
                onChange={(e) => handleAmountChange(e.target.value, inputMode)}
                placeholder={inputMode === 'sats' ? 'Enter amount in sats' : 'Enter amount in USD'}
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

        <div className='space-y-2'>
          <Label htmlFor='description'>Description (Optional)</Label>
          <Input
            id='description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this payment for?"
            disabled={isLoading}
          />
        </div>
      </div>

      <Button
        onClick={handleCreateInvoice}
        disabled={isLoading || !amount || Number(amount) <= 0}
        className='w-full'
        size='lg'
      >
        {isLoading ? (
          'Creating Invoice...'
        ) : (
          <>
            <QrCode className='mr-2 h-5 w-5' />
            Create Invoice
          </>
        )}
      </Button>
    </div>
  );
}
