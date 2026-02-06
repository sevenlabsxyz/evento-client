'use client';

import { Button } from '@/components/ui/button';
import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { SegmentedTabItem, SegmentedTabs } from '@/components/ui/segmented-tabs';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useAmountConverter, useReceivePayment } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Payment, SdkEvent } from '@breeztech/breez-sdk-spark/web';
import { Bitcoin, CheckCircle2, Copy, Loader2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AmountInputSheet } from './amount-input-sheet';

interface ReceiveLightningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveLightningSheet({ open, onOpenChange }: ReceiveLightningSheetProps) {
  const [activeTab, setActiveTab] = useState<'lightning' | 'bitcoin'>('lightning');
  const [qrCodeData, setQrCodeData] = useState<string>(''); // Lightning address or bolt11
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<number | null>(null);
  const [invoiceAmountUSD, setInvoiceAmountUSD] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBitcoin, setIsGeneratingBitcoin] = useState(false);
  const [amountSheetOpen, setAmountSheetOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<string | null>(null); // Track active bolt11 invoice
  const [showSuccess, setShowSuccess] = useState(false);

  const { createInvoice } = useReceivePayment();
  const { address, isLoading: isAddressLoading } = useLightningAddress();
  const { satsToUSD } = useAmountConverter();

  // Generate QR code for lightning address when sheet opens
  useEffect(() => {
    if (open && address?.lightningAddress && !invoiceAmount) {
      generateLightningAddressQR(address.lightningAddress);
    }
  }, [open, address, invoiceAmount]);

  // Set up event listener to detect when active invoice is paid
  useEffect(() => {
    // Only set up listener if we have an active invoice
    if (!activeInvoice) return;

    logger.info('Setting up payment listener for invoice', { activeInvoice });

    const handlePaymentEvent = (event: SdkEvent) => {
      if (event.type === 'paymentSucceeded') {
        const payment = (event as any).payment as Payment;

        // Check if this payment matches our active invoice
        if (payment.details?.type === 'lightning' && payment.details.invoice === activeInvoice) {
          logger.info('Payment received for active invoice', { payment });
          setShowSuccess(true);
        }
      }
    };

    // Subscribe to Breez SDK events
    const unsubscribe = breezSDK.onEvent(handlePaymentEvent);

    // Cleanup on unmount or when invoice changes
    return () => {
      logger.info('Cleaning up payment listener');
      unsubscribe();
    };
  }, [activeInvoice]);

  const generateLightningAddressQR = async (lightningAddress: string) => {
    setQrCodeData(`lightning:${lightningAddress}`);
  };

  const generateBitcoinAddress = async () => {
    if (bitcoinAddress || isGeneratingBitcoin) return; // Don't generate if already exists or loading

    setIsGeneratingBitcoin(true);
    try {
      // Use the SDK's receivePayment method with bitcoinAddress payment method
      const receiveResponse = await breezSDK.receivePayment({
        paymentMethod: { type: 'bitcoinAddress' },
      });
      setBitcoinAddress(receiveResponse.paymentRequest);
    } catch (error: any) {
      logger.error('Failed to generate Bitcoin address', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(error.message || 'Failed to generate Bitcoin address');
    } finally {
      setIsGeneratingBitcoin(false);
    }
  };

  const handleTabChange = (tab: 'lightning' | 'bitcoin') => {
    setActiveTab(tab);

    if (tab === 'bitcoin') {
      generateBitcoinAddress();
    } else if (tab === 'lightning' && address?.lightningAddress && !invoiceAmount) {
      generateLightningAddressQR(address.lightningAddress);
    }
  };

  const handleAmountConfirm = async (amountSats: number) => {
    try {
      setIsGenerating(true);
      const invoiceData = await createInvoice(amountSats, 'Payment request');

      // Convert to USD
      const usd = await satsToUSD(amountSats);

      setQrCodeData(invoiceData.paymentRequest);
      setInvoiceAmount(amountSats);
      setInvoiceAmountUSD(usd);
      setActiveInvoice(String(invoiceData.paymentRequest).toUpperCase()); // Track the active invoice
      setAmountSheetOpen(false); // Close the amount sheet
    } catch (error: any) {
      logger.error('Failed to create invoice', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to truncate invoice for display
  const truncateInvoice = (invoice: string) => {
    if (invoice.length <= 20) return invoice;
    return `${invoice.slice(0, 10)}...${invoice.slice(-10)}`;
  };

  const handleShare = async () => {
    // Use raw content without "lightning:" prefix
    const shareContent = invoiceAmount ? activeInvoice : address?.lightningAddress;

    if (!shareContent) return;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareContent,
        });
      } catch (error) {
        logger.error('Share failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Fallback to copy
      try {
        await navigator.clipboard.writeText(shareContent);
        toast.success('Copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy');
      }
    }
  };

  // Helper function to format Bitcoin address into groups of 4
  const formatBitcoinAddress = (address: string) => {
    const groups = address.match(/.{1,4}/g) || [];
    return groups.map((group, index) => {
      const isFirstThree = index < 3;
      const isLastThree = index >= groups.length - 3;
      const isBold = isFirstThree || isLastThree;
      return { group, isBold };
    });
  };

  // Define tab items
  const tabItems: SegmentedTabItem[] = [
    {
      value: 'lightning',
      label: (
        <div className='flex items-center justify-center gap-2'>
          <Zap className='h-4 w-4' />
          Lightning
        </div>
      ),
    },
    {
      value: 'bitcoin',
      label: (
        <div className='flex items-center justify-center gap-2'>
          <Bitcoin className='h-4 w-4' />
          Onchain
        </div>
      ),
    },
  ];

  return (
    <>
      <MasterScrollableSheet
        open={open}
        onOpenChange={onOpenChange}
        title='Receive'
        headerSecondary={
          <SegmentedTabs
            wrapperClassName='mb-2 px-4 py-1 flex flex-row items-start !justify-start gap-2'
            items={tabItems}
            value={activeTab}
            onValueChange={(value) => handleTabChange(value as 'lightning' | 'bitcoin')}
          />
        }
      >
        <div className='mx-auto max-w-md space-y-6 p-6'>
          {/* Success Screen */}
          {showSuccess ? (
            <div className='flex flex-col items-center justify-center space-y-6 py-12'>
              {/* Success Icon */}
              <div className='rounded-full bg-green-100 p-6'>
                <CheckCircle2 className='h-16 w-16 text-green-600' />
              </div>

              {/* Success Message */}
              <div className='text-center'>
                <h3 className='mb-2 text-2xl font-bold text-gray-900'>Payment Received!</h3>
                <p className='text-gray-600'>
                  You successfully received {invoiceAmount?.toLocaleString() || 0} sats
                </p>
              </div>

              {/* Amount Display */}
              {invoiceAmountUSD !== null && (
                <div className='rounded-xl bg-gray-50 px-6 py-4'>
                  <p className='text-center text-3xl font-bold text-gray-900'>
                    ${invoiceAmountUSD.toFixed(2)}
                  </p>
                  <p className='text-center text-sm text-gray-600'>
                    {invoiceAmount?.toLocaleString()} sats
                  </p>
                </div>
              )}

              {/* Done Button */}
              <Button
                onClick={() => {
                  // Reset state and close
                  setShowSuccess(false);
                  setInvoiceAmount(null);
                  setInvoiceAmountUSD(null);
                  setActiveInvoice(null);
                  onOpenChange(false);
                }}
                className='h-12 w-full max-w-xs rounded-full'
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Lightning Tab Content */}
              {activeTab === 'lightning' && (
                <>
                  {/* Registering State - Show when address is not yet available */}
                  {!address?.lightningAddress && !invoiceAmount && (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                      <Loader2 className='mb-4 h-8 w-8 animate-spin text-gray-400' />
                      <p className='text-sm font-medium text-gray-600'>
                        Registering your Lightning address...
                      </p>
                      <p className='mt-1 text-xs text-gray-400'>This may take a few moments</p>
                    </div>
                  )}

                  {/* Show Lightning Address or Invoice based on state */}
                  {(address?.lightningAddress || activeInvoice) && (
                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex min-w-0 flex-1 flex-col'>
                          <p className='mb-1 text-sm text-muted-foreground'>
                            {invoiceAmount ? 'Lightning Invoice' : 'Lightning Address'}
                          </p>
                          <p className='truncate font-mono text-base leading-relaxed'>
                            {invoiceAmount && activeInvoice
                              ? truncateInvoice(activeInvoice)
                              : address?.lightningAddress}
                          </p>
                        </div>
                        <Button
                          onClick={async () => {
                            const copyContent = invoiceAmount
                              ? activeInvoice
                              : address?.lightningAddress;
                            if (!copyContent) return;
                            try {
                              await navigator.clipboard.writeText(copyContent);
                              toast.success(invoiceAmount ? 'Invoice copied!' : 'Address copied!');
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
                  {qrCodeData && (
                    <div className='space-y-3'>
                      <div className='relative mx-auto w-fit'>
                        <EventoQRCode
                          value={qrCodeData}
                          size={256}
                          className='rounded-3xl'
                          showLogo={!invoiceAmount}
                          qrStyle={invoiceAmount ? 'fluid' : 'dots'}
                        />
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
                </>
              )}

              {/* Bitcoin Tab Content */}
              {activeTab === 'bitcoin' && (
                <>
                  {/* Bitcoin Address QR Code */}
                  {isGeneratingBitcoin ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                      <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary' />
                      <p className='mt-4 text-sm text-gray-600'>Generating Bitcoin address...</p>
                    </div>
                  ) : bitcoinAddress ? (
                    <>
                      {/* Bitcoin Address Display */}
                      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                        <p className='mb-1 text-sm text-muted-foreground'>Bitcoin Address</p>
                        <div className='flex items-start gap-2'>
                          <p className='flex-1 break-all font-mono text-base leading-relaxed'>
                            {formatBitcoinAddress(bitcoinAddress).map((item, index) => (
                              <span
                                key={index}
                                className={item.isBold ? 'font-extrabold' : 'font-normal'}
                              >
                                {item.group}
                                {index < formatBitcoinAddress(bitcoinAddress).length - 1 && ' '}
                              </span>
                            ))}
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(bitcoinAddress);
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

                      {/* QR Code */}
                      <div className='space-y-3'>
                        <div className='relative mx-auto w-fit'>
                          <EventoQRCode
                            value={`bitcoin:${bitcoinAddress}`}
                            size={256}
                            className='rounded-3xl'
                            showLogo={true}
                            qrStyle='dots'
                          />
                        </div>
                      </div>

                      {/* Share Button */}
                      <div className='space-y-3'>
                        <Button
                          onClick={async () => {
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  text: bitcoinAddress,
                                });
                              } catch (error) {
                                logger.error('Share failed', {
                                  error: error instanceof Error ? error.message : String(error),
                                });
                              }
                            } else {
                              try {
                                await navigator.clipboard.writeText(bitcoinAddress);
                                toast.success('Copied to clipboard');
                              } catch (error) {
                                toast.error('Failed to copy');
                              }
                            }
                          }}
                          variant='outline'
                          className='h-12 w-full rounded-full bg-gray-50'
                        >
                          Share
                        </Button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </MasterScrollableSheet>

      {/* Amount Input Sheet */}
      <AmountInputSheet
        open={amountSheetOpen}
        onOpenChange={setAmountSheetOpen}
        onConfirm={handleAmountConfirm}
        isLoading={isGenerating}
      />
    </>
  );
}
