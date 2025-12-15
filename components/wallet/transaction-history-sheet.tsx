'use client';

import { MasterScrollableSheet } from '@/components/ui/master-scrollable-sheet';
import { Payment } from '@breeztech/breez-sdk-spark/web';
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
    <MasterScrollableSheet
      title='Transaction History'
      open={open}
      onOpenChange={onOpenChange}
      contentClassName='px-4 py-2 pb-8'
    >
      <TransactionHistory
        payments={payments}
        isLoading={isLoading}
        onRefresh={() => {}}
        onTransactionClick={onTransactionClick}
      />

      {/* Nested Transaction Details Sheet */}
      {selectedTransaction && (
        <TransactionDetailsSheet
          open={isDetailsSheetOpen}
          onOpenChange={(open) => !open && onTransactionDetailsClose()}
          payment={selectedTransaction}
        />
      )}
    </MasterScrollableSheet>
  );
}
