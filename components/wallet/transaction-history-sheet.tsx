'use client';

import { SheetWithDetentFull } from '@/components/ui/sheet-with-detent-full';
import { Payment } from '@breeztech/breez-sdk-spark/web';
import { VisuallyHidden } from '@silk-hq/components';
import { X } from 'lucide-react';
import { TransactionHistory } from './transaction-history';

interface TransactionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
  isLoading: boolean;
  onTransactionClick: (payment: Payment) => void;
}

export function TransactionHistorySheet({
  open,
  onOpenChange,
  payments,
  isLoading,
  onTransactionClick,
}: TransactionHistorySheetProps) {
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
              <SheetWithDetentFull.Title>Transaction History</SheetWithDetentFull.Title>
            </VisuallyHidden.Root>
            <SheetWithDetentFull.ScrollRoot>
              <SheetWithDetentFull.ScrollView>
                <SheetWithDetentFull.ScrollContent>
                  <div className='flex items-center justify-between border-b p-6'>
                    <h2 className='text-xl font-semibold'>Transaction History</h2>
                    <button
                      onClick={() => onOpenChange(false)}
                      className='rounded-full p-2 transition-colors hover:bg-gray-100'
                    >
                      <X className='h-5 w-5' />
                    </button>
                  </div>
                  <div className='p-6'>
                    <TransactionHistory
                      payments={payments}
                      isLoading={isLoading}
                      onRefresh={() => {
                        // Refresh is handled automatically by the hook
                      }}
                      onTransactionClick={onTransactionClick}
                    />
                  </div>
                </SheetWithDetentFull.ScrollContent>
              </SheetWithDetentFull.ScrollView>
            </SheetWithDetentFull.ScrollRoot>
          </SheetWithDetentFull.Content>
        </SheetWithDetentFull.View>
      </SheetWithDetentFull.Portal>
    </SheetWithDetentFull.Root>
  );
}
