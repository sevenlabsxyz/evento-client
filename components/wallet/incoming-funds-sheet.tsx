'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { breezSDK, type DepositInfo, type Fee } from '@/lib/services/breez-sdk';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import { CheckCircle2, ExternalLink, Info, Loader2, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface IncomingFundsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function IncomingFundsSheet({ open, onOpenChange, onRefresh }: IncomingFundsSheetProps) {
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTxid, setProcessingTxid] = useState<string | null>(null);
  const [feeType, setFeeType] = useState<'fixed' | 'rate'>('rate');
  const [feeValue, setFeeValue] = useState('1');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(null);
  const [activeDetent, setActiveDetent] = useState(2);

  const loadDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const depositList = await breezSDK.listUnclaimedDeposits();
      setDeposits(depositList);
    } catch (error: any) {
      console.error('Failed to load deposits:', error);
      toast.error('Failed to load incoming funds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadDeposits();
    }
  }, [open, loadDeposits]);

  useEffect(() => {
    if (!open) return;

    // Listen for deposit events to auto-refresh
    const unsubscribe = breezSDK.onEvent((event) => {
      if (
        event.type === 'synced' ||
        event.type === 'claimedDeposits' ||
        event.type === 'unclaimedDeposits'
      ) {
        void loadDeposits();
        onRefresh?.();
      }
    });

    return () => unsubscribe();
  }, [open, loadDeposits, onRefresh]);

  const handleClaimDeposit = async (deposit: DepositInfo) => {
    setProcessingTxid(deposit.txid);
    try {
      const maxFee: Fee =
        feeType === 'fixed'
          ? { type: 'fixed', amount: Math.floor(Number(feeValue)) }
          : { type: 'rate', satPerVbyte: Number(feeValue) };

      await breezSDK.claimDeposit(deposit.txid, deposit.vout, maxFee);
      toast.success('Swap completed successfully!');
      await loadDeposits();
      onRefresh?.();
      setSelectedDeposit(null);
    } catch (error: any) {
      console.error('Failed to swap:', error);
      toast.error(error.message || 'Failed to complete swap');
    } finally {
      setProcessingTxid(null);
    }
  };

  const formatAmount = (sats: number) => {
    return sats.toLocaleString();
  };

  const truncateTxid = (txid: string) => {
    return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
  };

  return (
    <>
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
                <SheetWithDetent.Title>Incoming Onchain Funds</SheetWithDetent.Title>
              </VisuallyHidden.Root>

              <div className='flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between p-4'>
                  <h2 className='text-xl font-semibold'>Incoming Onchain Funds</h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className='rounded-full p-2 transition-colors hover:bg-gray-100'
                  >
                    <X className='h-5 w-5' />
                  </button>
                </div>

                {/* Content */}
                <div className='p-4 pt-0'>
                  {isLoading ? (
                    // Loading State
                    <div className='flex items-center justify-center py-12'>
                      <div className='text-center'>
                        <Loader2 className='mx-auto h-8 w-8 animate-spin text-gray-400' />
                        <p className='mt-4 text-sm text-gray-600'>Loading...</p>
                      </div>
                    </div>
                  ) : deposits.length === 0 ? (
                    // Empty State
                    <div className='flex flex-col items-center justify-center py-12'>
                      <div className='rounded-full bg-green-100 p-4'>
                        <CheckCircle2 className='h-12 w-12 text-green-600' />
                      </div>
                      <h3 className='mt-4 text-lg font-semibold text-gray-900'>All Set!</h3>
                      <p className='mt-2 max-w-sm text-center text-sm text-gray-600'>
                        No pending funds. We automatically swap Bitcoin to Lightning when fees are
                        low.
                      </p>
                    </div>
                  ) : (
                    // Deposits List
                    <div className='space-y-4'>
                      {/* Info Banner */}
                      <div className='rounded-xl border border-blue-200 bg-blue-50 p-4'>
                        <div className='flex items-start gap-3'>
                          <Info className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />
                          <p className='text-sm text-blue-900'>
                            Your Bitcoin is waiting! We'll automatically swap it to Lightning when
                            fees drop. To complete the swap now, you can increase the fee below.
                          </p>
                        </div>
                      </div>

                      {/* Deposits */}
                      {deposits.map((deposit) => (
                        <div
                          key={`${deposit.txid}:${deposit.vout}`}
                          className='rounded-xl border border-gray-200 bg-white p-4'
                        >
                          {/* Deposit Header */}
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <h3 className='font-semibold text-gray-900'>
                                  {formatAmount(deposit.amountSats)} sats
                                </h3>
                                {deposit.confirmations > 0 ? (
                                  <span className='inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'>
                                    <CheckCircle2 className='h-3 w-3' />
                                    {deposit.confirmations} confirms
                                  </span>
                                ) : (
                                  <span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700'>
                                    <Loader2 className='h-3 w-3 animate-spin' />
                                    Pending
                                  </span>
                                )}
                              </div>
                              <div className='mt-1 flex items-center gap-1 font-mono text-xs text-gray-600'>
                                <span>{truncateTxid(deposit.txid)}</span>
                                <a
                                  href={`https://mempool.space/tx/${deposit.txid}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:text-blue-700'
                                >
                                  <ExternalLink className='h-3 w-3' />
                                </a>
                              </div>
                            </div>

                            {/* Swap Now Button */}
                            <Button
                              onClick={() => setSelectedDeposit(deposit)}
                              disabled={processingTxid === deposit.txid}
                              size='sm'
                              className='rounded-full'
                            >
                              {processingTxid === deposit.txid ? (
                                <>
                                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                  Swapping...
                                </>
                              ) : (
                                'Swap Now'
                              )}
                            </Button>
                          </div>

                          {/* Error Info */}
                          {deposit.error && (
                            <div className='mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3'>
                              <div className='flex items-start gap-2'>
                                <XCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600' />
                                <div className='flex-1'>
                                  <p className='text-xs font-medium text-orange-900'>
                                    Auto-swap delayed
                                  </p>
                                  <p className='mt-0.5 text-xs text-orange-700'>
                                    {deposit.error.type === 'depositClaimFeeExceeded'
                                      ? `Network fee of ${deposit.error.actualFee} sats is too high (waiting for fees below 1 sat/vbyte)`
                                      : deposit.error.type === 'missingUtxo'
                                        ? 'Transaction output not found'
                                        : deposit.error.message || 'Unknown error'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SheetWithDetent.Content>
          </SheetWithDetent.View>
        </SheetWithDetent.Portal>
      </SheetWithDetent.Root>

      {/* Claim Modal */}
      {selectedDeposit && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6'>
            <h2 className='text-lg font-semibold text-gray-900'>Complete Swap</h2>
            <p className='mt-1 text-sm text-gray-600'>
              Set the maximum network fee you're willing to pay to complete this swap to Lightning.
            </p>

            {/* Amount */}
            <div className='mt-4 rounded-lg bg-gray-50 p-4'>
              <p className='text-sm text-gray-600'>Amount</p>
              <p className='text-2xl font-bold text-gray-900'>
                {formatAmount(selectedDeposit.amountSats)} sats
              </p>
            </div>

            {/* Fee Input */}
            <div className='mt-4 space-y-3'>
              <label className='text-sm font-medium text-gray-900'>Maximum Network Fee</label>

              {/* Fee Type Toggle */}
              <div className='flex gap-2 rounded-lg bg-gray-100 p-1'>
                <button
                  onClick={() => setFeeType('rate')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    feeType === 'rate'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Rate
                </button>
                <button
                  onClick={() => setFeeType('fixed')}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    feeType === 'fixed'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Fixed
                </button>
              </div>

              {/* Fee Value Input */}
              <div className='flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3'>
                <input
                  type='number'
                  value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                  className='flex-1 border-none bg-transparent text-sm outline-none'
                  placeholder='Enter fee'
                  min='0'
                  step={feeType === 'rate' ? '0.1' : '1'}
                />
                <span className='text-sm text-gray-600'>
                  {feeType === 'rate' ? 'sat/vbyte' : 'sats'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className='mt-6 flex gap-3'>
              <Button
                onClick={() => setSelectedDeposit(null)}
                variant='outline'
                className='flex-1 rounded-full'
                disabled={processingTxid === selectedDeposit.txid}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleClaimDeposit(selectedDeposit)}
                className='flex-1 rounded-full'
                disabled={
                  !feeValue || Number(feeValue) <= 0 || processingTxid === selectedDeposit.txid
                }
              >
                {processingTxid === selectedDeposit.txid ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Swapping...
                  </>
                ) : (
                  'Complete Swap'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
