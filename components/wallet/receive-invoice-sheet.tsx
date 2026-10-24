'use client';

import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { EventoQRCode } from '@/components/ui/evento-qr-code';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useAmountConverter, useReceivePayment } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import type { Payment, SdkEvent } from '@breeztech/breez-sdk-spark/ssr';
import { Bitcoin, CheckCircle2, Copy, Loader2, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AmountInputSheet } from './amount-input-sheet';

interface ReceiveLightningSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveLightningSheet({ open, onOpenChange }: ReceiveLightningSheetProps) {
  const t = useTranslations('walletFlows');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'lightning' | 'bitcoin'>('lightning');
  const [qrCodeData, setQrCodeData] = useState<string>(''); // Lightning address or bolt11
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [invoiceAmount, setInvoiceAmount] = useState<number | null>(null);
  const [invoiceAmountUSD, setInvoiceAmountUSD] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBitcoin, setIsGeneratingBitcoin] = useState(false);
  const [bitcoinAddressError, setBitcoinAddressError] = useState<string | null>(null);
  const [amountSheetOpen, setAmountSheetOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<string | null>(null); // Track active bolt11 invoice
  const [showSuccess, setShowSuccess] = useState(false);
  const bitcoinAddressRequestId = useRef(0);

  const { createInvoice } = useReceivePayment();
  const { address, isLoading: isAddressLoading } = useLightningAddress();
  const { satsToUSD } = useAmountConverter();

  const generateLightningAddressQR = useCallback(async (lightningAddress: string) => {
    setQrCodeData(`lightning:${lightningAddress}`);
  }, []);

  // Generate QR code for lightning address when sheet opens
  useEffect(() => {
    if (open && address?.lightningAddress && !invoiceAmount) {
      generateLightningAddressQR(address.lightningAddress);
    }
  }, [open, address, invoiceAmount, generateLightningAddressQR]);

  // Set up event listener to detect when active invoice is paid
  useEffect(() => {
    // Set up listener if we have an active invoice OR if we're showing lightning address (no amount)
    const shouldListen =
      activeInvoice ||
      (open && activeTab === 'lightning' && !invoiceAmount && address?.lightningAddress);
    if (!shouldListen) return;

    logger.info('Setting up payment listener for invoice', {
      activeInvoice,
      hasLightningAddress: !!address?.lightningAddress,
    });

    const handlePaymentEvent = (event: SdkEvent) => {
      if (event.type === 'paymentSucceeded') {
        const payment = (event as any).payment as Payment;

        // Check if this payment matches our active invoice (case-insensitive comparison)
        if (
          payment.details?.type === 'lightning' &&
          activeInvoice &&
          payment.details.invoice?.toUpperCase() === activeInvoice.toUpperCase()
        ) {
          logger.info('Payment received for active invoice', { payment });
          setShowSuccess(true);
          return;
        }

        // If we're showing lightning address (no specific invoice), any incoming lightning payment
        // that doesn't match a specific invoice we're waiting for should also trigger success
        if (
          payment.paymentType === 'receive' &&
          payment.details?.type === 'lightning' &&
          !invoiceAmount &&
          !activeInvoice &&
          activeTab === 'lightning'
        ) {
          logger.info('Payment received via lightning address', { payment });
          // Update state to show the received amount
          const amountSats = Number(payment.amount);
          setInvoiceAmount(amountSats);
          satsToUSD(amountSats).then((usd) => {
            setInvoiceAmountUSD(usd);
            setShowSuccess(true);
          });
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
  }, [activeInvoice, open, activeTab, invoiceAmount, address?.lightningAddress, satsToUSD]);

  const generateBitcoinAddress = useCallback(async () => {
    if (bitcoinAddress || bitcoinAddressError || isGeneratingBitcoin) return;

    setIsGeneratingBitcoin(true);
    const requestId = bitcoinAddressRequestId.current + 1;
    bitcoinAddressRequestId.current = requestId;

    try {
      // Request a fresh deposit address for each receive session to avoid address reuse.
      const receiveResponse = await breezSDK.receivePayment({
        paymentMethod: { type: 'bitcoinAddress', newAddress: true },
      });
      if (bitcoinAddressRequestId.current === requestId) {
        setBitcoinAddress(receiveResponse.paymentRequest);
      }
    } catch (error: any) {
      if (bitcoinAddressRequestId.current !== requestId) return;

      logger.error('Failed to generate Bitcoin address', {
        error: error instanceof Error ? error.message : String(error),
      });
      const errorMessage = error.message || t('receiveInvoiceSheet.generateAddressFailed');
      setBitcoinAddressError(errorMessage);
      toast.error(errorMessage);
    } finally {
      if (bitcoinAddressRequestId.current === requestId) {
        setIsGeneratingBitcoin(false);
      }
    }
  }, [bitcoinAddress, bitcoinAddressError, isGeneratingBitcoin]);

  useEffect(() => {
    if (!open) {
      bitcoinAddressRequestId.current += 1;
      setBitcoinAddress('');
      setBitcoinAddressError(null);
      setIsGeneratingBitcoin(false);
      return;
    }

    if (activeTab === 'bitcoin') {
      void generateBitcoinAddress();
    }
  }, [open, activeTab, generateBitcoinAddress]);

  const handleTabChange = (tab: 'lightning' | 'bitcoin') => {
    setActiveTab(tab);

    if (tab === 'lightning' && address?.lightningAddress && !invoiceAmount) {
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
      toast.error(error.message || t('receiveInvoiceSheet.createInvoiceFailed'));
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
        toast.success(t('receiveInvoiceSheet.copiedToClipboard'));
      } catch (error) {
        toast.error(t('receiveInvoiceSheet.copyFailed'));
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
      return { key: `${index}-${group}`, group, isBold };
    });
  };

  return (
    <>
      <MasterScrollableSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('receiveInvoiceSheet.title')}
        headerSecondary={
          <div className='px-4 pb-2'>
            <AnimatedTabs
              expanded
              tabs={[
                { title: 'Lightning', icon: Zap, onClick: () => handleTabChange('lightning') },
                {
                  title: t('receiveInvoiceSheet.onchain'),
                  icon: Bitcoin,
                  onClick: () => handleTabChange('bitcoin'),
                },
              ]}
              selected={['lightning', 'bitcoin'].indexOf(activeTab)}
            />
          </div>
        }
      >
        <div className='mx-auto max-w-md space-y-6 p-6'>
          {/* Success Screen */}
          {showSuccess ? (
            <div className='flex flex-col items-center justify-center space-y-6 py-12'>
              {/* Success Icon */}
              <div className='rounded-full bg-green-100 p-6 dark:bg-green-950/60'>
                <CheckCircle2 className='h-16 w-16 text-green-600 dark:text-green-400' />
              </div>

              {/* Success Message */}
              <div className='text-center'>
                <h3 className='mb-2 text-2xl font-bold text-gray-900 dark:text-neutral-100'>
                  {t('receiveInvoiceSheet.paymentReceived')}
                </h3>
                <p className='text-gray-600 dark:text-neutral-400'>
                  {t('receiveInvoiceSheet.successfullyReceived', { amount: invoiceAmount || 0 })}
                </p>
              </div>

              {/* Amount Display */}
              {invoiceAmountUSD !== null && (
                <div className='rounded-xl bg-gray-50 px-6 py-4 dark:bg-neutral-950'>
                  <p className='text-center text-3xl font-bold text-gray-900 dark:text-neutral-100'>
                    ${invoiceAmountUSD.toFixed(2)}
                  </p>
                  <p className='text-center text-sm text-gray-600 dark:text-neutral-400'>
                    {t('receiveInvoiceSheet.satsAmount', { amount: invoiceAmount ?? 0 })}
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
                {tCommon('actions.done')}
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
                      <Loader2 className='mb-4 h-8 w-8 animate-spin text-gray-400 dark:text-neutral-500' />
                      <p className='text-sm font-medium text-gray-600 dark:text-neutral-400'>
                        {t('receiveInvoiceSheet.registeringAddress')}
                      </p>
                      <p className='mt-1 text-xs text-gray-400 dark:text-neutral-500'>
                        {t('receiveInvoiceSheet.mayTakeMoments')}
                      </p>
                    </div>
                  )}

                  {/* Show Lightning Address or Invoice based on state */}
                  {(address?.lightningAddress || activeInvoice) && (
                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex min-w-0 flex-1 flex-col'>
                          <p className='mb-1 text-sm text-muted-foreground'>
                            {invoiceAmount
                              ? t('receiveInvoiceSheet.lightningInvoice')
                              : t('receiveInvoiceSheet.lightningAddress')}
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
                              toast.success(
                                invoiceAmount
                                  ? t('receiveInvoiceSheet.invoiceCopied')
                                  : t('receiveInvoiceSheet.addressCopied')
                              );
                            } catch (error) {
                              toast.error(t('receiveInvoiceSheet.copyFailed'));
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
                          className='rounded-3xl dark:bg-white'
                          showLogo={!invoiceAmount}
                          qrStyle={invoiceAmount ? 'fluid' : 'dots'}
                        />
                        {/* Loading Overlay */}
                        {isGenerating && (
                          <div className='absolute inset-0 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm'>
                            <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary dark:border-neutral-700' />
                          </div>
                        )}
                      </div>

                      {/* Amount Display - Only show when invoice has an amount */}
                      {invoiceAmount && invoiceAmountUSD !== null && (
                        <div className='text-center'>
                          <p className='text-lg font-semibold text-gray-900 dark:text-neutral-100'>
                            {t('receiveInvoiceSheet.usdAndSats', {
                              usd: invoiceAmountUSD.toFixed(2),
                              amount: invoiceAmount,
                            })}
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
                      className='h-12 w-full rounded-full bg-gray-50 dark:bg-neutral-950'
                    >
                      {invoiceAmount
                        ? t('receiveInvoiceSheet.receiveAnyAmount')
                        : t('receiveInvoiceSheet.addAmount')}
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant='outline'
                      className='h-12 w-full rounded-full bg-gray-50 dark:bg-neutral-950'
                    >
                      {tCommon('actions.share')}
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
                      <div className='h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary dark:border-neutral-700' />
                      <p className='mt-4 text-sm text-gray-600 dark:text-neutral-400'>
                        {t('receiveInvoiceSheet.generatingAddress')}
                      </p>
                    </div>
                  ) : bitcoinAddress ? (
                    <>
                      {/* Bitcoin Address Display */}
                      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
                        <p className='mb-1 text-sm text-muted-foreground'>
                          {t('receiveInvoiceSheet.bitcoinAddress')}
                        </p>
                        <div className='flex items-start gap-2'>
                          <p className='flex-1 break-all font-mono text-base leading-relaxed'>
                            {formatBitcoinAddress(bitcoinAddress).map((item, index) => (
                              <span
                                key={item.key}
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
                                toast.success(t('receiveInvoiceSheet.addressCopied'));
                              } catch (error) {
                                toast.error(t('receiveInvoiceSheet.copyFailed'));
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
                            className='rounded-3xl dark:bg-white'
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
                                toast.success(t('receiveInvoiceSheet.copiedToClipboard'));
                              } catch (error) {
                                toast.error(t('receiveInvoiceSheet.copyFailed'));
                              }
                            }
                          }}
                          variant='outline'
                          className='h-12 w-full rounded-full bg-gray-50 dark:bg-neutral-950'
                        >
                          {tCommon('actions.share')}
                        </Button>
                      </div>
                    </>
                  ) : bitcoinAddressError ? (
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                      <p className='text-sm font-medium text-gray-900 dark:text-neutral-100'>
                        {t('receiveInvoiceSheet.generateAddressFailed')}
                      </p>
                      <p className='mt-1 max-w-xs text-sm text-gray-500 dark:text-neutral-400'>
                        {bitcoinAddressError}
                      </p>
                      <Button
                        onClick={() => {
                          setBitcoinAddressError(null);
                          setBitcoinAddress('');
                        }}
                        variant='outline'
                        className='mt-4 h-12 rounded-full bg-gray-50 px-6 dark:bg-neutral-950'
                      >
                        {t('receiveInvoiceSheet.tryAgain')}
                      </Button>
                    </div>
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
