'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useContacts } from '@/lib/hooks/use-contacts';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { ArrowDownLeft, ArrowUpRight, Check, Clock, Copy, Info, XCircle } from '@/lib/icons';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { getWalletPaymentDisplayData } from '@/lib/utils/wallet-payment-display';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { useEffect, useState } from 'react';

interface TransactionDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
}

export function TransactionDetailsSheet({
  open,
  onOpenChange,
  payment,
}: TransactionDetailsSheetProps) {
  const [amountUSD, setAmountUSD] = useState<number>(0);
  const [feesUSD, setFeesUSD] = useState<number>(0);
  const { satsToUSD } = useAmountConverter();
  const { findContactByAddress } = useContacts();

  // Convert amounts to USD
  useEffect(() => {
    const convertAmounts = async () => {
      try {
        const usd = await satsToUSD(Number(payment.amount));
        setAmountUSD(usd);

        const totalFees = Number(payment.fees);
        if (totalFees > 0) {
          const feesUsd = await satsToUSD(totalFees);
          setFeesUSD(feesUsd);
        }
      } catch (error) {
        logger.error('Failed to convert amounts', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    convertAmounts();
  }, [payment, satsToUSD]);

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get payment type label
  const getTypeLabel = () => {
    return payment.paymentType === 'receive' ? 'Received' : 'Sent';
  };

  // Get status info
  const getStatusInfo = () => {
    const status = payment.status;
    if (status === 'completed') {
      return {
        label: 'Completed',
        icon: <Check className='h-4 w-4 text-green-600' />,
        color: 'text-green-600',
      };
    } else if (status === 'pending') {
      return {
        label: 'Pending',
        icon: <Clock className='h-4 w-4 text-amber-600' />,
        color: 'text-amber-600',
      };
    } else {
      return {
        label: 'Failed',
        icon: <XCircle className='h-4 w-4 text-red-600' />,
        color: 'text-red-600',
      };
    }
  };

  // Get invoice
  const getInvoice = () => {
    if (payment.details?.type === 'lightning') {
      return payment.details.invoice;
    }
    return null;
  };

  // Get preimage
  const getPreimage = () => {
    if (payment.details?.type === 'lightning') {
      return payment.details.htlcDetails.preimage;
    }
    return null;
  };

  // Get payment hash
  const getPaymentHash = () => {
    if (payment.details?.type === 'lightning') {
      return payment.details.htlcDetails.paymentHash;
    }
    return null;
  };

  // Get destination pubkey
  const getDestinationPubkey = () => {
    if (payment.details?.type === 'lightning') {
      return payment.details.destinationPubkey;
    }
    return null;
  };

  // Get Lightning address from payment details
  const getLightningAddress = () => {
    if (payment.details?.type === 'lightning') {
      // Try to get lightning address from various possible fields
      const details = payment.details as any;
      return details.lightningAddress || details.lnAddress || details.destinationAddress || null;
    }
    return null;
  };

  // Look up contact for this payment
  const displayData = getWalletPaymentDisplayData(payment);
  const lightningAddress = displayData.lightningAddress ?? getLightningAddress();
  const contact = lightningAddress ? findContactByAddress(lightningAddress) : null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const statusInfo = getStatusInfo();
  const invoice = getInvoice();
  const preimage = getPreimage();
  const paymentHash = getPaymentHash();
  const destinationPubkey = getDestinationPubkey();
  const detailRows = [
    displayData.senderComment
      ? { label: 'Sender Comment', value: displayData.senderComment, copyable: false }
      : null,
    displayData.description && displayData.description !== displayData.senderComment
      ? { label: 'Description', value: displayData.description, copyable: false }
      : null,
    contact ? { label: 'Saved Contact', value: contact.name, copyable: false } : null,
  ].filter((row): row is { label: string; value: string; copyable: boolean } => Boolean(row));
  const advancedRows = [
    displayData.lightningUsername
      ? { label: 'Username', value: displayData.lightningUsername, copyable: true }
      : null,
    displayData.lightningAddress
      ? { label: 'Lightning Address', value: displayData.lightningAddress, copyable: true }
      : null,
    displayData.lightningDomain
      ? { label: 'Provider', value: displayData.lightningDomain, copyable: true }
      : null,
  ].filter((row): row is { label: string; value: string; copyable: boolean } => Boolean(row));

  return (
    <MasterScrollableSheet
      title='Transaction Details'
      open={open}
      onOpenChange={onOpenChange}
      className='md:!max-w-[500px]'
      contentClassName='px-4 py-2 pb-8 md:pb-24'
    >
      <div className='mx-auto min-h-fit max-w-md space-y-4 pb-8'>
        {/* Amount Card - Glassmorphic */}
        <div className='rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm backdrop-blur-xl'>
          <div className='mb-4 flex flex-col items-center justify-center gap-2 text-center'>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                payment.paymentType === 'receive' ? 'bg-green-100' : 'bg-blue-100'
              }`}
            >
              {payment.paymentType === 'receive' ? (
                <ArrowDownLeft
                  className={`h-5 w-5 ${
                    payment.paymentType === 'receive' ? 'text-green-600' : 'text-blue-600'
                  }`}
                />
              ) : (
                <ArrowUpRight className='h-5 w-5 text-blue-600' />
              )}
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-medium text-gray-600'>{getTypeLabel()}</p>
              {contact && <p className='text-sm font-semibold text-primary'>{contact.name}</p>}
            </div>
          </div>
          <div className='text-center'>
            <div className='flex items-baseline justify-center gap-2'>
              <span className='text-5xl font-semibold tracking-tight text-gray-900'>
                {Number(payment.amount).toLocaleString()}
              </span>
              <InfoTooltip text='Satoshis (sats) are the smallest unit of Bitcoin. 100,000,000 sats = 1 Bitcoin.'>
                <span className='text-lg font-medium text-gray-500'>sats</span>
              </InfoTooltip>
            </div>
            <div className='mt-2 text-lg font-medium text-gray-500'>
              ≈ ${amountUSD.toFixed(2)} USD
            </div>
          </div>
        </div>

        {/* Transaction Info Group */}
        <div className='overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm'>
          {/* Time */}
          <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3'>
            <span className='text-sm font-medium text-gray-600'>Time</span>
            <span className='text-sm text-gray-900'>{formatTimestamp(payment.timestamp)}</span>
          </div>

          {/* Type */}
          <div className='flex items-center justify-between border-b border-gray-200 px-4 py-3'>
            <span className='text-sm font-medium text-gray-600'>Type</span>
            <span className='text-sm text-gray-900'>{getTypeLabel()}</span>
          </div>

          {/* Status */}
          <div className='flex items-center justify-between px-4 py-3'>
            <span className='text-sm font-medium text-gray-600'>Status</span>
            <div className='flex items-center gap-2'>
              {statusInfo.icon}
              <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Financial Details Group */}
        {Number(payment.fees) > 0 && (
          <div className='overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm'>
            <div className='px-4 py-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1'>
                  <span className='text-sm font-medium text-gray-600'>Total Fees</span>
                  <InfoTooltip text='Network fees paid to process this Lightning transaction.'>
                    <Info className='h-3 w-3 text-gray-400' />
                  </InfoTooltip>
                </div>
                <div className='text-right'>
                  <div className='flex items-center gap-1'>
                    <span className='text-sm font-medium text-gray-900'>
                      {Number(payment.fees).toLocaleString()}
                    </span>
                    <InfoTooltip text='Satoshis (sats) are the smallest unit of Bitcoin. 100,000,000 sats = 1 Bitcoin.'>
                      <span className='text-sm text-gray-600'>sats</span>
                    </InfoTooltip>
                  </div>
                  <span className='text-xs text-gray-500'>≈ ${feesUSD.toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Group */}
        {(detailRows.length > 0 || invoice) && (
          <div className='overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm'>
            {detailRows.map((row, index) => {
              const shouldShowBorder = index < detailRows.length - 1 || Boolean(invoice);

              return (
                <div
                  key={row.label}
                  className={`px-4 py-3 ${shouldShowBorder ? 'border-b border-gray-200' : ''}`}
                >
                  <div className='mb-1 text-xs font-medium uppercase tracking-wide text-gray-500'>
                    {row.label}
                  </div>
                  <div className='flex items-start gap-2'>
                    <p className='flex-1 break-all text-sm text-gray-900'>{row.value}</p>
                    {row.copyable && (
                      <Button
                        onClick={() => handleCopy(row.value, row.label)}
                        variant='ghost'
                        size='sm'
                        className='h-11 w-11 flex-shrink-0 p-0'
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Invoice */}
            {invoice && (
              <div className='px-4 py-3'>
                <div className='mb-2 flex items-center gap-1'>
                  <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                    Invoice
                  </span>
                  <InfoTooltip text='A Lightning invoice is a payment request that contains the amount, destination, and other payment details.'>
                    <Info className='h-3 w-3 text-gray-400' />
                  </InfoTooltip>
                </div>
                <div className='flex items-start gap-2'>
                  <code className='flex-1 break-all text-xs text-gray-900'>{invoice}</code>
                  <Button
                    onClick={() => handleCopy(invoice, 'Invoice')}
                    variant='ghost'
                    size='sm'
                    className='h-11 w-11 flex-shrink-0 p-0'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Details Accordion */}
        {(advancedRows.length > 0 || preimage || paymentHash || destinationPubkey) && (
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='advanced' className='border-none'>
              <AccordionTrigger className='h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 shadow-sm hover:bg-gray-100 hover:no-underline'>
                <span className='text-sm font-medium text-gray-900'>Advanced Details</span>
              </AccordionTrigger>
              <AccordionContent className='pt-4'>
                <div className='overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm'>
                  {advancedRows.map((row) => (
                    <div key={row.label} className='border-b border-gray-200 px-4 py-3'>
                      <div className='mb-1 text-xs font-medium uppercase tracking-wide text-gray-500'>
                        {row.label}
                      </div>
                      <div className='flex items-start gap-2'>
                        <p className='flex-1 break-all text-sm text-gray-900'>{row.value}</p>
                        <Button
                          onClick={() => handleCopy(row.value, row.label)}
                          variant='ghost'
                          size='sm'
                          className='h-11 w-11 flex-shrink-0 p-0'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* Payment Hash */}
                  {paymentHash && (
                    <div
                      className={`px-4 py-3 ${
                        preimage || destinationPubkey || payment.id
                          ? 'border-b border-gray-200'
                          : ''
                      }`}
                    >
                      <div className='mb-2 flex items-center gap-1'>
                        <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                          Payment Hash
                        </span>
                        <InfoTooltip text='A unique identifier for this Lightning payment, derived from the preimage.'>
                          <Info className='h-3 w-3 text-gray-400' />
                        </InfoTooltip>
                      </div>
                      <div className='flex items-start gap-2'>
                        <code className='flex-1 break-all text-xs text-gray-900'>
                          {paymentHash}
                        </code>
                        <Button
                          onClick={() => handleCopy(paymentHash, 'Payment hash')}
                          variant='ghost'
                          size='sm'
                          className='h-11 w-11 flex-shrink-0 p-0'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Preimage */}
                  {preimage && (
                    <div
                      className={`px-4 py-3 ${destinationPubkey || payment.id ? 'border-b border-gray-200' : ''}`}
                    >
                      <div className='mb-2 flex items-center gap-1'>
                        <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                          Preimage
                        </span>
                        <InfoTooltip text="The secret value that proves this payment was completed. It's the cryptographic proof of payment.">
                          <Info className='h-3 w-3 text-gray-400' />
                        </InfoTooltip>
                      </div>
                      <div className='flex items-start gap-2'>
                        <code className='flex-1 break-all text-xs text-gray-900'>{preimage}</code>
                        <Button
                          onClick={() => handleCopy(preimage, 'Preimage')}
                          variant='ghost'
                          size='sm'
                          className='h-11 w-11 flex-shrink-0 p-0'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Destination Pubkey */}
                  {destinationPubkey && (
                    <div className={`px-4 py-3 ${payment.id ? 'border-b border-gray-200' : ''}`}>
                      <div className='mb-2 flex items-center gap-1'>
                        <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                          Destination Node
                        </span>
                        <InfoTooltip text='The public key of the Lightning node that received this payment.'>
                          <Info className='h-3 w-3 text-gray-400' />
                        </InfoTooltip>
                      </div>
                      <div className='flex items-start gap-2'>
                        <code className='flex-1 break-all text-xs text-gray-900'>
                          {destinationPubkey}
                        </code>
                        <Button
                          onClick={() => handleCopy(destinationPubkey, 'Destination node')}
                          variant='ghost'
                          size='sm'
                          className='h-11 w-11 flex-shrink-0 p-0'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Transaction ID */}
                  <div className='px-4 py-3'>
                    <div className='mb-2 flex items-center gap-1'>
                      <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                        Transaction ID
                      </span>
                      <InfoTooltip text='The unique identifier for this transaction in your wallet.'>
                        <Info className='h-3 w-3 text-gray-400' />
                      </InfoTooltip>
                    </div>
                    <div className='flex items-start gap-2'>
                      <code className='flex-1 break-all text-xs text-gray-900'>{payment.id}</code>
                      <Button
                        onClick={() => handleCopy(payment.id, 'Transaction ID')}
                        variant='ghost'
                        size='sm'
                        className='h-11 w-11 flex-shrink-0 p-0'
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </MasterScrollableSheet>
  );
}

// Helper component for info tooltips
function InfoTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className='inline-flex cursor-help items-center gap-1'>{children}</span>
        </TooltipTrigger>
        <TooltipContent className='max-w-xs'>
          <p className='text-xs'>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
