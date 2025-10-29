'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useAmountConverter, useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { AlertCircle, ArrowUpDown, Scan, Send, X } from 'lucide-react';
import { useState } from 'react';

interface SendLightningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupRequired?: () => void;
}

export function SendLightningSheet({
  open,
  onOpenChange,
  onBackupRequired,
}: SendLightningSheetProps) {
  const [invoice, setInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [note, setNote] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [hasFixedAmount, setHasFixedAmount] = useState(false);
  const [isLightningInvoice, setIsLightningInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number | null>(null);
  const [invoiceDescription, setInvoiceDescription] = useState<string>('');

  const { walletState } = useWallet();
  const { prepareSend, sendPayment, feeEstimate, isLoading } = useSendPayment();
  const { satsToUSD, usdToSats } = useAmountConverter();

  const handleInvoiceChange = async (value: string) => {
    setInvoice(value);

    // Check if it's a Lightning invoice (starts with lnbc, lntb, or lnbcrt)
    const trimmedValue = value.trim().toLowerCase();
    const isInvoice =
      trimmedValue.startsWith('lnbc') ||
      trimmedValue.startsWith('lntb') ||
      trimmedValue.startsWith('lnbcrt');

    setIsLightningInvoice(isInvoice);

    if (isInvoice) {
      // Try to decode the invoice to get the amount and description
      try {
        const prepareResponse = await prepareSend(value, undefined);
        // Check if the invoice has a fixed amount
        // The amount is in paymentMethod.amountSats for bolt11 invoices
        if (prepareResponse?.amount) {
          const amountSats = Number(prepareResponse.amount);
          setInvoiceAmount(amountSats);
          setAmount(amountSats.toString());
          setHasFixedAmount(true);

          // Convert to USD
          const usd = await satsToUSD(amountSats);
          setAmountUSD(usd.toFixed(2));
        } else {
          // Invoice doesn't have a fixed amount (zero-amount invoice)
          setHasFixedAmount(false);
          setInvoiceAmount(null);
        }

        // Extract description from invoice
        if (prepareResponse?.paymentMethod?.type === 'bolt11Invoice') {
          setInvoiceDescription(prepareResponse.paymentMethod.invoiceDetails.description || '');
        } else {
          setInvoiceDescription('');
        }
      } catch (error) {
        // Invalid invoice or can't decode yet
        setHasFixedAmount(false);
        setInvoiceAmount(null);
        setInvoiceDescription('');
      }
    } else {
      // Not an invoice (Lightning address, etc.)
      setHasFixedAmount(false);
      setInvoiceAmount(null);
      setInvoiceDescription('');
      setAmount('');
      setAmountUSD('');
    }
  };

  const handleAmountChange = async (value: string, mode: 'sats' | 'usd') => {
    if (mode === 'sats') {
      setAmount(value);
      if (value && Number(value) > 0) {
        const usd = await satsToUSD(Number(value));
        setAmountUSD(usd.toFixed(2));
      } else {
        setAmountUSD('');
      }
    } else {
      setAmountUSD(value);
      if (value && Number(value) > 0) {
        const sats = await usdToSats(Number(value));
        setAmount(sats.toString());
      } else {
        setAmount('');
      }
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'sats' ? 'usd' : 'sats');
  };

  const handleContinue = async () => {
    if (!invoice) {
      toast.error('Please enter a Lightning invoice or address');
      return;
    }

    // For Lightning invoices with fixed amounts, amount is already set
    // For Lightning addresses or invoices without amounts, require amount input
    if (!isLightningInvoice && !amount) {
      toast.error('Please enter an amount');
      return;
    }

    // Check if wallet is backed up before allowing first transaction
    if (!walletState.hasBackup) {
      onBackupRequired?.();
      return;
    }

    try {
      // Prepare the payment to get fee estimate
      await prepareSend(invoice, amount ? Number(amount) : undefined);
      setStep('confirm');
    } catch (error: any) {
      toast.error(error.message || 'Invalid invoice');
    }
  };

  const handleSend = async () => {
    try {
      await sendPayment(invoice, amount ? Number(amount) : undefined);
      toast.success('Payment sent!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send payment');
    }
  };

  const handleScanQR = () => {
    // TODO: Implement QR scanner
    toast.info('QR scanner coming soon');
  };

  // Confirmation step content
  const confirmationContent = (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between border-b p-4'>
        <button
          onClick={() => setStep('input')}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Confirm Payment</h2>
        <div className='w-10' /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl bg-gray-50 p-8 text-center'>
            <div className='text-4xl font-bold'>
              {inputMode === 'usd' ? `$${amountUSD}` : `${Number(amount).toLocaleString()} sats`}
            </div>
            <div className='mt-2 text-lg text-gray-600'>
              {inputMode === 'usd' && amount
                ? `${Number(amount).toLocaleString()} sats`
                : amountUSD
                  ? `$${amountUSD}`
                  : ''}
            </div>
          </div>

          {/* Details */}
          <div className='space-y-3'>
            {/* Show invoice description for Lightning invoices, or note for Lightning addresses */}
            {(isLightningInvoice ? invoiceDescription : note) && (
              <div className='rounded-lg bg-gray-50 p-4'>
                <p className='mb-1 text-xs text-muted-foreground'>
                  {isLightningInvoice ? 'Description' : 'Note'}
                </p>
                <p className='text-sm'>{isLightningInvoice ? invoiceDescription : note}</p>
              </div>
            )}

            {feeEstimate && (
              <div className='rounded-lg bg-gray-50 p-4'>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Network Fee</span>
                  <span className='text-sm font-medium'>{feeEstimate.lightning} sats</span>
                </div>
              </div>
            )}

            <div className='rounded-lg bg-blue-50 p-4'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
                <p className='text-sm text-blue-900'>
                  This payment cannot be reversed. Please verify the details before confirming.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='border-t p-4'>
        <Button onClick={handleSend} disabled={isLoading} size='lg' className='w-full'>
          {isLoading ? (
            'Sending...'
          ) : (
            <>
              <Send className='mr-2 h-5 w-5' />
              Confirm & Send
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Input step content
  const inputContent = (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between border-b p-4'>
        <h2 className='text-xl font-semibold'>Send</h2>
        <button
          onClick={() => onOpenChange(false)}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Invoice/Address Input */}
          <div className='space-y-2'>
            <Textarea
              value={invoice}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              placeholder='Lightning invoice or address'
              className='resize-none font-mono text-sm'
              rows={3}
            />
            <Button onClick={handleScanQR} variant='outline' size='sm' className='w-full'>
              <Scan className='mr-2 h-4 w-4' />
              Scan QR Code
            </Button>
          </div>

          {/* Amount Input - Only show if not a Lightning invoice with fixed amount */}
          {!isLightningInvoice && (
            <div className='space-y-3'>
              <div className='rounded-xl bg-gray-50 p-6 text-center'>
                <div className='relative'>
                  <Input
                    type='number'
                    value={inputMode === 'usd' ? amountUSD : amount}
                    onChange={(e) => handleAmountChange(e.target.value, inputMode)}
                    placeholder='0'
                    className='border-0 bg-transparent text-center text-4xl font-bold focus-visible:ring-0'
                    disabled={hasFixedAmount} // Disable if invoice has fixed amount
                  />
                  <div className='mt-1 text-lg font-medium text-gray-600'>
                    {inputMode === 'usd' ? '$' : 'sats'}
                  </div>
                </div>

                <button
                  onClick={toggleInputMode}
                  className='mx-auto mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100'
                >
                  <ArrowUpDown className='h-4 w-4' />
                  <span>
                    {inputMode === 'usd' && amount
                      ? `${Number(amount).toLocaleString()} sats`
                      : inputMode === 'sats' && amountUSD
                        ? `$${amountUSD}`
                        : 'Convert'}
                  </span>
                </button>
              </div>

              {hasFixedAmount && (
                <div className='text-center text-sm text-muted-foreground'>
                  Amount is fixed by the invoice
                </div>
              )}
            </div>
          )}

          {/* Show invoice amount if it's a Lightning invoice with fixed amount */}
          {isLightningInvoice && hasFixedAmount && invoiceAmount && (
            <div className='space-y-3'>
              <div className='rounded-xl bg-gray-50 p-6 text-center'>
                <div className='mb-2 text-sm text-muted-foreground'>Invoice Amount</div>
                <div className='text-4xl font-bold'>
                  {inputMode === 'usd' ? `$${amountUSD}` : `${invoiceAmount.toLocaleString()} sats`}
                </div>
                <div className='mt-2 text-lg text-gray-600'>
                  {inputMode === 'usd' && amount
                    ? `${Number(amount).toLocaleString()} sats`
                    : amountUSD
                      ? `$${amountUSD}`
                      : ''}
                </div>
                <button
                  onClick={toggleInputMode}
                  className='mx-auto mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100'
                >
                  <ArrowUpDown className='h-4 w-4' />
                  <span>Toggle Currency</span>
                </button>
              </div>
            </div>
          )}

          {/* Note Input - Only show if not a Lightning invoice */}
          {!isLightningInvoice && (
            <div className='space-y-2'>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Add a note (optional)'
                className='resize-none'
                rows={2}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className='border-t p-4'>
        <Button
          onClick={handleContinue}
          disabled={!invoice || (!isLightningInvoice && !amount)}
          size='lg'
          className='w-full'
        >
          Continue
        </Button>
      </div>
    </div>
  );

  return (
    <SheetWithDetent.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className='min-h-max'>
            <div className='my-4 flex items-center'>
              <SheetWithDetent.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
            </div>
            <VisuallyHidden.Root asChild>
              <SheetWithDetent.Title>Send Payment</SheetWithDetent.Title>
            </VisuallyHidden.Root>
            {step === 'confirm' ? confirmationContent : inputContent}
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
