'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { Textarea } from '@/components/ui/textarea';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useAmountConverter, useReceivePayment } from '@/lib/hooks/use-wallet-payments';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { ArrowUpDown, Bolt, Clock, Copy, Share2, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ReceiveLightningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveLightningSheet({ open, onOpenChange }: ReceiveLightningSheetProps) {
  const [amount, setAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [note, setNote] = useState('');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [isGenerating, setIsGenerating] = useState(false);

  const { createInvoice } = useReceivePayment();
  const { satsToUSD, usdToSats } = useAmountConverter();
  const { address } = useLightningAddress();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced invoice generation
  const generateInvoiceDebounced = useCallback(
    (satsAmount: number, description: string) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(async () => {
        if (satsAmount <= 0) {
          setInvoice(null);
          setQrCodeUrl(null);
          return;
        }

        try {
          setIsGenerating(true);
          const invoiceData = await createInvoice(satsAmount, description || 'Payment request');
          setInvoice(invoiceData.paymentRequest);

          // Generate QR code
          const qrUrl = await QRCode.toDataURL(invoiceData.paymentRequest, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          setQrCodeUrl(qrUrl);
        } catch (error: any) {
          console.error('Failed to create invoice:', error);
          toast.error(error.message || 'Failed to create invoice');
        } finally {
          setIsGenerating(false);
        }
      }, 800);
    },
    [createInvoice]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle amount changes with conversion
  const handleAmountChange = async (value: string, mode: 'sats' | 'usd') => {
    if (mode === 'sats') {
      setAmount(value);
      if (value && Number(value) > 0) {
        const usd = await satsToUSD(Number(value));
        setAmountUSD(usd.toFixed(2));
        generateInvoiceDebounced(Number(value), note);
      } else {
        setAmountUSD('');
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        setInvoice(null);
        setQrCodeUrl(null);
      }
    } else {
      setAmountUSD(value);
      if (value && Number(value) > 0) {
        const sats = await usdToSats(Number(value));
        setAmount(sats.toString());
        generateInvoiceDebounced(sats, note);
      } else {
        setAmount('');
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        setInvoice(null);
        setQrCodeUrl(null);
      }
    }
  };

  // Handle note changes
  const handleNoteChange = (value: string) => {
    setNote(value);
    if (amount && Number(amount) > 0) {
      generateInvoiceDebounced(Number(amount), value);
    }
  };

  const handleCopy = async () => {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(invoice);
      toast.success('Invoice copied');
    } catch (error) {
      toast.error('Failed to copy invoice');
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lightning Invoice',
          text: `Pay me ${amount} sats: ${invoice}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      handleCopy();
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'sats' ? 'usd' : 'sats');
  };

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
              <SheetWithDetent.Title>Receive Payment</SheetWithDetent.Title>
            </VisuallyHidden.Root>
            <div className='flex h-full flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between border-b p-4'>
                <h2 className='text-xl font-semibold'>Receive Payment</h2>
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
                  {/* Lightning Address Section */}
                  {address?.lightningAddress && (
                    <div className='space-y-3'>
                      <div className='rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-4'>
                        <div className='mb-2 flex items-center gap-2'>
                          <Bolt className='h-4 w-4 text-purple-600' />
                          <h3 className='text-sm font-semibold text-gray-900'>
                            Your Lightning Address
                          </h3>
                        </div>
                        <p className='mb-3 text-xs text-gray-600'>
                          Share this address to receive payments instantly. Anyone can send you
                          Bitcoin using this simple address.
                        </p>
                        <div className='flex items-center gap-2 rounded-lg bg-white p-3'>
                          <span className='flex-1 truncate font-mono text-sm font-medium text-gray-900'>
                            {address.lightningAddress}
                          </span>
                          <Button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(address.lightningAddress);
                                toast.success('Address copied!');
                              } catch (error) {
                                toast.error('Failed to copy');
                              }
                            }}
                            variant='ghost'
                            size='sm'
                            className='flex-shrink-0'
                          >
                            <Copy className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>

                      <div className='relative'>
                        <div className='absolute inset-0 flex items-center'>
                          <span className='w-full border-t' />
                        </div>
                        <div className='relative flex justify-center text-xs uppercase'>
                          <span className='bg-white px-2 text-muted-foreground'>
                            Or create a one-time invoice
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className='space-y-3'>
                    <div className='rounded-xl bg-gray-50 p-6 text-center'>
                      <div className='relative'>
                        <Input
                          type='number'
                          value={inputMode === 'usd' ? amountUSD : amount}
                          onChange={(e) => handleAmountChange(e.target.value, inputMode)}
                          placeholder='0'
                          className='border-0 bg-transparent text-center text-4xl font-bold focus-visible:ring-0'
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
                  </div>

                  {/* Note Input */}
                  <div className='space-y-2'>
                    <Textarea
                      value={note}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder='Add a Note'
                      className='resize-none'
                      rows={2}
                    />
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className='space-y-4'>
                      <div className='relative mx-auto w-fit rounded-2xl bg-white p-6 shadow-lg'>
                        <img src={qrCodeUrl} alt='Invoice QR' className='h-64 w-64' />
                        {/* Loading Overlay */}
                        {isGenerating && (
                          <div className='absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm'>
                            <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary' />
                          </div>
                        )}
                      </div>

                      {/* Invoice Expiry Info */}
                      <div className='rounded-lg bg-amber-50 p-3'>
                        <div className='flex items-center gap-2 text-sm text-amber-900'>
                          <Clock className='h-4 w-4 flex-shrink-0' />
                          <span>This invoice expires in 1 hour</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className='grid grid-cols-2 gap-3'>
                        <Button
                          onClick={handleCopy}
                          variant='outline'
                          size='lg'
                          disabled={!invoice || isGenerating}
                        >
                          <Copy className='mr-2 h-4 w-4' />
                          Copy
                        </Button>
                        <Button
                          onClick={handleShare}
                          variant='outline'
                          size='lg'
                          disabled={!invoice || isGenerating}
                        >
                          <Share2 className='mr-2 h-4 w-4' />
                          Share
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Loading State - Initial */}
                  {isGenerating && !qrCodeUrl && (
                    <div className='flex items-center justify-center py-12'>
                      <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary' />
                    </div>
                  )}

                  {/* Empty State */}
                  {!qrCodeUrl && !isGenerating && (
                    <div className='py-12 text-center text-sm text-gray-500'>
                      Enter an amount to generate an invoice
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
