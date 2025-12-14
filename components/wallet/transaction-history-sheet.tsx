'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { VisuallyHidden } from '@silk-hq/components';
import { X } from 'lucide-react';
import { TransactionDetailsSheet } from './transaction-details-sheet';
import { TransactionHistory } from './transaction-history';

interface TransactionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  isLoading: boolean;
  onTransactionClick: (payment: Payment) => void;
  selectedTransaction?: Payment | null;
  onTransactionDetailsClose: () => void;
  isDetailsSheetOpen: boolean;
}

export function TransactionHistorySheet({
  open,
  onOpenChange,
  payments,
  isLoading,
  onTransactionClick,
  selectedTransaction,
  onTransactionDetailsClose,
  isDetailsSheetOpen,
}: TransactionHistorySheetProps) {
  return (
    <SheetWithDetentFull.Root presented={open} onPresentedChange={onOpenChange}>
      <SheetWithDetentFull.Portal>
        <SheetWithDetentFull.View>
          <SheetWithDetentFull.Backdrop />
          <SheetWithDetentFull.Content className='grid grid-rows-[min-content_1fr] md:!max-w-[600px]'>
            <div className='my-4 flex items-center'>
              <SheetWithDetentFull.Handle className='mx-auto h-1 w-12 rounded-full bg-gray-300' />
            </div>
            <VisuallyHidden.Root asChild>
              <SheetWithDetentFull.Title>Transaction History</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>
            <div className='flex items-center justify-between bg-white px-4 py-3 pt-0'>
              <h2 className='text-xl font-semibold text-gray-900'>Transaction History</h2>
              <button
                onClick={() => onOpenChange(false)}
                className='flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100'
              >
                <X className='h-5 w-5 text-gray-600' />
              </button>
            </div>
            <SheetWithDetentFull.ScrollRoot asChild>
              <SheetWithDetentFull.ScrollView className='min-h-0'>
                <SheetWithDetentFull.ScrollContent className='bg-white px-4 py-2 pb-8'>
                  <TransactionHistory
                    payments={payments}
                    isLoading={isLoading}
                    onRefresh={() => {
                      // Refresh is handled automatically by the hook
                    }}
                    onTransactionClick={onTransactionClick}
                  />
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>

            {/* Nested Transaction Details Sheet */}
            {selectedTransaction && (
              <TransactionDetailsSheet
                open={isDetailsSheetOpen}
                onOpenChange={(open) => !open && onTransactionDetailsClose()}
                payment={selectedTransaction}
              />
            )}
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
