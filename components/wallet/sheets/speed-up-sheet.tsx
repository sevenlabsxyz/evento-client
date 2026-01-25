'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { type DepositInfo } from '@/lib/services/breez-sdk';
import { VisuallyHidden } from '@silk-hq/components';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Loader2, Rocket, Settings, Turtle, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SpeedUpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deposit: DepositInfo | null;
  onConfirm: (deposit: DepositInfo, totalFeeSats: number) => void;
  isProcessing: boolean;
}

interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

type SpeedOption = 'fast' | 'normal' | 'slow' | 'custom';

// Submarine swap claim transaction size in vbytes
// These transactions spend from a P2WSH HTLC script and include witness data
// with the preimage, making them larger than standard P2WPKH transactions.
// Typical breakdown:
//   - Input (P2WSH HTLC spend with preimage witness): ~140-160 vbytes
//   - Output (P2WPKH or P2TR): ~31-43 vbytes
//   - Transaction overhead: ~10-11 vbytes
// Total: ~180-215 vbytes. Using 200 as a reasonable estimate with buffer.
const ESTIMATED_TX_VSIZE = 200;

export function SpeedUpSheet({
  open,
  onOpenChange,
  deposit,
  onConfirm,
  isProcessing,
}: SpeedUpSheetProps) {
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedOption | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customFeeRate, setCustomFeeRate] = useState('');
  const [feeEstimates, setFeeEstimates] = useState<FeeEstimates | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);

  // Fetch fee estimates from mempool.space
  const fetchFeeEstimates = useCallback(async () => {
    setIsLoadingFees(true);
    try {
      const res = await fetch('https://mempool.space/api/v1/fees/recommended');
      if (!res.ok) throw new Error('Failed to fetch fees');
      const data: FeeEstimates = await res.json();
      setFeeEstimates(data);
    } catch (error) {
      console.error('Failed to fetch fee estimates:', error);
      // Fallback to reasonable defaults
      setFeeEstimates({
        fastestFee: 10,
        halfHourFee: 8,
        hourFee: 5,
        economyFee: 2,
        minimumFee: 1,
      });
    } finally {
      setIsLoadingFees(false);
    }
  }, []);

  // Fetch fees when sheet opens
  useEffect(() => {
    if (open && deposit) {
      fetchFeeEstimates();
    }
  }, [open, deposit, fetchFeeEstimates]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setSelectedSpeed(null);
      setShowCustomInput(false);
      setCustomFeeRate('');
    }
  }, [open]);

  const formatAmount = (sats: number) => {
    return sats.toLocaleString();
  };

  const calculateFee = (feeRate: number) => {
    return Math.ceil(feeRate * ESTIMATED_TX_VSIZE);
  };

  const calculateReceiveAmount = (feeRate: number) => {
    if (!deposit) return 0;
    const fee = calculateFee(feeRate);
    return Math.max(0, deposit.amountSats - fee);
  };

  const getFeeRate = (): number | null => {
    if (!selectedSpeed) return null;
    if (selectedSpeed === 'custom') {
      const rate = parseFloat(customFeeRate);
      return isNaN(rate) || rate <= 0 ? null : rate;
    }
    if (!feeEstimates) return null;

    switch (selectedSpeed) {
      case 'fast':
        return feeEstimates.fastestFee;
      case 'normal':
        return feeEstimates.hourFee;
      case 'slow':
        return feeEstimates.economyFee;
      default:
        return null;
    }
  };

  const getSelectedFeeRate = (): number | null => {
    if (!selectedSpeed || !feeEstimates) return null;
    switch (selectedSpeed) {
      case 'fast':
        return feeEstimates.fastestFee;
      case 'normal':
        return feeEstimates.hourFee;
      case 'slow':
        return feeEstimates.economyFee;
      case 'custom':
        const rate = parseFloat(customFeeRate);
        return isNaN(rate) || rate <= 0 ? null : rate;
      default:
        return null;
    }
  };

  const handleSpeedSelect = (speed: SpeedOption) => {
    setSelectedSpeed(speed);
    if (speed === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  };

  const handleBack = () => {
    setShowCustomInput(false);
    setSelectedSpeed(null);
    setCustomFeeRate('');
  };

  const handleConfirm = () => {
    if (!deposit) return;
    const feeRate = getFeeRate();
    if (feeRate === null) return;
    // Calculate total fee in sats based on the estimated transaction size
    // This ensures the displayed fee matches what's passed to the SDK
    const totalFeeSats = calculateFee(feeRate);
    onConfirm(deposit, totalFeeSats);
  };

  const canConfirm = (): boolean => {
    if (!selectedSpeed) return false;
    if (selectedSpeed === 'custom') {
      const rate = parseFloat(customFeeRate);
      return !isNaN(rate) && rate > 0;
    }
    return true;
  };

  if (!deposit) return null;

  const selectedFeeRate = getSelectedFeeRate();

  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content>
            <div className='my-4 flex items-center'>
              <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
            </div>
            <VisuallyHidden.Root asChild>
              <SheetWithDetentFull.Title>Speed It Up</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>

            <div className='flex flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between px-4 pb-2'>
                <h2 className='text-xl font-semibold'>Speed It Up</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className='rounded-full p-2 transition-colors hover:bg-gray-100'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* Amount Display */}
              <div className='px-4 pb-4'>
                <p className='text-center text-gray-600'>
                  You have{' '}
                  <span className='font-semibold text-gray-900'>
                    {formatAmount(deposit.amountSats)} sats
                  </span>{' '}
                  incoming
                </p>
                {selectedSpeed && selectedSpeed !== 'custom' && selectedFeeRate && (
                  <p className='mt-2 text-center text-sm text-gray-500'>
                    You will receive{' '}
                    <span className='font-semibold text-gray-700'>
                      {formatAmount(calculateReceiveAmount(selectedFeeRate))} sats
                    </span>
                  </p>
                )}
                {selectedSpeed === 'custom' && customFeeRate && parseFloat(customFeeRate) > 0 && (
                  <p className='mt-2 text-center text-sm text-gray-500'>
                    You will receive{' '}
                    <span className='font-semibold text-gray-700'>
                      {formatAmount(calculateReceiveAmount(parseFloat(customFeeRate)))} sats
                    </span>
                  </p>
                )}
              </div>

              {/* Content */}
              <div className='px-4'>
                {isLoadingFees ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
                  </div>
                ) : (
                  <AnimatePresence mode='wait'>
                    {!showCustomInput ? (
                      <motion.div
                        key='options'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='space-y-3'
                      >
                        {/* Fast Option */}
                        <button
                          onClick={() => handleSpeedSelect('fast')}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedSpeed === 'fast'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100'>
                              <Rocket className='h-5 w-5 text-orange-600' />
                            </div>
                            <div className='flex-1'>
                              <div className='font-semibold text-gray-900'>Fast</div>
                              <div className='text-sm text-gray-600'>
                                ~10 minutes •{' '}
                                {feeEstimates
                                  ? `~${formatAmount(calculateFee(feeEstimates.fastestFee))} sats fee`
                                  : '...'}
                              </div>
                            </div>
                            {selectedSpeed === 'fast' && (
                              <div className='h-5 w-5 rounded-full bg-gray-900' />
                            )}
                          </div>
                        </button>

                        {/* Normal Option */}
                        <button
                          onClick={() => handleSpeedSelect('normal')}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedSpeed === 'normal'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                              <Clock className='h-5 w-5 text-blue-600' />
                            </div>
                            <div className='flex-1'>
                              <div className='font-semibold text-gray-900'>Normal</div>
                              <div className='text-sm text-gray-600'>
                                ~1 hour •{' '}
                                {feeEstimates
                                  ? `~${formatAmount(calculateFee(feeEstimates.hourFee))} sats fee`
                                  : '...'}
                              </div>
                            </div>
                            {selectedSpeed === 'normal' && (
                              <div className='h-5 w-5 rounded-full bg-gray-900' />
                            )}
                          </div>
                        </button>

                        {/* Slow Option */}
                        <button
                          onClick={() => handleSpeedSelect('slow')}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedSpeed === 'slow'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100'>
                              <Turtle className='h-5 w-5 text-green-600' />
                            </div>
                            <div className='flex-1'>
                              <div className='font-semibold text-gray-900'>Slow</div>
                              <div className='text-sm text-gray-600'>
                                ~12 hours •{' '}
                                {feeEstimates
                                  ? `~${formatAmount(calculateFee(feeEstimates.economyFee))} sats fee`
                                  : '...'}
                              </div>
                            </div>
                            {selectedSpeed === 'slow' && (
                              <div className='h-5 w-5 rounded-full bg-gray-900' />
                            )}
                          </div>
                        </button>

                        {/* Custom Option */}
                        <button
                          onClick={() => handleSpeedSelect('custom')}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedSpeed === 'custom'
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'>
                              <Settings className='h-5 w-5 text-purple-600' />
                            </div>
                            <div className='flex-1'>
                              <div className='font-semibold text-gray-900'>Custom</div>
                              <div className='text-sm text-gray-600'>Set your own fee rate</div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key='custom'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className='space-y-4'
                      >
                        <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                          <label className='mb-2 block text-sm font-medium text-gray-900'>
                            Fee Rate (sat/vbyte)
                          </label>
                          <div className='flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3'>
                            <input
                              type='number'
                              value={customFeeRate}
                              onChange={(e) => setCustomFeeRate(e.target.value)}
                              className='flex-1 border-none bg-transparent text-lg outline-none'
                              placeholder='Enter fee rate'
                              min='1'
                              step='0.1'
                              autoFocus
                            />
                            <span className='text-sm text-gray-600'>sat/vbyte</span>
                          </div>
                          {customFeeRate && parseFloat(customFeeRate) > 0 && (
                            <p className='mt-2 text-sm text-gray-600'>
                              Estimated fee: ~
                              {formatAmount(calculateFee(parseFloat(customFeeRate)))} sats
                            </p>
                          )}
                        </div>

                        {/* Reference rates */}
                        {feeEstimates && (
                          <div className='rounded-lg bg-gray-100 p-3'>
                            <p className='mb-2 text-xs font-medium text-gray-500'>
                              Current network rates
                            </p>
                            <div className='grid grid-cols-3 gap-2 text-center text-xs'>
                              <div>
                                <div className='font-semibold text-gray-900'>
                                  {feeEstimates.fastestFee}
                                </div>
                                <div className='text-gray-500'>Fast</div>
                              </div>
                              <div>
                                <div className='font-semibold text-gray-900'>
                                  {feeEstimates.hourFee}
                                </div>
                                <div className='text-gray-500'>Normal</div>
                              </div>
                              <div>
                                <div className='font-semibold text-gray-900'>
                                  {feeEstimates.economyFee}
                                </div>
                                <div className='text-gray-500'>Slow</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Actions - Stacked vertically */}
              <div className='mt-6 space-y-3 px-4 pb-6'>
                <Button
                  onClick={showCustomInput ? handleBack : () => onOpenChange(false)}
                  variant='outline'
                  className='h-12 w-full rounded-full'
                  disabled={isProcessing}
                >
                  {showCustomInput ? 'Back' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleConfirm}
                  className='h-12 w-full rounded-full'
                  disabled={!canConfirm() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Processing...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </Button>
              </div>
            </div>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
