export type Step = 'amount' | 'custom' | 'confirm' | 'sending' | 'success' | 'no-wallet';

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

export interface LnurlPayRequestDetails {
  commentAllowed: number;
  minSendable: number;
  maxSendable: number;
  [key: string]: unknown;
}

export interface RecipientInfo {
  name: string;
  username?: string;
  avatar?: string;
  lightningAddress: string;
}
