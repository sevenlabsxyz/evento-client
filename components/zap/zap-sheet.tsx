'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { useAmountConverter } from '@/lib/hooks/use-wallet-payments';
import { breezSDK } from '@/lib/services/breez-sdk';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { ZapAmountStep } from './steps/zap-amount-step';
import { ZapConfirmStep } from './steps/zap-confirm-step';
import { ZapCustomStep } from './steps/zap-custom-step';
import { ZapNoWalletStep } from './steps/zap-no-wallet-step';
import { ZapSendingStep } from './steps/zap-sending-step';
import { ZapSuccessStep } from './steps/zap-success-step';
import type { LnurlPayRequestDetails, RecipientInfo, Step, ZapSheetProps } from './zap-types';

const DEFAULT_QUICK_AMOUNTS = [21, 100, 500, 1000, 5000];

export function ZapSheet({
  recipientLightningAddress,
  recipientName,
  recipientUsername,
  recipientAvatar,
  children,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  onSuccess,
  onError,
  currentUsername,
}: ZapSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customAmountUSD, setCustomAmountUSD] = useState('');
  const [inputMode, setInputMode] = useState<'sats' | 'usd'>('usd');
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [prepareResponse, setPrepareResponse] = useState<any>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [comment, setComment] = useState('');
  const [payRequest, setPayRequest] = useState<LnurlPayRequestDetails | null>(null);

  const { satsToUSD, usdToSats } = useAmountConverter();

  const showWalletUnlockToast = () => {
    toast.error('Unlock your Evento Wallet to continue.', 'Error', undefined, {
      action: {
        label: 'Unlock',
        onClick: () => router.push('/e/wallet'),
      },
    });
  };

  // Recipient info object for step components
  const recipient: RecipientInfo = {
    name: recipientName,
    username: recipientUsername,
    avatar: recipientAvatar,
    lightningAddress: recipientLightningAddress,
  };

  // Handle open/close state and determine initial step based on wallet
  useEffect(() => {
    if (open) {
      // When opening, determine step based on whether recipient has wallet
      if (!recipientLightningAddress) {
        setStep('no-wallet');
      }
      // If they have an address, step stays at 'amount' (from the reset)
    } else {
      // When closing, reset all state
      setStep('amount');
      setSelectedAmount(null);
      setCustomAmount('');
      setCustomAmountUSD('');
      setAmountUSD('');
      setPrepareResponse(null);
      setIsPreparing(false);
      setComment('');
      setPayRequest(null);
    }
  }, [open, recipientLightningAddress]);

  // Parse lightning address when sheet opens to get payRequest details (for commentAllowed)
  useEffect(() => {
    const parseAddress = async () => {
      if (open && recipientLightningAddress && !payRequest) {
        try {
          const parsed = await breezSDK.parseInput(recipientLightningAddress);
          if (parsed.type === 'lightningAddress') {
            const parsedPayRequest = (parsed as any).payRequest as LnurlPayRequestDetails;
            setPayRequest(parsedPayRequest);
          }
        } catch (error: any) {
          setOpen(false);
          if (error?.message === 'SDK not connected') {
            showWalletUnlockToast();
          } else if (error?.message?.toLowerCase().includes('invalid input')) {
            // Lightning address doesn't exist (404 from LNURL endpoint)
            toast.error('User has not set up Evento Wallet yet.');
          } else {
            toast.error('Failed to load payment details. Please try again.');
          }
        }
      }
    };
    parseAddress();
  }, [open, recipientLightningAddress, payRequest]);

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

  const handleCustomAmountConfirm = async () => {
    if (!customAmount || Number(customAmount) <= 0) return;

    const amountSats = Number(customAmount);
    setSelectedAmount(amountSats);
    setIsPreparing(true);

    try {
      // Use cached payRequest if available, otherwise parse
      let currentPayRequest = payRequest;
      if (!currentPayRequest) {
        const parsed = await breezSDK.parseInput(recipientLightningAddress);
        if (parsed.type === 'lightningAddress') {
          currentPayRequest = (parsed as any).payRequest as LnurlPayRequestDetails;
          setPayRequest(currentPayRequest);
        } else {
          toast.error('Invalid lightning address');
          return;
        }
      }

      if (!currentPayRequest) {
        toast.error('Invalid lightning address');
        return;
      }

      // Prepare the LNURL payment
      const response = await breezSDK.prepareLnurlPay({
        payRequest: currentPayRequest,
        amountSats,
        comment: comment || undefined,
      });

      setPrepareResponse(response);
      setStep('confirm');
    } catch (error: any) {
      logger.error('Failed to prepare zap', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Check for wallet not connected error
      if (
        error.message?.toLowerCase().includes('not connected') ||
        error.message?.toLowerCase().includes('sdk not') ||
        !breezSDK.isConnected()
      ) {
        setOpen(false);
        showWalletUnlockToast();
      } else {
        toast.error(error.message || 'Failed to prepare payment');
      }
      onError?.(error);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleProceedToConfirm = async () => {
    if (!selectedAmount) return;

    setIsPreparing(true);

    try {
      // Use cached payRequest if available, otherwise parse
      let currentPayRequest = payRequest;
      if (!currentPayRequest) {
        const parsed = await breezSDK.parseInput(recipientLightningAddress);
        if (parsed.type === 'lightningAddress') {
          currentPayRequest = (parsed as any).payRequest as LnurlPayRequestDetails;
          setPayRequest(currentPayRequest);
        } else {
          toast.error('Invalid lightning address');
          return;
        }
      }

      if (!currentPayRequest) {
        toast.error('Invalid lightning address');
        return;
      }

      // Prepare the LNURL payment
      const response = await breezSDK.prepareLnurlPay({
        payRequest: currentPayRequest,
        amountSats: selectedAmount,
        comment: comment || undefined,
      });

      setPrepareResponse(response);
      setStep('confirm');
    } catch (error: any) {
      logger.error('Failed to prepare zap', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Check for wallet not connected error
      if (
        error.message?.toLowerCase().includes('not connected') ||
        error.message?.toLowerCase().includes('sdk not') ||
        !breezSDK.isConnected()
      ) {
        setOpen(false);
        showWalletUnlockToast();
      } else {
        toast.error(error.message || 'Failed to prepare payment');
      }
      onError?.(error);
    } finally {
      setIsPreparing(false);
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
      logger.error('Failed to send zap', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Check for wallet not connected error
      if (
        error.message?.toLowerCase().includes('not connected') ||
        error.message?.toLowerCase().includes('sdk not') ||
        !breezSDK.isConnected()
      ) {
        setOpen(false);
        showWalletUnlockToast();
      } else {
        toast.error(error.message || 'Failed to send payment');
      }
      onError?.(error);
      setStep('confirm');
    }
  };

  const handleClose = () => {
    // Block closing during async operations
    if (step !== 'sending' && !isPreparing) {
      setOpen(false);
    }
  };

  const handleBack = () => {
    setStep('amount');
  };

  // Handle opening the zap sheet
  const handleOpenSheet = () => {
    if (currentUsername && recipientUsername && currentUsername === recipientUsername) {
      toast.error('You cannot zap yourself!');
      return;
    }
    setOpen(true);
  };

  // Render trigger
  const renderTrigger = () => {
    if (children) {
      // Clone child element and add onClick
      if (isValidElement(children)) {
        return cloneElement(children as React.ReactElement<any>, {
          onClick: handleOpenSheet,
        });
      }
      return <div onClick={handleOpenSheet}>{children}</div>;
    }

    // Default zap button
    return (
      <motion.button
        onClick={handleOpenSheet}
        className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-base font-semibold text-white transition-colors hover:bg-red-600 active:bg-red-700'
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Zap className='h-5 w-5' />
        Zap
      </motion.button>
    );
  };

  // Render current step content
  const renderStepContent = () => {
    switch (step) {
      case 'amount':
        return (
          <ZapAmountStep
            recipient={recipient}
            quickAmounts={quickAmounts}
            selectedAmount={selectedAmount}
            amountUSD={amountUSD}
            comment={comment}
            payRequest={payRequest}
            isPreparing={isPreparing}
            onSelectAmount={handleQuickAmountSelect}
            onCustomClick={handleCustomAmountClick}
            onCommentChange={setComment}
            onNext={handleProceedToConfirm}
            onClose={handleClose}
          />
        );
      case 'custom':
        return (
          <ZapCustomStep
            customAmount={customAmount}
            customAmountUSD={customAmountUSD}
            inputMode={inputMode}
            isPreparing={isPreparing}
            onNumberClick={handleNumberClick}
            onDelete={handleDelete}
            onToggleMode={toggleInputMode}
            onConfirm={handleCustomAmountConfirm}
            onBack={handleBack}
            onClose={handleClose}
          />
        );
      case 'confirm':
        return (
          <ZapConfirmStep
            recipient={recipient}
            selectedAmount={selectedAmount!}
            amountUSD={amountUSD}
            comment={comment}
            feeSats={prepareResponse?.feeSats}
            onConfirm={handleConfirmPayment}
            onBack={handleBack}
            onClose={handleClose}
          />
        );
      case 'sending':
        return <ZapSendingStep />;
      case 'success':
        return (
          <ZapSuccessStep
            selectedAmount={selectedAmount!}
            recipientName={recipientName}
            onClose={handleClose}
          />
        );
      case 'no-wallet':
        return <ZapNoWalletStep onClose={handleClose} />;
      default:
        return null;
    }
  };

  // Don't render anything if user is trying to zap themselves
  const isSelfZap = currentUsername && recipientUsername && currentUsername === recipientUsername;

  if (isSelfZap) {
    return null;
  }

  return (
    <>
      {renderTrigger()}

      <SheetWithDetentFull.Root
        presented={open}
        onPresentedChange={(presented) => {
          // Block closing during async operations
          if (!presented && step !== 'sending' && !isPreparing) {
            setOpen(false);
          }
        }}
      >
        <SheetWithDetentFull.Portal>
          <SheetWithDetentFull.View>
            <SheetWithDetentFull.Backdrop />
            <SheetWithDetentFull.Content className='grid h-full grid-rows-[1fr] md:!max-w-[500px]'>
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

                    {renderStepContent()}
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
