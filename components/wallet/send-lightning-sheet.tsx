'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { SlideToConfirm } from '@/components/ui/slide-to-confirm';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useAmountConverter, useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { AlertCircle, ArrowLeft, Loader2, Scan, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SendLightningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupRequired?: () => void;
  onOpenScan?: () => void;
  scannedData?: string;
}

export function SendLightningSheet({
  open,
  onOpenChange,
  onBackupRequired,
  onOpenScan,
  scannedData,
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
  const [activeDetent, setActiveDetent] = useState(1); // Start at medium height
  const [isValidating, setIsValidating] = useState(false);

  const { walletState } = useWallet();
  const { prepareSend, sendPayment, feeEstimate, isLoading } = useSendPayment();
  const { satsToUSD, usdToSats } = useAmountConverter();

  // Populate invoice field when scanned data is provided
  useEffect(() => {
    if (scannedData && open) {
      handleInvoiceChange(scannedData);
    }
  }, [scannedData, open]);

  const handleInvoiceChange = async (value: string) => {
    setInvoice(value);

    // Reset validation state when input changes
    if (!value.trim()) {
      setIsValidating(false);
      setIsLightningInvoice(false);
      setHasFixedAmount(false);
      setInvoiceAmount(null);
      setInvoiceDescription('');
      setAmount('');
      setAmountUSD('');
      return;
    }

    // Check if it's a Lightning invoice (starts with lnbc, lntb, or lnbcrt)
    const trimmedValue = value.trim().toLowerCase();
    const isInvoice =
      trimmedValue.startsWith('lnbc') ||
      trimmedValue.startsWith('lntb') ||
      trimmedValue.startsWith('lnbcrt');

    setIsLightningInvoice(isInvoice);

    if (isInvoice) {
      // Try to decode the invoice to get the amount and description
      setIsValidating(true);
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
        setIsValidating(false);
      } catch (error) {
        // Invalid invoice or can't decode yet
        setHasFixedAmount(false);
        setInvoiceAmount(null);
        setInvoiceDescription('');
        setIsValidating(false);
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

    // Check if wallet is backed up before allowing first transaction
    if (!walletState.hasBackup) {
      onBackupRequired?.();
      return;
    }

    try {
      // Prepare the payment to get fee estimate
      // Auto-detection logic has already extracted amount if needed
      await prepareSend(invoice, amount ? Number(amount) : undefined);
      setActiveDetent(2); // Expand to full screen for confirmation
      setStep('confirm');
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      // Provide helpful error messages
      if (errorMessage.includes('Unsupported payment method')) {
        // Check if it looks like a Lightning address
        if (invoice.includes('@')) {
          toast.error(
            "Lightning address format detected. Please ensure you've entered a valid Lightning address or try using a Lightning invoice instead."
          );
        } else {
          toast.error(
            'This payment method is not supported. Please use a Lightning invoice (lnbc...) or Lightning address (user@domain).'
          );
        }
      } else if (errorMessage.includes('Invalid input')) {
        toast.error('Invalid invoice or address format. Please check and try again.');
      } else {
        toast.error(errorMessage || 'Failed to process payment request');
      }
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
    if (onOpenScan) {
      onOpenScan();
    } else {
      toast.info('QR scanner not available');
    }
  };

  // Confirmation step content
  const confirmationContent = (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between border-b p-4'>
        <button
          onClick={() => {
            setActiveDetent(1); // Return to medium height
            setStep('input');
          }}
          disabled={isLoading}
          className='rounded-full p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Confirm Payment</h2>
        <div className='w-10' /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
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
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <p className='mb-1 text-xs text-muted-foreground'>
                  {isLightningInvoice ? 'Description' : 'Note'}
                </p>
                <p className='text-sm'>{isLightningInvoice ? invoiceDescription : note}</p>
              </div>
            )}

            {feeEstimate && (
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
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
        <SlideToConfirm
          onConfirm={handleSend}
          isLoading={isLoading}
          text='Slide to Confirm & Send'
          loadingText='Sending...'
        />
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
          <div className='space-y-3'>
            <Textarea
              value={invoice}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              placeholder='Lightning invoice, Lightning address, or Bitcoin address'
              className='resize-none bg-gray-50 font-mono text-sm'
              rows={4}
            />

            {/* Validation Feedback */}
            {isValidating && (
              <div className='flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3'>
                <Loader2 className='h-4 w-4 animate-spin text-gray-600' />
                <span className='text-sm text-gray-600'>Validating invoice...</span>
              </div>
            )}

            {/* Show detected invoice info */}
            {!isValidating && isLightningInvoice && invoiceAmount && (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                <div className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-green-700'>Invoice detected</span>
                    <span className='text-sm font-medium text-green-900'>
                      {invoiceAmount.toLocaleString()} sats
                    </span>
                  </div>
                  {invoiceDescription && (
                    <p className='text-xs text-green-700'>{invoiceDescription}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleContinue}
              disabled={!invoice || isValidating}
              className='h-12 w-full rounded-full bg-gray-50 font-medium text-gray-900 hover:bg-gray-100'
              variant='outline'
            >
              Next
            </Button>
          </div>

          {/* Separator */}
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200' />
            </div>
          </div>

          {/* Scan QR Code */}
          <Button
            onClick={handleScanQR}
            variant='outline'
            className='h-12 w-full rounded-full bg-gray-50'
          >
            <Scan className='mr-2 h-5 w-5' />
            Scan QR Code
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <SheetWithDetent.Root
      presented={open}
      onPresentedChange={(presented) => {
        // Prevent closing while payment is sending
        if (!presented && isLoading) {
          return;
        }
        onOpenChange(presented);
      }}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
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
