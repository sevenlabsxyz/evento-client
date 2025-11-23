'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useAmountConverter, useReceivePayment } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { Bolt, Copy, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { AmountInputSheet } from './amount-input-sheet';

interface ReceiveLightningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveLightningSheet({ open, onOpenChange }: ReceiveLightningSheetProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>(''); // Lightning address or bolt11
  const [invoiceAmount, setInvoiceAmount] = useState<number | null>(null);
  const [invoiceAmountUSD, setInvoiceAmountUSD] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [amountSheetOpen, setAmountSheetOpen] = useState(false);
  const [activeDetent, setActiveDetent] = useState(2); // Full screen
  const [activeInvoice, setActiveInvoice] = useState<string | null>(null); // Track active bolt11 invoice

  const { createInvoice } = useReceivePayment();
  const { address } = useLightningAddress();
  const { satsToUSD } = useAmountConverter();

  // Generate QR code for lightning address when sheet opens
  useEffect(() => {
    if (open && address?.lightningAddress && !invoiceAmount) {
      generateLightningAddressQR(address.lightningAddress);
    }
  }, [open, address, invoiceAmount]);

  // Listen for payment success when there's an active invoice
  useEffect(() => {
    if (!open || !activeInvoice) return;

    console.log('Setting up payment listener for invoice:', activeInvoice.slice(0, 20) + '...');

    const unsubscribe = breezSDK.onEvent((event) => {
      if (event.type === 'paymentSucceeded') {
        const payment = (event as any).details;

        // Check if this is an incoming payment
        if (payment?.paymentType === 'received') {
          // Match the invoice with our active invoice
          const receivedInvoice = payment?.details?.invoice;

          if (receivedInvoice === activeInvoice) {
            console.log('Payment received for active invoice!');

            // Show success toast
            toast.success(`Received ${invoiceAmount?.toLocaleString() || 0} sats!`);

            // Close the receive sheet
            onOpenChange(false);

            // Reset state
            setActiveInvoice(null);
            setInvoiceAmount(null);
            setInvoiceAmountUSD(null);
          }
        }
      }
    });

    return () => {
      console.log('Cleaning up payment listener');
      unsubscribe();
    };
  }, [open, activeInvoice, invoiceAmount, onOpenChange]);

  const generateLightningAddressQR = async (lightningAddress: string) => {
    try {
      const qrUrl = await QRCode.toDataURL(`lightning:${lightningAddress}`, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrUrl);
      setQrCodeData(lightningAddress);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleAmountConfirm = async (amountSats: number) => {
    try {
      setIsGenerating(true);
      const invoiceData = await createInvoice(amountSats, 'Payment request');

      // Convert to USD
      const usd = await satsToUSD(amountSats);

      // Generate QR code for bolt11 invoice
      const qrUrl = await QRCode.toDataURL(invoiceData.paymentRequest, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrUrl);
      setQrCodeData(invoiceData.paymentRequest);
      setInvoiceAmount(amountSats);
      setInvoiceAmountUSD(usd);
      setActiveInvoice(invoiceData.paymentRequest); // Track the active invoice
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!qrCodeData) return;
    if (navigator.share) {
      try {
        const shareText = invoiceAmount
          ? `Pay me ${invoiceAmount.toLocaleString()} sats: ${qrCodeData}`
          : `Send me Bitcoin: ${qrCodeData}`;

        await navigator.share({
          title: 'Lightning Payment',
          text: shareText,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to copy
      try {
        await navigator.clipboard.writeText(qrCodeData);
        toast.success('Copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy');
      }
    }
  };

  return (
    <SheetWithDetent.Root
      presented={open}
      onPresentedChange={onOpenChange}
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
              <SheetWithDetent.Title>Receive Payment</SheetWithDetent.Title>
            </VisuallyHidden.Root>
            <div className='flex flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between border-b p-4'>
                <h2 className='text-xl font-semibold'>Receive</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className='rounded-full p-2 transition-colors hover:bg-gray-100'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* Content */}
              <div className='overflow-y-auto p-6'>
                <div className='mx-auto max-w-md space-y-6'>
                  {/* Lightning Address Section */}
                  {address?.lightningAddress && (
                    <div className='rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-4'>
                      <div className='mb-2 flex items-center gap-2'>
                        <Bolt className='h-4 w-4 text-purple-600' />
                        <h3 className='text-sm font-semibold text-gray-900'>
                          Your Lightning Address
                        </h3>
                      </div>
                      <p className='mb-3 text-xs text-gray-600'>
                        Share this address to receive payments instantly.
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
                  )}

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className='space-y-3'>
                      <div className='relative mx-auto w-fit rounded-3xl border border-gray-200 bg-white p-4'>
                        <img src={qrCodeUrl} alt='Payment QR' className='h-64 w-64' />
                        {/* Loading Overlay */}
                        {isGenerating && (
                          <div className='absolute inset-0 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm'>
                            <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary' />
                          </div>
                        )}
                      </div>

                      {/* Amount Display - Only show when invoice has an amount */}
                      {invoiceAmount && invoiceAmountUSD !== null && (
                        <div className='text-center'>
                          <p className='text-lg font-semibold text-gray-900'>
                            ${invoiceAmountUSD.toFixed(2)} · {invoiceAmount.toLocaleString()} sats
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className='space-y-3'>
                    <Button
                      onClick={() => {
                        if (invoiceAmount) {
                          // Reset to lightning address
                          setInvoiceAmount(null);
                          setInvoiceAmountUSD(null);
                          setActiveInvoice(null);
                          if (address?.lightningAddress) {
                            generateLightningAddressQR(address.lightningAddress);
                          }
                        } else {
                          // Open amount sheet
                          setAmountSheetOpen(true);
                        }
                      }}
                      variant='outline'
                      className='h-12 w-full rounded-full bg-gray-50'
                    >
                      {invoiceAmount ? 'Receive Any Amount' : 'Add Amount'}
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant='outline'
                      className='h-12 w-full rounded-full bg-gray-50'
                    >
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input Sheet - Nested */}
            <AmountInputSheet
              open={amountSheetOpen}
              onOpenChange={setAmountSheetOpen}
              onConfirm={handleAmountConfirm}
            />
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
