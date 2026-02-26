export type Step = 'amount' | 'custom' | 'confirm' | 'sending' | 'success' | 'no-wallet';

import type { LnurlPayRequestDetails as BreezLnurlPayRequestDetails } from '@breeztech/breez-sdk-spark/web';

export interface ZapSheetProps {
  recipientLightningAddress: string;
  recipientName: string;
  recipientUsername?: string;
  recipientAvatar?: string;
  children?: React.ReactNode;
  quickAmounts?: number[];
  onSuccess?: (amountSats: number) => void;
  onError?: (error: Error) => void;
  currentUsername?: string;
}

export type LnurlPayRequestDetails = BreezLnurlPayRequestDetails;

export interface RecipientInfo {
  name: string;
  username?: string;
  avatar?: string;
  lightningAddress: string;
}
