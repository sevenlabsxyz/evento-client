'use client';

'use client';

import { Button } from '@/components/ui/button';
import { SheetWithDetent } from '@/components/ui/sheet-with-detent';
import { breezSDK, type DepositInfo, type Fee } from '@/lib/services/breez-sdk';
import {
  BREEZ_ERROR_CONTEXT,
  getBreezErrorMessage,
  logBreezError,
} from '@/lib/utils/breez-error-handler';
import { toast } from '@/lib/utils/toast';
import { VisuallyHidden } from '@silk-hq/components';
import {
  ArrowRight,
  CheckCircle2,
  ChevronsRight,
  ExternalLink,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SpeedUpSheet } from './sheets/speed-up-sheet';

/**
 * Version-skew carrier for the claimDeposit result: the installed 0.17.1
 * `ClaimDepositResponse` is `{ payment }`, while 0.26.0 is `{ outcome }`.
 * Binding through this named type keeps the read checked without an inline
 * cast; post-upgrade it can be dropped for the SDK's own response type.
 */
type ClaimResultWithOutcome = { payment?: unknown; outcome?: ClaimOutcome };

/**
 * Outcome of a deposit claim, per breez-sdk-spark 0.26.0's ClaimDepositResponse.
 * The installed 0.17.1 returns only `{ payment }` (no `outcome`), so that legacy
 * shape is the `outcome === undefined` branch below. Structurally narrowed so
 * this compiles against 0.17.1 today; post-upgrade the local type can be
 * replaced by the SDK's own `ClaimDepositResponse['outcome']`.
 */
type ClaimOutcome =
  | { type: 'settled'; payment: unknown }
  | { type: 'submitted' }
  | {
      type: 'deferred';
      reason:
        | { type: 'maxFeeExceeded'; requiredFeeSats?: unknown; maxFeeSats?: unknown }
        | { type: 'noEarlyClaimAvailable' }
        | { type: 'providerDeclined'; message?: string };
    };

interface IncomingFundsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function IncomingFundsSheet({ open, onOpenChange, onRefresh }: IncomingFundsSheetProps) {
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingTxid, setProcessingTxid] = useState<string | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositInfo | null>(null);
  const [showSpeedUpSheet, setShowSpeedUpSheet] = useState(false);
  const [activeDetent, setActiveDetent] = useState(2);

  const loadDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const depositList = await breezSDK.listUnclaimedDeposits();
      setDeposits(depositList);
    } catch (error: any) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.LISTING_UNCLAIMED_DEPOSITS);
      const userMessage = getBreezErrorMessage(error, 'load incoming funds');
      toast.error(userMessage);
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

  const handleClaimDeposit = async (deposit: DepositInfo, totalFeeSats: number) => {
    setProcessingTxid(deposit.txid);
    try {
      // Use fixed fee type with the total sats amount calculated in speed-up-sheet
      // This ensures the fee displayed to the user matches what's passed to the SDK,
      // avoiding issues where rate-based fees could result in different totals
      // depending on the actual transaction size.
      const maxFee: Fee = { type: 'fixed', amount: totalFeeSats };

      const result = await breezSDK.claimDeposit(deposit.txid, deposit.vout, maxFee);

      // 0.26.0+: claim result carries an `outcome`; 0.17.1 returns `{ payment }`
      // only, in which case `outcome` is undefined and the claim settled
      // immediately (legacy path).
      const claimResult: ClaimResultWithOutcome = result;
      const outcome = claimResult.outcome;

      if (outcome?.type === 'settled' || outcome === undefined) {
        toast.success('Swap completed successfully!');
      } else if (outcome.type === 'submitted') {
        toast.info('Claim submitted — it will complete automatically.');
      } else if (outcome.type === 'deferred') {
        const reason = outcome.reason;
        if (reason.type === 'maxFeeExceeded') {
          const feeParts: string[] = [];
          const { requiredFeeSats, maxFeeSats } = reason;
          if (typeof requiredFeeSats === 'number' || typeof requiredFeeSats === 'bigint') {
            feeParts.push(`required: ${requiredFeeSats.toLocaleString()} sats`);
          }
          if (typeof maxFeeSats === 'number' || typeof maxFeeSats === 'bigint') {
            feeParts.push(`limit: ${maxFeeSats.toLocaleString()} sats`);
          }
          const feeDetail = feeParts.length > 0 ? ` (${feeParts.join(', ')})` : '';
          toast.error(
            `Claim fee would exceed the selected max fee. It will be retried automatically within your fee limit.${feeDetail}`
          );
        } else if (reason.type === 'providerDeclined' && reason.message) {
          toast.warning(`Claim deferred: ${reason.type} (${reason.message})`);
        } else {
          toast.warning(`Claim deferred: ${reason.type}`);
        }
      } else {
        toast.success('Swap completed successfully!');
      }
      await loadDeposits();
      onRefresh?.();
      setSelectedDeposit(null);
      setShowSpeedUpSheet(false);
    } catch (error: any) {
      logBreezError(error, BREEZ_ERROR_CONTEXT.CLAIMING_DEPOSIT);
      const userMessage = getBreezErrorMessage(error, 'claim deposit');
      toast.error(userMessage);
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
                <SheetWithDetent.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300 dark:bg-neutral-600' />
              </div>
              <VisuallyHidden.Root asChild>
                <SheetWithDetent.Title>Incoming Funds</SheetWithDetent.Title>
              </VisuallyHidden.Root>

              <div className='flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between p-4'>
                  <h2 className='text-xl font-semibold'>Incoming Funds</h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className='rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800'
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
                        <Loader2 className='mx-auto h-8 w-8 animate-spin text-gray-400 dark:text-neutral-500' />
                        <p className='mt-4 text-sm text-gray-600 dark:text-neutral-400'>
                          Loading...
                        </p>
                      </div>
                    </div>
                  ) : deposits.length === 0 ? (
                    // Empty State
                    <div className='flex flex-col items-center justify-center py-12'>
                      <div className='rounded-full bg-green-100 p-4 dark:bg-green-950/60'>
                        <CheckCircle2 className='h-12 w-12 text-green-600 dark:text-green-400' />
                      </div>
                      <h3 className='mt-4 text-lg font-semibold text-gray-900 dark:text-neutral-100'>
                        All Set!
                      </h3>
                      <p className='mt-2 max-w-sm text-center text-sm text-gray-600 dark:text-neutral-400'>
                        No pending funds. We automatically swap Bitcoin to Lightning when fees are
                        low.
                      </p>
                    </div>
                  ) : (
                    // Deposits List
                    <div className='space-y-4'>
                      {/* Info Banner */}
                      <div className='rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'>
                        <div className='flex items-start gap-3'>
                          <ChevronsRight className='mt-0.5 h-7 w-7 flex-shrink-0 text-muted-foreground/80' />
                          <p className='text-sm text-muted-foreground'>
                            Your Bitcoin is on its way! It will be added to your balance
                            automatically when the network clears up. Want it faster? Pay a small
                            fee to get it now.
                          </p>
                        </div>
                      </div>

                      {/* Deposits */}
                      {deposits.map((deposit) => (
                        <div
                          key={`${deposit.txid}:${deposit.vout}`}
                          className='rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950'
                        >
                          {/* Deposit Header */}
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <h3 className='font-semibold text-gray-900 dark:text-neutral-100'>
                                  {formatAmount(deposit.amountSats)} sats
                                </h3>
                                {deposit.claimError ? (
                                  <span className='inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400'>
                                    <XCircle className='h-3 w-3' />
                                    Needs action
                                  </span>
                                ) : (
                                  <span className='inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'>
                                    <Loader2 className='h-3 w-3 animate-spin' />
                                    Pending
                                  </span>
                                )}
                              </div>
                              <div className='mt-1 flex items-center gap-1 font-mono text-xs text-gray-600 dark:text-neutral-400'>
                                <span>{truncateTxid(deposit.txid)}</span>
                                <a
                                  href={`https://mempool.space/tx/${deposit.txid}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-400'
                                >
                                  <ExternalLink className='h-3 w-3' />
                                </a>
                              </div>
                            </div>

                            {/* Speed It Up Button */}
                            <Button
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowSpeedUpSheet(true);
                              }}
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
                                <>
                                  <span>Get It Now</span>
                                  <ArrowRight className='h-4 w-4' />
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Error Info */}
                          {deposit.claimError && (
                            <div className='mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40'>
                              <div className='flex items-start gap-2'>
                                <XCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400' />
                                <div className='flex-1'>
                                  <p className='text-xs font-medium text-orange-900 dark:text-orange-400'>
                                    Auto-swap delayed
                                  </p>
                                  <p className='mt-0.5 text-xs text-orange-700 dark:text-orange-400'>
                                    {deposit.claimError.type === 'maxDepositClaimFeeExceeded'
                                      ? `Network fee of ${deposit.claimError.requiredFeeSats} sats exceeds auto-claim limit — claim manually or wait for lower fees`
                                      : deposit.claimError.type === 'missingUtxo'
                                        ? 'Transaction output not found'
                                        : deposit.claimError.type === 'generic'
                                          ? deposit.claimError.message || 'Unknown error'
                                          : 'Unknown error'}
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

      {/* Speed Up Sheet */}
      <SpeedUpSheet
        open={showSpeedUpSheet}
        onOpenChange={(open) => {
          setShowSpeedUpSheet(open);
          if (!open) setSelectedDeposit(null);
        }}
        deposit={selectedDeposit}
        onConfirm={handleClaimDeposit}
        isProcessing={processingTxid === selectedDeposit?.txid}
      />
    </>
  );
}
