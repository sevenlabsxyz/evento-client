'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { NumericKeypad } from '@/components/wallet/numeric-keypad';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpDown, Check, Loader2, X, Zap } from 'lucide-react';
import Image from 'next/image';
import { cloneElement, isValidElement, useEffect, useState } from 'react';

const DEFAULT_QUICK_AMOUNTS = [21, 100, 500, 1000, 5000];

interface ZapSheetProps {
  recipientLightningAddress: string;
  recipientName: string;
  recipientUsername?: string;
  recipientAvatar?: string;
  children?: React.ReactNode;
  quickAmounts?: number[];
  onSuccess?: (amountSats: number) => void;
  onError?: (error: Error) => void;
}

type Step = 'amount' | 'custom' | 'confirm' | 'sending' | 'success';

export function ZapSheet({
  recipientLightningAddress,
  recipientName,
  recipientUsername,
  recipientAvatar,
  children,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  onSuccess,
  onError,
}: ZapSheetProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customAmountUSD, setCustomAmountUSD] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [prepareResponse, setPrepareResponse] = useState<any>(null);

  const { satsToUSD, usdToSats } = useAmountConverter();

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setStep('amount');
      setSelectedAmount(null);
      setCustomAmount('');
      setCustomAmountUSD('');
      setAmountUSD('');
      setPrepareResponse(null);
    }
  }, [open]);

  // Convert selected amount to USD when it changes
  useEffect(() => {
    const convertAmount = async () => {
      if (selectedAmount && selectedAmount > 0) {
        const usd = await satsToUSD(selectedAmount);
        setAmountUSD(usd.toFixed(2));
      }
    };
    convertAmount();
  }, [selectedAmount, satsToUSD]);

  const handleQuickAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  const handleCustomAmountClick = () => {
    setStep('custom');
    setSelectedAmount(null);
  };

  const handleNumberClick = async (num: string) => {
    const currentValue = inputMode === 'usd' ? customAmountUSD : customAmount;
    const newValue = currentValue + num;

    if (inputMode === 'sats') {
      setCustomAmount(newValue);
      if (Number(newValue) > 0) {
        const usd = await satsToUSD(Number(newValue));
        setCustomAmountUSD(usd.toFixed(2));
      }
    } else {
      setCustomAmountUSD(newValue);
      if (Number(newValue) > 0) {
        const sats = await usdToSats(Number(newValue));
        setCustomAmount(sats.toString());
      }
    }
  };

  const handleDelete = async () => {
    const currentValue = inputMode === 'usd' ? customAmountUSD : customAmount;
    const newValue = currentValue.slice(0, -1);

    if (inputMode === 'sats') {
      setCustomAmount(newValue);
      if (newValue && Number(newValue) > 0) {
        const usd = await satsToUSD(Number(newValue));
        setCustomAmountUSD(usd.toFixed(2));
      } else {
        setCustomAmountUSD('');
      }
    } else {
      setCustomAmountUSD(newValue);
      if (newValue && Number(newValue) > 0) {
        const sats = await usdToSats(Number(newValue));
        setCustomAmount(sats.toString());
      } else {
        setCustomAmount('');
      }
    }
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'sats' ? 'usd' : 'sats');
  };

  const handleCustomAmountConfirm = () => {
    if (customAmount && Number(customAmount) > 0) {
      setSelectedAmount(Number(customAmount));
      setStep('confirm');
    }
  };

  const handleProceedToConfirm = async () => {
    if (!selectedAmount) return;

    try {
      // Parse the lightning address to get LNURL data
      const parsed = await breezSDK.parseInput(recipientLightningAddress);

      if (parsed.type === 'lightningAddress') {
        const payRequest = (parsed as any).payRequest;

        // Prepare the LNURL payment
        const response = await breezSDK.prepareLnurlPay({
          payRequest,
          amountSats: selectedAmount,
        });

        setPrepareResponse(response);
        setStep('confirm');
      } else {
        toast.error('Invalid lightning address');
      }
    } catch (error: any) {
      console.error('Failed to prepare zap:', error);
      toast.error(error.message || 'Failed to prepare payment');
      onError?.(error);
    }
  };

  const handleConfirmPayment = async () => {
    if (!prepareResponse || !selectedAmount) return;

    setStep('sending');

    try {
      await breezSDK.lnurlPay({
        prepareResponse,
      });

      setStep('success');
      onSuccess?.(selectedAmount);
    } catch (error: any) {
      console.error('Failed to send zap:', error);
      toast.error(error.message || 'Failed to send payment');
      onError?.(error);
      setStep('confirm');
    }
  };

  const handleClose = () => {
    if (step !== 'sending') {
      setOpen(false);
    }
  };

  // Render trigger
  const renderTrigger = () => {
    if (children) {
      // Clone child element and add onClick
      if (isValidElement(children)) {
        return cloneElement(children as React.ReactElement<any>, {
          onClick: () => setOpen(true),
        });
      }
      return <div onClick={() => setOpen(true)}>{children}</div>;
    }

    // Default zap button
    return (
      <motion.button
        onClick={() => setOpen(true)}
        className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-500 font-semibold text-white transition-colors hover:bg-red-600 active:bg-red-700'
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Zap className='h-5 w-5' />
        Zap
      </motion.button>
    );
  };

  // Amount selection step
  const amountContent = (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4'>
        <h2 className='text-xl font-semibold'>Send Zap</h2>
        <button
          onClick={handleClose}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Recipient Card */}
          <div className='flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4'>
            {recipientAvatar ? (
              <div className='relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full'>
                <Image src={recipientAvatar} alt={recipientName} fill className='object-cover' />
              </div>
            ) : (
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100'>
                <Zap className='h-6 w-6 text-orange-600' />
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate font-semibold text-gray-900'>{recipientName}</p>
              {recipientUsername && (
                <p className='truncate text-sm text-gray-500'>@{recipientUsername}</p>
              )}
              <p className='truncate font-mono text-xs text-gray-400'>
                {recipientLightningAddress}
              </p>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className='space-y-3'>
            <p className='text-sm font-medium text-gray-600'>Select amount</p>
            <div className='grid grid-cols-3 gap-3'>
              {quickAmounts.map((amount) => (
                <motion.button
                  key={amount}
                  onClick={() => handleQuickAmountSelect(amount)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`flex h-14 items-center justify-center rounded-xl border-2 font-semibold transition-all ${
                    selectedAmount === amount
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {amount.toLocaleString()}
                </motion.button>
              ))}
              <motion.button
                onClick={handleCustomAmountClick}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className='flex h-14 items-center justify-center rounded-xl border-2 border-gray-200 bg-white font-semibold text-gray-900 transition-all hover:border-gray-300'
              >
                Custom
              </motion.button>
            </div>
          </div>

          {/* Selected Amount Display */}
          {selectedAmount && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 text-center'>
              <p className='text-3xl font-bold text-gray-900'>
                {selectedAmount.toLocaleString()} sats
              </p>
              {amountUSD && <p className='mt-1 text-sm text-gray-500'>≈ ${amountUSD} USD</p>}
            </div>
          )}

          {/* Next Button */}
          <Button
            onClick={handleProceedToConfirm}
            disabled={!selectedAmount}
            className='h-12 w-full rounded-full bg-orange-500 font-semibold text-white hover:bg-orange-600'
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  // Custom amount step
  const customAmountContent = (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4'>
        <button
          onClick={() => setStep('amount')}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Custom Amount</h2>
        <button
          onClick={handleClose}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Content */}
      <div className='p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-8 text-center'>
            <div className='text-4xl font-bold text-gray-900'>
              {inputMode === 'usd' ? `$${customAmountUSD || '0'}` : `${customAmount || '0'}`}
            </div>
            <div className='mt-1 text-lg font-medium text-gray-600'>
              {inputMode === 'usd' ? 'USD' : 'sats'}
            </div>
            <button
              onClick={toggleInputMode}
              className='mx-auto mt-3 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100'
            >
              <ArrowUpDown className='h-4 w-4' />
              <span>
                {inputMode === 'usd' && customAmount
                  ? `${Number(customAmount).toLocaleString()} sats`
                  : inputMode === 'sats' && customAmountUSD
                    ? `$${customAmountUSD}`
                    : 'Convert'}
              </span>
            </button>
          </div>

          {/* Number Pad */}
          <NumericKeypad
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            showDecimal={true}
          />

          {/* Confirm Button */}
          <Button
            onClick={handleCustomAmountConfirm}
            disabled={!customAmount || Number(customAmount) <= 0}
            className='h-12 w-full rounded-full bg-orange-500 font-semibold text-white hover:bg-orange-600'
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  // Confirmation step
  const confirmContent = (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-4'>
        <button
          onClick={() => setStep('amount')}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-semibold'>Confirm Zap</h2>
        <button
          onClick={handleClose}
          className='rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='mx-auto max-w-md space-y-6'>
          {/* Amount Display */}
          <div className='rounded-xl border border-orange-200 bg-orange-50 p-8 text-center'>
            <Zap className='mx-auto h-12 w-12 text-orange-500' />
            <p className='mt-4 text-4xl font-bold text-gray-900'>
              {selectedAmount?.toLocaleString()} sats
            </p>
            {amountUSD && <p className='mt-1 text-lg text-gray-600'>≈ ${amountUSD} USD</p>}
          </div>

          {/* Recipient */}
          <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
            <p className='mb-1 text-xs text-gray-500'>Sending to</p>
            <div className='flex items-center gap-3'>
              {recipientAvatar ? (
                <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
                  <Image src={recipientAvatar} alt={recipientName} fill className='object-cover' />
                </div>
              ) : (
                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100'>
                  <Zap className='h-5 w-5 text-orange-600' />
                </div>
              )}
              <div>
                <p className='font-semibold text-gray-900'>{recipientName}</p>
                <p className='font-mono text-xs text-gray-500'>{recipientLightningAddress}</p>
              </div>
            </div>
          </div>

          {/* Fee */}
          {prepareResponse?.feeSats !== undefined && (
            <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-500'>Network Fee</span>
                <span className='text-sm font-medium'>{prepareResponse.feeSats} sats</span>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleConfirmPayment}
            className='h-12 w-full rounded-full bg-orange-500 font-semibold text-white hover:bg-orange-600'
          >
            Confirm & Send
          </Button>
        </div>
      </div>
    </div>
  );

  // Sending step
  const sendingContent = (
    <div className='flex flex-col items-center justify-center p-12'>
      <Loader2 className='h-16 w-16 animate-spin text-orange-500' />
      <p className='mt-6 text-xl font-semibold text-gray-900'>Sending Zap...</p>
      <p className='mt-2 text-sm text-gray-500'>Please wait</p>
    </div>
  );

  // Success step
  const successContent = (
    <div className='flex flex-col'>
      {/* Content */}
      <div className='flex flex-1 flex-col items-center justify-center p-12'>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className='flex h-24 w-24 items-center justify-center rounded-full bg-green-100'
        >
          <Check className='h-12 w-12 text-green-600' />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='mt-6 text-2xl font-bold text-gray-900'
        >
          Zap Sent!
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='mt-2 text-lg text-gray-600'
        >
          {selectedAmount?.toLocaleString()} sats to {recipientName}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='mt-8 w-full max-w-xs'
        >
          <Button
            onClick={handleClose}
            className='h-12 w-full rounded-full bg-gray-900 font-semibold text-white hover:bg-gray-800'
          >
            Done
          </Button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {renderTrigger()}

      <SheetWithDetentFull.Root
        presented={open}
        onPresentedChange={(presented) => {
          if (!presented && step !== 'sending') {
            setOpen(false);
          }
        }}
      >
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className='grid h-full grid-rows-[1fr]'>
              <SheetWithDetentFull.ScrollRoot asChild>
                <SheetWithDetentFull.ScrollView className='min-h-0'>
                  <SheetWithDetentFull.ScrollContent>
                    {/* Handle */}
                    <div className='my-4 flex items-center'>
                      <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
                    </div>
                    <VisuallyHidden.Root asChild>
                      <SheetWithDetentFull.Title>Send Zap</SheetWithDetentFull.Title>
                    </VisuallyHidden.Root>

                    {step === 'amount' && amountContent}
                    {step === 'custom' && customAmountContent}
                    {step === 'confirm' && confirmContent}
                    {step === 'sending' && sendingContent}
                    {step === 'success' && successContent}
                  </SheetWithDetentFull.ScrollContent>
                </SheetWithDetentFull.ScrollView>
              </SheetWithDetentFull.ScrollRoot>
            </SheetWithDetentFull.Content>
          </SheetWithDetentFull.View>
        </SheetWithDetentFull.Portal>
      </SheetWithDetentFull.Root>
    </>
  );
}
