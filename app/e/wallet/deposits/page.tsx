'use client';

import { Button } from '@/components/ui/button';
import { breezSDK, type DepositInfo, type Fee } from '@/lib/services/breez-sdk';
import { toast } from '@/lib/utils/toast';
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTxid, setProcessingTxid] = useState<string | null>(null);
  const [feeType, setFeeType] = useState<'fixed' | 'rate'>('rate');
  const [feeValue, setFeeValue] = useState('1');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(null);

  const loadDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const depositList = await breezSDK.listUnclaimedDeposits();
      setDeposits(depositList);
    } catch (error: any) {
      console.error('Failed to load deposits:', error);
      toast.error('Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeposits();

    // Listen for deposit events to auto-refresh
    const unsubscribe = breezSDK.onEvent((event) => {
      if (
        event.type === 'synced' ||
        event.type === 'claimedDeposits' ||
        event.type === 'unclaimedDeposits'
      ) {
        void loadDeposits();
      }
    });

    return () => unsubscribe();
  }, [loadDeposits]);

  const handleClaimDeposit = async (deposit: DepositInfo) => {
    setProcessingTxid(deposit.txid);
    try {
      const maxFee: Fee =
        feeType === 'fixed'
          ? { type: 'fixed', amount: Math.floor(Number(feeValue)) }
          : { type: 'rate', satPerVbyte: Number(feeValue) };

      await breezSDK.claimDeposit(deposit.txid, deposit.vout, maxFee);
      toast.success('Deposit claimed successfully!');
      await loadDeposits();
      setSelectedDeposit(null);
    } catch (error: any) {
      console.error('Failed to claim deposit:', error);
      toast.error(error.message || 'Failed to claim deposit');
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

  if (isLoading) {
    return (
      <div className='flex min-h-screen flex-col bg-gray-50'>
        {/* Header */}
        <div className='border-b bg-white'>
          <div className='mx-auto flex max-w-2xl items-center gap-4 p-4'>
            <Link href='/e/wallet'>
              <Button variant='ghost' size='sm' className='rounded-full'>
                <ArrowLeft className='h-5 w-5' />
              </Button>
            </Link>
            <h1 className='text-xl font-semibold'>Deposits</h1>
          </div>
        </div>

        {/* Loading State */}
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <Loader2 className='mx-auto h-8 w-8 animate-spin text-gray-400' />
            <p className='mt-4 text-sm text-gray-600'>Loading deposits...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col bg-gray-50'>
      {/* Header */}
      <div className='border-b bg-white'>
        <div className='mx-auto flex max-w-2xl items-center gap-4 p-4'>
          <Link href='/e/wallet'>
            <Button variant='ghost' size='sm' className='rounded-full'>
              <ArrowLeft className='h-5 w-5' />
            </Button>
          </Link>
          <h1 className='text-xl font-semibold'>Deposits</h1>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto w-full max-w-2xl flex-1 p-4'>
        {deposits.length === 0 ? (
          // Empty State
          <div className='flex flex-col items-center justify-center py-12'>
            <div className='rounded-full bg-green-100 p-4'>
              <CheckCircle2 className='h-12 w-12 text-green-600' />
            </div>
            <h2 className='mt-4 text-lg font-semibold text-gray-900'>No Unclaimed Deposits</h2>
            <p className='mt-2 max-w-sm text-center text-sm text-gray-600'>
              Auto-claiming is enabled. Deposits appear here only if fees exceed 1 sat/vbyte.
            </p>
            <Link href='/e/wallet'>
              <Button variant='outline' className='mt-6 rounded-full'>
                Back to Wallet
              </Button>
            </Link>
          </div>
        ) : (
          // Deposits List
          <div className='space-y-4'>
            {/* Info Banner */}
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
              <p className='text-sm text-blue-900'>
                These deposits couldn't be auto-claimed because their fees exceeded the threshold.
                You can manually claim them below.
              </p>
            </div>

            {/* Deposits */}
            {deposits.map((deposit) => (
              <div
                key={`${deposit.txid}:${deposit.vout}`}
                className='rounded-lg border border-gray-200 bg-white p-4'
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

                  {/* Claim Button */}
                  <Button
                    onClick={() => setSelectedDeposit(deposit)}
                    disabled={processingTxid === deposit.txid}
                    size='sm'
                    className='rounded-full'
                  >
                    {processingTxid === deposit.txid ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Claiming...
                      </>
                    ) : (
                      'Claim'
                    )}
                  </Button>
                </div>

                {/* Error Info */}
                {deposit.error && (
                  <div className='mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3'>
                    <div className='flex items-start gap-2'>
                      <XCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600' />
                      <div className='flex-1'>
                        <p className='text-xs font-medium text-orange-900'>Auto-claim failed</p>
                        <p className='mt-0.5 text-xs text-orange-700'>
                          {deposit.error.type === 'depositClaimFeeExceeded'
                            ? `Fee of ${deposit.error.actualFee} sats exceeded max (1 sat/vbyte)`
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

      {/* Claim Modal */}
      {selectedDeposit && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6'>
            <h2 className='text-lg font-semibold text-gray-900'>Claim Deposit</h2>
            <p className='mt-1 text-sm text-gray-600'>
              Set the maximum fee you're willing to pay to claim this deposit.
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
              <label className='text-sm font-medium text-gray-900'>Maximum Fee</label>

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
                    Claiming...
                  </>
                ) : (
                  'Claim Deposit'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
