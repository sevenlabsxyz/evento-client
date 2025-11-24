'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { SlideToConfirm } from '@/components/ui/slide-to-confirm';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useAmountConverter, useSendPayment } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { toast } from '@/lib/utils/toast';
import type { InputType, PrepareLnurlPayResponse } from '@breeztech/breez-sdk-spark/web';
import { VisuallyHidden } from '@silk-hq/components';
import { AlertCircle, ArrowLeft, Loader2, Scan, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AmountInputSheet } from './amount-input-sheet';

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
  const [comment, setComment] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [step, setStep] = useState<'input' | 'amount' | 'comment' | 'bitcoin-fee' | 'confirm'>(
    'input'
  );
  const [hasFixedAmount, setHasFixedAmount] = useState(false);
  const [isLightningInvoice, setIsLightningInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState<number | null>(null);
  const [invoiceDescription, setInvoiceDescription] = useState<string>('');
  const [activeDetent, setActiveDetent] = useState(1); // Start at medium height
  const [isValidating, setIsValidating] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);

  // LNURL state
  const [parsedInput, setParsedInput] = useState<InputType | null>(null);
  const [lnurlPrepareResponse, setLnurlPrepareResponse] = useState<PrepareLnurlPayResponse | null>(
    null
  );
  const [commentAllowed, setCommentAllowed] = useState(0);
  const [minSendable, setMinSendable] = useState<number>(1);
  const [maxSendable, setMaxSendable] = useState<number>(1000000000);

  // Bitcoin on-chain payment state
  const [paymentType, setPaymentType] = useState<'lightning' | 'bitcoin'>('lightning');
  const [bitcoinFeeSpeed, setBitcoinFeeSpeed] = useState<'fast' | 'medium' | 'slow'>('medium');
  const [bitcoinPrepareResponse, setBitcoinPrepareResponse] = useState<any>(null);

  const { walletState } = useWallet();
  const { prepareSend, sendPayment, feeEstimate, isLoading } = useSendPayment();
  const { satsToUSD, usdToSats } = useAmountConverter();

  // Reset form to initial state
  const resetForm = () => {
    setInvoice('');
    setAmount('');
    setAmountUSD('');
    setComment('');
    setInputMode('usd');
    setStep('input');
    setHasFixedAmount(false);
    setIsLightningInvoice(false);
    setInvoiceAmount(null);
    setInvoiceDescription('');
    setActiveDetent(1);
    setIsValidating(false);
    setIsPreparingPayment(false);
    setParsedInput(null);
    setLnurlPrepareResponse(null);
    setCommentAllowed(0);
    setMinSendable(1);
    setMaxSendable(1000000000);
    // Reset Bitcoin state
    setPaymentType('lightning');
    setBitcoinFeeSpeed('medium');
    setBitcoinPrepareResponse(null);
  };

  // Populate invoice field when scanned data is provided
  useEffect(() => {
    if (scannedData && open) {
      handleInvoiceChange(scannedData);
    }
  }, [scannedData, open]);

  const handleInvoiceChange = (value: string) => {
    setInvoice(value);

    // Reset state when input changes
    if (!value.trim()) {
      setIsLightningInvoice(false);
      setHasFixedAmount(false);
      setInvoiceAmount(null);
      setInvoiceDescription('');
      setAmount('');
      setAmountUSD('');
      setParsedInput(null);
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
    if (!invoice || !invoice.trim()) {
      toast.error('Please enter a Lightning invoice or address');
      return;
    }

    // Check if wallet is backed up before allowing first transaction
    if (!walletState.hasBackup) {
      onBackupRequired?.();
      return;
    }

    // Parse input using Breez SDK
    setIsValidating(true);
    try {
      const parsed = await breezSDK.parseInput(invoice.trim());
      setParsedInput(parsed);

      if (parsed.type === 'bolt11Invoice') {
        setIsLightningInvoice(true);

        // Try to get amount and description from invoice
        const prepareResponse = await prepareSend(invoice, undefined);
        if (prepareResponse?.amount) {
          const amountSats = Number(prepareResponse.amount);
          setInvoiceAmount(amountSats);
          setAmount(amountSats.toString());
          setHasFixedAmount(true);

          // Convert to USD
          const usd = await satsToUSD(amountSats);
          setAmountUSD(usd.toFixed(2));

          // Has amount, go to confirm
          setActiveDetent(2);
          setStep('confirm');
        } else {
          // Zero-amount invoice, need amount
          setHasFixedAmount(false);
          setInvoiceAmount(null);
          setStep('amount');
        }

        // Extract description
        if (prepareResponse?.paymentMethod?.type === 'bolt11Invoice') {
          setInvoiceDescription(prepareResponse.paymentMethod.invoiceDetails.description || '');
        }
      } else if (parsed.type === 'lightningAddress') {
        setIsLightningInvoice(false);

        // Extract LNURL constraints from Lightning address
        if ((parsed as any).payRequest) {
          const payRequest = (parsed as any).payRequest;
          setCommentAllowed(payRequest.commentAllowed || 0);
          setMinSendable(Math.floor(Number(payRequest.minSendable) / 1000)); // Convert msat to sat
          setMaxSendable(Math.floor(Number(payRequest.maxSendable) / 1000));
        }

        // Lightning address - need amount
        setStep('amount');
      } else if (parsed.type === 'lnurlPay') {
        setIsLightningInvoice(false);

        // Extract LNURL constraints
        setCommentAllowed((parsed as any).commentAllowed || 0);
        setMinSendable(Math.floor(Number((parsed as any).minSendable) / 1000));
        setMaxSendable(Math.floor(Number((parsed as any).maxSendable) / 1000));

        // LNURL - need amount
        setStep('amount');
      } else if (parsed.type === 'bitcoinAddress') {
        // Bitcoin on-chain address
        setPaymentType('bitcoin');
        setIsLightningInvoice(false);
        setHasFixedAmount(false);

        // Bitcoin addresses always need amount input
        setStep('amount');
      } else {
        toast.error('Unsupported payment type');
      }

      setIsValidating(false);
    } catch (error: any) {
      console.error('Failed to parse input:', error);
      setParsedInput(null);
      setIsValidating(false);
      toast.error(error.message || 'Invalid Lightning invoice or address');
    }
  };

  const handleAmountConfirm = async (amountSats: number) => {
    // Validate amount against LNURL constraints
    if (parsedInput?.type === 'lightningAddress' || parsedInput?.type === 'lnurlPay') {
      if (amountSats < minSendable) {
        toast.error(`Minimum amount is ${minSendable} sats`);
        return;
      }
      if (amountSats > maxSendable) {
        toast.error(`Maximum amount is ${maxSendable.toLocaleString()} sats`);
        return;
      }
    }

    setAmount(amountSats.toString());
    const usd = await satsToUSD(amountSats);
    setAmountUSD(usd.toFixed(2));

    // Route to Bitcoin prepare if payment type is Bitcoin
    if (paymentType === 'bitcoin') {
      setIsPreparingPayment(true);
      try {
        await handlePrepareBitcoinPayment(amountSats);
        // Step change is handled inside handlePrepareBitcoinPayment
      } catch (error) {
        // Error already handled in handlePrepareBitcoinPayment
      } finally {
        setIsPreparingPayment(false);
      }
      return;
    }

    // Check if comment is allowed (Lightning only)
    if (commentAllowed > 0) {
      setStep('comment');
    } else {
      // No comment, prepare payment with loading state
      setIsPreparingPayment(true);
      try {
        await handlePreparePayment(amountSats);
        // Close amount sheet after successful preparation
        setStep('confirm');
      } catch (error) {
        // Error already handled in handlePreparePayment
      } finally {
        setIsPreparingPayment(false);
      }
    }
  };

  const handleCommentConfirm = async () => {
    setIsPreparingPayment(true);
    try {
      await handlePreparePayment(Number(amount));
      // Move to confirm step after successful preparation
      setActiveDetent(2);
      setStep('confirm');
    } catch (error) {
      // Error already handled in handlePreparePayment
    } finally {
      setIsPreparingPayment(false);
    }
  };

  const handlePreparePayment = async (amountSats: number) => {
    try {
      if (parsedInput?.type === 'lightningAddress' || parsedInput?.type === 'lnurlPay') {
        // Prepare LNURL payment
        const payRequest =
          parsedInput.type === 'lightningAddress' ? (parsedInput as any).payRequest : parsedInput;

        const prepareResponse = await breezSDK.prepareLnurlPay({
          payRequest,
          amountSats,
          comment: comment || undefined,
        });

        setLnurlPrepareResponse(prepareResponse);
      } else if (parsedInput?.type === 'bolt11Invoice') {
        // Prepare BOLT11 payment
        await prepareSend(invoice, amountSats);
      }
      // Note: Step change and detent change are handled by the caller
    } catch (error: any) {
      toast.error(error.message || 'Failed to prepare payment');
      throw error; // Re-throw so caller can handle cleanup
    }
  };

  const handlePrepareBitcoinPayment = async (amountSats: number) => {
    try {
      // Prepare Bitcoin on-chain payment
      const prepareResponse = await breezSDK.preparePayment(invoice.trim(), amountSats);

      setBitcoinPrepareResponse(prepareResponse);
      // Move to fee selection step
      setStep('bitcoin-fee');
    } catch (error: any) {
      console.error('Failed to prepare Bitcoin payment:', error);
      toast.error(error.message || 'Failed to prepare Bitcoin payment');
      throw error;
    }
  };

  const handleSend = async () => {
    try {
      if (paymentType === 'bitcoin') {
        // Send Bitcoin on-chain payment
        if (!bitcoinPrepareResponse) {
          throw new Error('Bitcoin payment not prepared');
        }

        await breezSDK.sendPaymentWithOptions({
          prepareResponse: bitcoinPrepareResponse,
          options: {
            type: 'bitcoinAddress',
            confirmationSpeed: bitcoinFeeSpeed,
          },
        });
      } else if (parsedInput?.type === 'lightningAddress' || parsedInput?.type === 'lnurlPay') {
        // Send LNURL payment
        if (!lnurlPrepareResponse) {
          throw new Error('Payment not prepared');
        }

        await breezSDK.lnurlPay({
          prepareResponse: lnurlPrepareResponse,
        });
      } else {
        // Send BOLT11 payment
        await sendPayment(invoice, amount ? Number(amount) : undefined);
      }

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
            {/* Show Bitcoin address for Bitcoin payments */}
            {paymentType === 'bitcoin' && (
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <p className='mb-1 text-xs text-muted-foreground'>Sending to Bitcoin Address</p>
                <p className='break-all font-mono text-sm font-medium'>{invoice}</p>
              </div>
            )}

            {/* Show destination for Lightning address payments */}
            {parsedInput?.type === 'lightningAddress' && (
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <p className='mb-1 text-xs text-muted-foreground'>Sending to</p>
                <p className='text-sm font-medium'>{invoice}</p>
              </div>
            )}

            {/* Show invoice description for Lightning invoices, or comment for Lightning addresses */}
            {(isLightningInvoice ? invoiceDescription : comment) && (
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <p className='mb-1 text-xs text-muted-foreground'>
                  {isLightningInvoice ? 'Description' : 'Comment'}
                </p>
                <p className='text-sm'>{isLightningInvoice ? invoiceDescription : comment}</p>
              </div>
            )}

            {/* Show fees for Bitcoin payments */}
            {paymentType === 'bitcoin' &&
              bitcoinPrepareResponse?.paymentMethod?.type === 'bitcoinAddress' && (
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm text-muted-foreground'>Speed</span>
                      <span className='text-sm font-medium capitalize'>{bitcoinFeeSpeed}</span>
                    </div>
                    {(() => {
                      const feeQuote = bitcoinPrepareResponse.paymentMethod.feeQuote;
                      const speedKey =
                        bitcoinFeeSpeed === 'slow'
                          ? 'speedSlow'
                          : bitcoinFeeSpeed === 'medium'
                            ? 'speedMedium'
                            : 'speedFast';
                      const feeData = feeQuote[speedKey];
                      const totalFee = feeData.l1BroadcastFeeSat + feeData.userFeeSat;

                      return (
                        <>
                          <div className='flex justify-between'>
                            <span className='text-sm text-muted-foreground'>Network Fee</span>
                            <span className='text-sm font-medium'>{totalFee} sats</span>
                          </div>
                          <div className='flex justify-between border-t border-gray-300 pt-2'>
                            <span className='text-sm font-semibold'>Total</span>
                            <span className='text-sm font-semibold'>
                              {Number(amount) + totalFee} sats
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

            {/* Show fees for BOLT11 or LNURL */}
            {(feeEstimate || lnurlPrepareResponse) && paymentType !== 'bitcoin' && (
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                <div className='flex justify-between'>
                  <span className='text-sm text-muted-foreground'>Network Fee</span>
                  <span className='text-sm font-medium'>
                    {feeEstimate
                      ? `${feeEstimate.lightning} sats`
                      : `${lnurlPrepareResponse?.feeSats || 0} sats`}
                  </span>
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

  // Bitcoin fee selection content
  const bitcoinFeeContent =
    bitcoinPrepareResponse?.paymentMethod?.type === 'bitcoinAddress' ? (
      <div className='flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between border-b p-4'>
          <button
            onClick={() => setStep('amount')}
            className='rounded-full p-2 transition-colors hover:bg-gray-100'
          >
            <ArrowLeft className='h-5 w-5' />
          </button>
          <h2 className='text-xl font-semibold'>Select Fee</h2>
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
            <p className='text-sm text-gray-600'>
              Choose the speed of your Bitcoin transaction. Faster speeds have higher fees.
            </p>

            {/* Fee Options */}
            <div className='space-y-3'>
              {(['slow', 'medium', 'fast'] as const).map((speed) => {
                const feeQuote = bitcoinPrepareResponse.paymentMethod.feeQuote;
                const speedKey =
                  speed === 'slow' ? 'speedSlow' : speed === 'medium' ? 'speedMedium' : 'speedFast';
                const feeData = feeQuote[speedKey];
                const totalFee = feeData.l1BroadcastFeeSat + feeData.userFeeSat;
                const isSelected = bitcoinFeeSpeed === speed;

                return (
                  <button
                    key={speed}
                    onClick={() => setBitcoinFeeSpeed(speed)}
                    className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-semibold capitalize'>{speed}</p>
                        <p className='text-xs text-gray-600'>
                          {speed === 'slow'
                            ? '~1 hour'
                            : speed === 'medium'
                              ? '~30 minutes'
                              : '~10 minutes'}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold'>{totalFee} sats</p>
                        <p className='text-xs text-gray-600'>fee</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fee Breakdown */}
            <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm'>
              <p className='mb-2 font-medium'>Fee Breakdown ({bitcoinFeeSpeed})</p>
              {(() => {
                const feeQuote = bitcoinPrepareResponse.paymentMethod.feeQuote;
                const speedKey =
                  bitcoinFeeSpeed === 'slow'
                    ? 'speedSlow'
                    : bitcoinFeeSpeed === 'medium'
                      ? 'speedMedium'
                      : 'speedFast';
                const feeData = feeQuote[speedKey];

                return (
                  <div className='space-y-1 text-gray-600'>
                    <div className='flex justify-between'>
                      <span>Network fee:</span>
                      <span>{feeData.l1BroadcastFeeSat} sats</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Swap service fee:</span>
                      <span>{feeData.userFeeSat} sats</span>
                    </div>
                    <div className='mt-2 flex justify-between border-t border-gray-300 pt-2 font-medium text-gray-900'>
                      <span>Total fee:</span>
                      <span>{feeData.l1BroadcastFeeSat + feeData.userFeeSat} sats</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <Button
              onClick={() => {
                setActiveDetent(2);
                setStep('confirm');
              }}
              className='h-12 w-full rounded-full'
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  // Comment step content
  const commentContent = (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between border-b p-4'>
        <button
          onClick={() => setStep('amount')}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Add Comment</h2>
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
          <div className='space-y-3'>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Add a comment (max ${commentAllowed} characters)`}
              maxLength={commentAllowed}
              className='resize-none bg-gray-50'
              rows={4}
            />
            <div className='flex justify-between text-xs text-gray-600'>
              <span>Optional message</span>
              <span>
                {comment.length}/{commentAllowed}
              </span>
            </div>
          </div>

          <Button onClick={handleCommentConfirm} className='h-12 w-full rounded-full'>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SheetWithDetent.Root
        presented={open}
        onPresentedChange={(presented) => {
          // Prevent closing while payment is sending
          if (!presented && isLoading) {
            return;
          }

          // Reset form when sheet closes
          if (!presented) {
            resetForm();
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
              {step === 'input' && inputContent}
              {step === 'bitcoin-fee' && bitcoinFeeContent}
              {step === 'comment' && commentContent}
              {step === 'confirm' && confirmationContent}
            </SheetWithDetent.Content>
          </SheetWithDetent.View>
        </SheetWithDetent.Portal>
      </SheetWithDetent.Root>

      {/* Amount Input Sheet - Nested */}
      <AmountInputSheet
        open={step === 'amount'}
        onOpenChange={(open) => {
          if (!open) {
            setStep('input');
          }
        }}
        onConfirm={handleAmountConfirm}
        isLoading={isPreparingPayment}
      />
    </>
  );
}
